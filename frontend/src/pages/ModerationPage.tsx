import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  FolderOpen,
  Tag,
  MapPin,
  Calendar,
  HelpCircle,
  Hash,
  ArrowLeft,
  User,
  Radio,
  Ban,
  MessageSquare,
  CornerDownRight,
} from 'lucide-react';
import { apiClient, JWT_TOKEN_KEY } from '../api/apiClient';
import { SearchableSelect } from '../components/SearchableSelect';
import type { AuthUserResponse, DictOption } from '../types/auth';

const USER_PROFILE_STORAGE = 'mysurvey_user_profile';
const PAGE_SIZE = 10;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

type SurveyTypeOption = 'SingleChoice' | 'MultipleChoice' | 'Numeric';
type ModerationStatusOption = 'Active' | 'Pending' | 'Rejected' | 'Closed' | 'Archived';
type ModerationTab = 'pending' | 'active';

interface ModerationSurveyItem {
  surveyId: number;
  surveyText: string;
  surveyType: SurveyTypeOption;
  topicId: number;
  topicName?: string | null;
  domainId?: number | null;
  regionTargetId?: number | null;
  regionName?: string | null;
  createdAt: string;
  expiresAt: string;
  status: string;
  rejectionReason?: string | null;
  authorNickname?: string | null;
  options: { optionText: string; orderIndex: number }[];
}

interface EditFormState {
  surveyText: string;
  surveyType: SurveyTypeOption;
  domainId: string;
  topicId: string;
  regionTargetId: string;
  expiresAtLocal: string;
  status: ModerationStatusOption;
  rejectionReason: string;
  options: string[];
}

interface CommentReply {
  replyId: number;
  createdAt: string;
  text: string;
  nickname: string;
}

interface SurveyComment {
  commentId: number;
  createdAt: string;
  text: string;
  nickname: string;
  nextReplyId: number;
  replies: CommentReply[];
}

interface CommentsApiResponse {
  id?: string;
  surveyId: number;
  nextCommentId: number;
  comments: SurveyComment[];
}

function getRoleFromJwt(): string {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (!token) return '';
  try {
    const payloadBase64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!payloadBase64) return '';
    const decoded = JSON.parse(atob(payloadBase64));
    const rawRole =
      decoded.role ??
      decoded.userType ??
      decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      '';
    return Array.isArray(rawRole) ? String(rawRole[0] ?? '') : String(rawRole);
  } catch {
    return '';
  }
}

function checkCanModerate(profile: AuthUserResponse | null): boolean {
  const rawRole =
    profile?.userType ??
    (profile as any)?.role ??
    (profile as any)?.userRole ??
    getRoleFromJwt();

  const val = String(rawRole ?? '').trim().toLowerCase();
  return val === '2' || val === '3' || val === 'moderator' || val === 'admin';
}

function normalizeSurveyType(rawType?: string | number | null): SurveyTypeOption {
  const val = String(rawType ?? '').trim().toLowerCase();
  if (
    val === '1' ||
    val === 'multiple' ||
    val === 'multiplechoice' ||
    val === 'multiple_choice'
  ) {
    return 'MultipleChoice';
  }
  if (
    val === '2' ||
    val === 'numeric' ||
    val === 'range' ||
    val === 'scale'
  ) {
    return 'Numeric';
  }
  return 'SingleChoice';
}

function formatSurveyTypeLabel(type: SurveyTypeOption): string {
  if (type === 'MultipleChoice') return 'Кілька варіантів';
  if (type === 'Numeric') return 'Числова відповідь';
  return 'Один варіант';
}

function toDatetimeLocalValue(isoString?: string | null): string {
  const parsed = isoString ? new Date(isoString) : null;
  const date =
    parsed && !Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 2000
      ? parsed
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return 'Не вказано';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return 'Не вказано';

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function mapSurveyDomains(rawList: any[]): DictOption[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => ({
      id: Number(item.surveyDomainId ?? item.domainId ?? item.id ?? 0),
      name: String(item.surveyDomainName ?? item.domainName ?? item.name ?? ''),
    }))
    .filter((item) => item.id > 0 && item.name.length > 0);
}

function mapTopics(rawList: any[]): DictOption[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => ({
      id: Number(item.topicId ?? item.id ?? 0),
      name: String(item.topicName ?? item.name ?? ''),
    }))
    .filter((item) => item.id > 0 && item.name.length > 0);
}

function mapRegions(rawList: any[]): DictOption[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => ({
      id: Number(item.regionId ?? item.id ?? 0),
      name: String(item.regionName ?? item.name ?? ''),
    }))
    .filter((item) => item.id > 0 && item.name.length > 0);
}

function normalizeSurveysResponse(raw: any): {
  items: ModerationSurveyItem[];
  totalCount: number;
  totalPages: number;
} {
  const rawList = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.surveys)
    ? raw.surveys
    : [];

  const mapped: ModerationSurveyItem[] = rawList.map((item: any, index: number) => {
    const rawOptions = Array.isArray(item.options ?? item.surveyOptions)
      ? item.options ?? item.surveyOptions
      : [];

    const sortedOptions = [...rawOptions]
      .sort((a, b) => Number(a.orderIndex ?? 0) - Number(b.orderIndex ?? 0))
      .map((opt: any, idx: number) => ({
        optionText: String(opt.optionText ?? opt.text ?? ''),
        orderIndex: Number(opt.orderIndex ?? idx),
      }));

    return {
      surveyId: Number(item.surveyId ?? item.id ?? index + 1),
      surveyText: String(item.surveyText ?? item.questionText ?? item.text ?? ''),
      surveyType: normalizeSurveyType(item.surveyType ?? item.type),
      topicId: Number(item.topicId ?? item.topic?.topicId ?? 0),
      topicName: item.topicName ?? item.topic?.topicName ?? item.topic?.name ?? null,
      domainId:
        item.surveyDomainId ??
        item.domainId ??
        item.topic?.surveyDomainId ??
        item.topic?.domainId ??
        null,
      regionTargetId: item.regionTargetId ?? item.regionId ?? null,
      regionName: item.regionName ?? item.region?.regionName ?? null,
      createdAt: String(item.createdAt ?? item.createdDate ?? ''),
      expiresAt: String(item.expiresAt ?? ''),
      status: String(item.status ?? 'Pending'),
      rejectionReason: item.rejectionReason ?? null,
      authorNickname: item.authorNickname ?? item.authorName ?? item.author?.nickname ?? null,
      options: sortedOptions,
    };
  });

  const totalCount = Number(
    raw?.totalCount ?? raw?.totalItems ?? raw?.total ?? mapped.length
  );
  const totalPages = Math.max(
    1,
    Number(raw?.totalPages ?? Math.ceil(totalCount / PAGE_SIZE))
  );

  return { items: mapped, totalCount, totalPages };
}

export function ModerationPage() {
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<ModerationTab>('pending');

  // Пагінація та список опитувань
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [surveys, setSurveys] = useState<ModerationSurveyItem[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);

  // Довідники
  const [surveyDomains, setSurveyDomains] = useState<DictOption[]>([]);
  const [topicsByDomain, setTopicsByDomain] = useState<Record<string, DictOption[]>>({});
  const [regions, setRegions] = useState<DictOption[]>([]);
  const [loadingEditMeta, setLoadingEditMeta] = useState<boolean>(false);

  // Активне опитування для редагування (відкривається при натисканні)
  const [expandedSurveyId, setExpandedSurveyId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  // Коментарі для модерації
  const [commentsBySurvey, setCommentsBySurvey] = useState<Record<number, SurveyComment[]>>({});
  const [loadingCommentsId, setLoadingCommentsId] = useState<number | null>(null);
  const [deletingCommentKey, setDeletingCommentKey] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [bannerSuccess, setBannerSuccess] = useState<string>('');

  // 1. Перевірка ролі та завантаження базових довідників
  useEffect(() => {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) {
      navigate('/auth?mode=login', { replace: true });
      return;
    }

    let isMounted = true;

    async function initModeration() {
      try {
        const [profileRes, domainsRes, regionsRes] = await Promise.all([
          apiClient.get<AuthUserResponse>('/Users/profile'),
          apiClient.get('/Dictionaries/survey-domains'),
          apiClient.get('/Dictionaries/regions'),
        ]);

        if (!isMounted) return;

        localStorage.setItem(USER_PROFILE_STORAGE, JSON.stringify(profileRes.data));
        const hasAccess = checkCanModerate(profileRes.data);
        setAuthorized(hasAccess);

        if (!hasAccess) {
          setLoadingList(false);
          return;
        }

        setSurveyDomains(mapSurveyDomains(domainsRes.data));
        setRegions(mapRegions(regionsRes.data));
      } catch (err: any) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          navigate('/auth?mode=login', { replace: true });
          return;
        }
        const msg = err.response?.data?.message || err.message;
        setPageError(`Не вдалося перевірити права доступу: ${msg}`);
        setAuthorized(false);
        setLoadingList(false);
      }
    }

    initModeration();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // 2. Завантаження списку опитувань через єдиний ендпоінт GET /Surveys/moderation?status=...
  useEffect(() => {
    if (authorized !== true) return;

    let isMounted = true;
    setLoadingList(true);
    setPageError('');

    const statusParam = activeTab === 'pending' ? 'Pending' : 'Active';

    apiClient
      .get('/Surveys/moderation', {
        params: { status: statusParam, page, pageSize: PAGE_SIZE },
      })
      .then((res) => {
        if (!isMounted) return;
        const normalized = normalizeSurveysResponse(res.data);
        setSurveys(normalized.items);
        setTotalCount(normalized.totalCount);
        setTotalPages(normalized.totalPages);
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          navigate('/auth?mode=login', { replace: true });
          return;
        }
        const msg = err.response?.data?.message || err.message;
        setPageError(`Не вдалося завантажити список опитувань: ${msg}`);
      })
      .finally(() => {
        if (isMounted) setLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authorized, activeTab, page, navigate]);

  const handleTabSwitch = (tab: ModerationTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
    setExpandedSurveyId(null);
    setEditForm(null);
    setFormError('');
    setCommentError('');
    setBannerSuccess('');
  };

  const fetchTopicsForDomain = async (domainId: string): Promise<DictOption[]> => {
    if (!domainId) return [];
    if (topicsByDomain[domainId]) return topicsByDomain[domainId];

    const res = await apiClient.get(`/Dictionaries/survey-domains/${domainId}/topics`);
    const mapped = mapTopics(res.data);
    setTopicsByDomain((prev) => ({ ...prev, [domainId]: mapped }));
    return mapped;
  };

  const fetchSurveyComments = async (surveyId: number) => {
    setLoadingCommentsId(surveyId);
    setCommentError('');
    try {
      const res = await apiClient.get<CommentsApiResponse>(
        `/internal/surveys/${surveyId}/comments`
      );
      setCommentsBySurvey((prev) => ({
        ...prev,
        [surveyId]: Array.isArray(res.data?.comments) ? res.data.comments : [],
      }));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setCommentError(`Не вдалося завантажити коментарі: ${msg}`);
      setCommentsBySurvey((prev) => ({ ...prev, [surveyId]: [] }));
    } finally {
      setLoadingCommentsId((prev) => (prev === surveyId ? null : prev));
    }
  };

  const handleDeleteComment = async (
    surveyId: number,
    commentId: number,
    replyId?: number
  ) => {
    const actionKey =
      replyId !== undefined
        ? `${surveyId}-${commentId}-${replyId}`
        : `${surveyId}-${commentId}`;

    if (deletingCommentKey) return;

    const confirmText =
      replyId !== undefined
        ? 'Ви впевнені, що хочете видалити цю відповідь на коментар?'
        : 'Ви впевнені, що хочете видалити цей коментар разом з усіма відповідями?';

    if (!window.confirm(confirmText)) return;

    setDeletingCommentKey(actionKey);
    setCommentError('');

    try {
      await apiClient.delete(`/internal/surveys/${surveyId}/comments/${commentId}`, {
        params: replyId !== undefined ? { replyId } : undefined,
      });

      await fetchSurveyComments(surveyId);
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.detail ||
        err.response?.data?.title ||
        err.message;
      setCommentError(`Не вдалося видалити коментар (${status || 'мережа'}): ${msg}`);
    } finally {
      setDeletingCommentKey(null);
    }
  };

  // Відкриття/закриття меню редагування конкретного опитування при кліку
  const handleSelectSurvey = async (survey: ModerationSurveyItem) => {
    setFormError('');
    setCommentError('');
    setBannerSuccess('');

    if (expandedSurveyId === survey.surveyId) {
      setExpandedSurveyId(null);
      setEditForm(null);
      return;
    }

    const initialOptions =
      survey.options.length >= MIN_OPTIONS
        ? survey.options.map((o) => o.optionText)
        : survey.options.length === 1
        ? [survey.options[0].optionText, '']
        : ['', ''];

    const initialDomainId = survey.domainId ? String(survey.domainId) : '';
    const defaultStatus: ModerationStatusOption =
      activeTab === 'active' ? 'Archived' : 'Active';

    setExpandedSurveyId(survey.surveyId);
    setEditForm({
      surveyText: survey.surveyText,
      surveyType: survey.surveyType,
      domainId: initialDomainId,
      topicId: survey.topicId ? String(survey.topicId) : '',
      regionTargetId: survey.regionTargetId ? String(survey.regionTargetId) : '',
      expiresAtLocal: toDatetimeLocalValue(survey.expiresAt),
      status: defaultStatus,
      rejectionReason: survey.rejectionReason ?? '',
      options: initialOptions,
    });

    // Паралельно завантажуємо коментарі до опитування
    fetchSurveyComments(survey.surveyId);

    if (survey.topicId > 0 && surveyDomains.length > 0) {
      setLoadingEditMeta(true);
      try {
        if (initialDomainId) {
          await fetchTopicsForDomain(initialDomainId);
        } else {
          const checks = await Promise.all(
            surveyDomains.map(async (domain) => {
              try {
                const list = await fetchTopicsForDomain(String(domain.id));
                const found = list.some((t) => t.id === survey.topicId);
                return found ? String(domain.id) : null;
              } catch {
                return null;
              }
            })
          );
          const matchedDomainId = checks.find((id) => id !== null);
          if (matchedDomainId) {
            setEditForm((prev) =>
              prev ? { ...prev, domainId: matchedDomainId } : null
            );
          }
        }
      } finally {
        setLoadingEditMeta(false);
      }
    }
  };

  // Швидка примусова архівація активного опитування (FR 6.3)
  const handleQuickArchive = async (
    e: React.MouseEvent,
    surveyId: number
  ) => {
    e.stopPropagation();
    if (archivingId !== null) return;

    const confirmed = window.confirm(
      `Ви впевнені, що хочете примусово архівувати опитування #${surveyId} і зняти його з публікації?`
    );
    if (!confirmed) return;

    setArchivingId(surveyId);
    setPageError('');
    setBannerSuccess('');

    try {
      await apiClient.patch(`/Surveys/${surveyId}/moderate`, {
        status: 'Archived',
      });

      setBannerSuccess(`Опитування #${surveyId} примусово переведено в архів (Archived).`);
      setSurveys((prev) => prev.filter((item) => item.surveyId !== surveyId));
      setTotalCount((prev) => Math.max(0, prev - 1));
      if (expandedSurveyId === surveyId) {
        setExpandedSurveyId(null);
        setEditForm(null);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.message;
      setPageError(`Не вдалося архівувати опитування (${status || 'мережа'}): ${msg}`);
    } finally {
      setArchivingId(null);
    }
  };

  const handleEditDomainChange = async (newDomainId: string) => {
    setEditForm((prev) =>
      prev ? { ...prev, domainId: newDomainId, topicId: '' } : null
    );
    if (!newDomainId) return;

    setLoadingEditMeta(true);
    try {
      await fetchTopicsForDomain(newDomainId);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setFormError(`Не вдалося завантажити теми: ${msg}`);
    } finally {
      setLoadingEditMeta(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            options: prev.options.map((opt, idx) => (idx === index ? value : opt)),
          }
        : null
    );
  };

  const handleAddOption = () => {
    setEditForm((prev) =>
      prev && prev.options.length < MAX_OPTIONS
        ? { ...prev, options: [...prev.options, ''] }
        : prev
    );
  };

  const handleRemoveOption = (index: number) => {
    setEditForm((prev) =>
      prev && prev.options.length > MIN_OPTIONS
        ? { ...prev, options: prev.options.filter((_, idx) => idx !== index) }
        : prev
    );
  };

  const handleSaveModeration = async (e: React.FormEvent, surveyId: number) => {
    e.preventDefault();
    if (!editForm) return;

    setFormError('');
    setBannerSuccess('');

    const trimmedText = editForm.surveyText.trim();
    if (trimmedText.length < 5) {
      setFormError('Текст опитування має містити щонайменше 5 символів.');
      return;
    }

    if (!editForm.topicId) {
      setFormError('Оберіть тему опитування.');
      return;
    }

    // Перевірка обов'язкової причини при відхиленні (FR 6.2)
    const trimmedReason = editForm.rejectionReason.trim();
    if (editForm.status === 'Rejected' && trimmedReason.length < 3) {
      setFormError('При відхиленні опитування обов’язково вкажіть причину (щонайменше 3 символи).');
      return;
    }

    const isChoice =
      editForm.surveyType === 'SingleChoice' || editForm.surveyType === 'MultipleChoice';
    const cleanedOptions = editForm.options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (isChoice && cleanedOptions.length < MIN_OPTIONS) {
      setFormError(`Вкажіть щонайменше ${MIN_OPTIONS} варіанти відповіді.`);
      return;
    }

    if (
      isChoice &&
      new Set(cleanedOptions.map((o) => o.toLowerCase())).size !== cleanedOptions.length
    ) {
      setFormError('Варіанти відповідей не повинні повторюватися.');
      return;
    }

    const parsedExpires = editForm.expiresAtLocal
      ? new Date(editForm.expiresAtLocal)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(parsedExpires.getTime())) {
      setFormError('Вкажіть коректну дату завершення опитування.');
      return;
    }

    setSaving(true);

    const payload = {
      surveyText: trimmedText,
      surveyType: editForm.surveyType,
      topicId: Number(editForm.topicId),
      regionTargetId: editForm.regionTargetId ? Number(editForm.regionTargetId) : null,
      expiresAt: parsedExpires.toISOString(),
      status: editForm.status,
      rejectionReason: editForm.status === 'Rejected' ? trimmedReason : null,
      options: isChoice
        ? cleanedOptions.map((text, idx) => ({
            optionText: text,
            orderIndex: idx,
          }))
        : [],
    };

    try {
      await apiClient.patch(`/Surveys/${surveyId}/moderate`, payload);

      const statusLabel =
        editForm.status === 'Active'
          ? 'схвалено та активовано (Active)'
          : editForm.status === 'Rejected'
          ? `відхилено (Rejected). Причина: «${trimmedReason}»`
          : editForm.status === 'Archived'
          ? 'перенесено в архів (Archived)'
          : editForm.status === 'Closed'
          ? 'закрито (Closed)'
          : 'оновлено та залишено на модерації (Pending)';

      setBannerSuccess(`Опитування #${surveyId} успішно ${statusLabel}.`);
      setExpandedSurveyId(null);
      setEditForm(null);

      // Якщо статус більше не відповідає поточній вкладці — прибираємо зі списку
      const stillMatchesTab =
        (activeTab === 'pending' && editForm.status === 'Pending') ||
        (activeTab === 'active' && editForm.status === 'Active');

      if (!stillMatchesTab) {
        setSurveys((prev) => prev.filter((item) => item.surveyId !== surveyId));
        setTotalCount((prev) => Math.max(0, prev - 1));
      } else {
        setSurveys((prev) =>
          prev.map((item) =>
            item.surveyId === surveyId
              ? {
                  ...item,
                  surveyText: trimmedText,
                  surveyType: editForm.surveyType,
                  topicId: Number(editForm.topicId),
                  regionTargetId: editForm.regionTargetId
                    ? Number(editForm.regionTargetId)
                    : null,
                  expiresAt: parsedExpires.toISOString(),
                  options: payload.options,
                }
              : item
          )
        );
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : err.message);
      setFormError(`Помилка модерації (${status || 'мережа'}): ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (authorized === false) {
    return (
      <div className="w-full max-w-xl mx-auto bg-card border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-main">Доступ обмежено</h1>
        <p className="text-xs sm:text-sm text-muted">
          Цей розділ доступний лише для модераторів та адміністраторів платформи.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-sm font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>На головну</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Верхня панель та перемикач вкладок */}
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Панель модератора</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-main tracking-tight">
              {activeTab === 'pending' ? 'Опитування на модерації' : 'Активні опитування'}
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              {activeTab === 'pending'
                ? 'Перевіряйте нові опитування, редагуйте поля, схвалюйте або відхиляйте із зазначенням причини.'
                : 'Керуйте опублікованими опитуваннями, модеруйте коментарі або примусово переводьте в архів.'}
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold self-start sm:self-center ${
              activeTab === 'pending'
                ? 'bg-amber-500/10 border-amber-500/25 text-amber-500'
                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
            }`}
          >
            {activeTab === 'pending' ? (
              <>
                <Clock className="w-4 h-4 shrink-0" />
                <span>Очікують перевірки: {totalCount}</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 shrink-0" />
                <span>Активних зараз: {totalCount}</span>
              </>
            )}
          </div>
        </div>

        {/* Вкладки навігації модерації */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-app border border-line">
          <button
            type="button"
            onClick={() => handleTabSwitch('pending')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-card text-main shadow-sm border border-line'
                : 'text-muted hover:text-main'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>На модерації</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch('active')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-card text-main shadow-sm border border-line'
                : 'text-muted hover:text-main'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Активні опитування</span>
          </button>
        </div>
      </div>

      {/* Сповіщення */}
      {bannerSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs sm:text-sm font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bannerSuccess}</span>
        </div>
      )}

      {pageError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{pageError}</span>
        </div>
      )}

      {/* Список опитувань */}
      {loadingList ? (
        <div className="space-y-3">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="bg-card border border-line rounded-2xl p-5 space-y-3 animate-pulse"
            >
              <div className="flex gap-2">
                <div className="h-5 w-28 bg-app rounded-full" />
                <div className="h-5 w-24 bg-app rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-app rounded-lg" />
            </div>
          ))}
        </div>
      ) : surveys.length === 0 ? (
        <div className="bg-card border border-line rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-main">
            {activeTab === 'pending'
              ? 'Черга модерації порожня'
              : 'Активних опитувань не знайдено'}
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            {activeTab === 'pending'
              ? 'Усі опитування зі статусом Pending вже перевірені.'
              : 'Наразі немає опублікованих опитувань для відображення.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {surveys.map((survey) => {
            const isExpanded = expandedSurveyId === survey.surveyId;
            const currentTopics = editForm?.domainId
              ? topicsByDomain[editForm.domainId] ?? []
              : [];
            const isChoiceType =
              editForm?.surveyType === 'SingleChoice' ||
              editForm?.surveyType === 'MultipleChoice';

            const surveyComments = commentsBySurvey[survey.surveyId] ?? [];
            const isLoadingComments = loadingCommentsId === survey.surveyId;

            return (
              <article
                key={survey.surveyId}
                className={`bg-card border rounded-2xl transition shadow-sm overflow-hidden ${
                  isExpanded ? 'border-accent/60' : 'border-line hover:border-accent/40'
                }`}
              >
                {/* Заголовок картки опитування */}
                <div className="p-5 sm:p-6 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => handleSelectSurvey(survey)}
                    aria-expanded={isExpanded}
                    className="text-left space-y-2.5 min-w-0 flex-1 cursor-pointer group"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {activeTab === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>На модерації</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-semibold">
                          <Radio className="w-3.5 h-3.5" />
                          <span>Активне</span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-medium">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{formatSurveyTypeLabel(survey.surveyType)}</span>
                      </span>

                      {survey.topicName && (
                        <span className="px-2.5 py-0.5 rounded-full bg-app border border-line text-xs text-muted">
                          {survey.topicName}
                        </span>
                      )}

                      {survey.authorNickname && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <User className="w-3 h-3" />
                          <span>{survey.authorNickname}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-main group-hover:text-accent transition leading-snug">
                      {survey.surveyText}
                    </h2>
                  </button>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Швидка кнопка архівації для вкладки Активних опитувань (FR 6.3) */}
                    {activeTab === 'active' && (
                      <button
                        type="button"
                        disabled={archivingId === survey.surveyId}
                        onClick={(e) => handleQuickArchive(e, survey.surveyId)}
                        title="Примусово архівувати опитування"
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {archivingId === survey.surveyId ? 'Архівація...' : 'Архівувати'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSelectSurvey(survey)}
                      className={`w-9 h-9 rounded-xl bg-app border border-line flex items-center justify-center text-muted transition-transform duration-200 cursor-pointer ${
                        isExpanded ? 'rotate-180 text-accent border-accent/40' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Меню редагування опитування та модерації коментарів при натисканні */}
                {isExpanded && editForm && (
                  <div className="px-5 sm:px-6 pb-6 pt-5 border-t border-line bg-app/30 space-y-6">
                    <form
                      onSubmit={(e) => handleSaveModeration(e, survey.surveyId)}
                      className="space-y-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                        <span>ID опитування: #{survey.surveyId}</span>
                        {survey.createdAt && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Створено: {formatDisplayDate(survey.createdAt)}</span>
                          </span>
                        )}
                      </div>

                      {formError && (
                        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{formError}</span>
                        </div>
                      )}

                      {/* Текст опитування */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <label className="font-medium text-muted">
                            Текст опитування <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-muted font-mono">
                            {editForm.surveyText.length}/300
                          </span>
                        </div>
                        <div className="relative">
                          <HelpCircle className="w-4 h-4 text-muted absolute left-3.5 top-3.5 pointer-events-none" />
                          <textarea
                            required
                            rows={3}
                            minLength={5}
                            maxLength={300}
                            value={editForm.surveyText}
                            onChange={(e) =>
                              setEditForm({ ...editForm, surveyText: e.target.value })
                            }
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-line text-main text-sm focus:border-accent outline-none transition resize-none"
                          />
                        </div>
                      </div>

                      {/* Тип опитування */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-medium text-muted">
                          Тип опитування <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {(
                            [
                              { id: 'SingleChoice', label: 'Один варіант' },
                              { id: 'MultipleChoice', label: 'Кілька варіантів' },
                              { id: 'Numeric', label: 'Числова відповідь' },
                            ] as const
                          ).map((item) => {
                            const active = editForm.surveyType === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                  setEditForm({ ...editForm, surveyType: item.id })
                                }
                                className={`py-2.5 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition cursor-pointer ${
                                  active
                                    ? 'bg-accent/15 border-accent text-accent'
                                    : 'bg-card border-line text-main hover:border-accent/40'
                                }`}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Галузь та Тема */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-muted">
                            Галузь опитування
                          </label>
                          <SearchableSelect
                            options={surveyDomains}
                            value={editForm.domainId}
                            onChange={handleEditDomainChange}
                            placeholder="Оберіть галузь..."
                            icon={<FolderOpen className="w-4 h-4" />}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-muted">
                            Тема <span className="text-rose-500">*</span>
                          </label>
                          <SearchableSelect
                            options={currentTopics}
                            value={editForm.topicId}
                            onChange={(val) =>
                              setEditForm({ ...editForm, topicId: val })
                            }
                            disabled={!editForm.domainId || loadingEditMeta}
                            placeholder={
                              loadingEditMeta
                                ? 'Завантаження тем...'
                                : !editForm.domainId
                                ? 'Спочатку оберіть галузь'
                                : 'Оберіть тему...'
                            }
                            icon={<Tag className="w-4 h-4" />}
                          />
                        </div>
                      </div>

                      {/* Регіон та Дата завершення */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-muted">
                            Цільовий регіон
                          </label>
                          <SearchableSelect
                            options={regions}
                            value={editForm.regionTargetId}
                            onChange={(val) =>
                              setEditForm({ ...editForm, regionTargetId: val })
                            }
                            placeholder="Усі регіони України"
                            icon={<MapPin className="w-4 h-4" />}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-medium text-muted">
                            Актуальне до <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            required
                            value={editForm.expiresAtLocal}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                expiresAtLocal: e.target.value,
                              })
                            }
                            className="w-full px-3.5 py-3 rounded-xl bg-card border border-line text-main text-sm focus:border-accent outline-none transition"
                          />
                        </div>
                      </div>

                      {/* Варіанти відповідей */}
                      {isChoiceType ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <label className="block text-xs font-medium text-muted">
                              Варіанти відповідей <span className="text-rose-500">*</span>
                            </label>
                            {editForm.options.length < MAX_OPTIONS && (
                              <button
                                type="button"
                                onClick={handleAddOption}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/25 text-accent text-xs font-semibold transition cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Додати варіант</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {editForm.options.map((opt, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-6 text-center text-xs font-mono text-muted shrink-0">
                                  {idx + 1}.
                                </span>
                                <input
                                  type="text"
                                  required
                                  maxLength={150}
                                  value={opt}
                                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                                  placeholder={`Варіант №${idx + 1}`}
                                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-card border border-line text-main text-sm focus:border-accent outline-none transition"
                                />
                                {editForm.options.length > MIN_OPTIONS && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(idx)}
                                    title="Видалити варіант"
                                    className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 transition cursor-pointer shrink-0"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-card border border-line flex items-center gap-2.5 text-xs text-muted">
                          <Hash className="w-4 h-4 text-accent shrink-0" />
                          <span>
                            Числовий тип опитування не містить фіксованих варіантів відповіді.
                          </span>
                        </div>
                      )}

                      {/* Рішення модератора (відповідно до enum SurveyStatus) */}
                      <div className="space-y-2 pt-1">
                        <label className="block text-xs font-medium text-muted">
                          Рішення модератора (статус) <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, status: 'Active' })}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              editForm.status === 'Active'
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                                : 'bg-card border-line text-muted hover:text-main'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>Схвалити</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, status: 'Rejected' })}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              editForm.status === 'Rejected'
                                ? 'bg-rose-500/15 border-rose-500 text-rose-500'
                                : 'bg-card border-line text-muted hover:text-main'
                            }`}
                          >
                            <Ban className="w-4 h-4 shrink-0" />
                            <span>Відхилити</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, status: 'Pending' })}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              editForm.status === 'Pending'
                                ? 'bg-amber-500/15 border-amber-500 text-amber-500'
                                : 'bg-card border-line text-muted hover:text-main'
                            }`}
                          >
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>Pending</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, status: 'Archived' })}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer ${
                              editForm.status === 'Archived'
                                ? 'bg-accent/15 border-accent text-accent'
                                : 'bg-card border-line text-muted hover:text-main'
                            }`}
                          >
                            <Archive className="w-4 h-4 shrink-0" />
                            <span>В архів</span>
                          </button>
                        </div>
                      </div>

                      {/* Обов'язкове поле причини відхилення при статусі Rejected (FR 6.2) */}
                      {editForm.status === 'Rejected' && (
                        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/30 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <label className="font-semibold text-rose-500 flex items-center gap-1.5">
                              <XCircle className="w-4 h-4" />
                              <span>
                                Причина відхилення опитування <span className="text-rose-500">*</span>
                              </span>
                            </label>
                            <span className="text-muted font-mono">
                              {editForm.rejectionReason.length}/500
                            </span>
                          </div>
                          <textarea
                            required
                            rows={2}
                            minLength={3}
                            maxLength={500}
                            value={editForm.rejectionReason}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                rejectionReason: e.target.value,
                              })
                            }
                            placeholder="Опишіть причину відхилення (наприклад: нецензурна лексика, дублювання або некоректні варіанти відповіді)..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-rose-500/40 text-main text-sm placeholder:text-muted focus:border-rose-500 outline-none transition resize-none"
                            autoFocus
                          />
                        </div>
                      )}

                      {/* Кнопки збереження / скасування */}
                      <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-line">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedSurveyId(null);
                            setEditForm(null);
                            setFormError('');
                            setCommentError('');
                          }}
                          className="px-4 py-2.5 rounded-xl bg-card border border-line text-muted hover:text-main text-sm font-medium transition cursor-pointer"
                        >
                          Згорнути
                        </button>

                        <button
                          type="submit"
                          disabled={saving}
                          className={`px-5 py-2.5 rounded-xl disabled:opacity-50 text-sm font-semibold inline-flex items-center gap-2 transition shadow-sm cursor-pointer ${
                            editForm.status === 'Rejected'
                              ? 'bg-rose-600 hover:bg-rose-500 text-white'
                              : 'bg-accent hover:bg-accent-hover text-accent-text'
                          }`}
                        >
                          <Save className="w-4 h-4" />
                          <span>
                            {saving
                              ? 'Збереження...'
                              : editForm.status === 'Rejected'
                              ? 'Відхилити опитування'
                              : 'Зберегти зміни'}
                          </span>
                        </button>
                      </div>
                    </form>

                    {/* Секція модерації коментарів опитування */}
                    <div className="pt-5 border-t border-line space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-main">
                          <MessageSquare className="w-4 h-4 text-accent" />
                          <span>Коментарі до опитування ({surveyComments.length})</span>
                        </div>
                      </div>

                      {commentError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{commentError}</span>
                        </div>
                      )}

                      {isLoadingComments ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-14 bg-card rounded-xl" />
                          <div className="h-14 bg-card rounded-xl" />
                        </div>
                      ) : surveyComments.length === 0 ? (
                        <p className="text-xs text-muted py-1">
                          Коментарів до цього опитування немає.
                        </p>
                      ) : (
                        <div className="space-y-2.5">
                          {surveyComments.map((comment) => {
                            const rootDeleteKey = `${survey.surveyId}-${comment.commentId}`;
                            const isDeletingRoot = deletingCommentKey === rootDeleteKey;

                            return (
                              <div
                                key={comment.commentId}
                                className="p-3.5 rounded-xl bg-card border border-line space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <span className="text-xs sm:text-sm font-semibold text-main">
                                      {comment.nickname || 'Користувач'}
                                    </span>
                                    <span className="ml-2 text-[11px] text-muted">
                                      #{comment.commentId} · {formatDisplayDate(comment.createdAt)}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={deletingCommentKey !== null}
                                    onClick={() =>
                                      handleDeleteComment(survey.surveyId, comment.commentId)
                                    }
                                    title="Видалити коментар разом з відповідями"
                                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 text-xs font-medium inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{isDeletingRoot ? 'Видалення...' : 'Видалити'}</span>
                                  </button>
                                </div>

                                <p className="text-xs sm:text-sm text-main/90 whitespace-pre-wrap break-words">
                                  {comment.text}
                                </p>

                                {/* Вкладені відповіді на коментар */}
                                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                                  <div className="pl-3 sm:pl-5 pt-1.5 space-y-2 border-l-2 border-line">
                                    {comment.replies.map((reply) => {
                                      const replyDeleteKey = `${survey.surveyId}-${comment.commentId}-${reply.replyId}`;
                                      const isDeletingReply =
                                        deletingCommentKey === replyDeleteKey;

                                      return (
                                        <div
                                          key={reply.replyId}
                                          className="p-2.5 rounded-lg bg-app/70 border border-line/60 space-y-1"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <CornerDownRight className="w-3 h-3 text-accent shrink-0" />
                                              <span className="text-xs font-semibold text-main">
                                                {reply.nickname || 'Користувач'}
                                              </span>
                                              <span className="text-[11px] text-muted">
                                                #{reply.replyId} ·{' '}
                                                {formatDisplayDate(reply.createdAt)}
                                              </span>
                                            </div>

                                            <button
                                              type="button"
                                              disabled={deletingCommentKey !== null}
                                              onClick={() =>
                                                handleDeleteComment(
                                                  survey.surveyId,
                                                  comment.commentId,
                                                  reply.replyId
                                                )
                                              }
                                              title="Видалити відповідь"
                                              className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 text-[11px] font-medium inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50 shrink-0"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                              <span>
                                                {isDeletingReply ? '...' : 'Видалити'}
                                              </span>
                                            </button>
                                          </div>

                                          <p className="text-xs text-main/90 pl-4 whitespace-pre-wrap break-words">
                                            {reply.text}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Пагінація */}
      {!loadingList && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 bg-card border border-line rounded-2xl px-5 py-3.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              setExpandedSurveyId(null);
              setEditForm(null);
              setPage((p) => Math.max(1, p - 1));
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-app border border-line text-xs sm:text-sm font-medium text-main disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Попередня</span>
          </button>

          <span className="text-xs sm:text-sm text-muted font-medium">
            Сторінка <strong className="text-main">{page}</strong> з{' '}
            <strong className="text-main">{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => {
              setExpandedSurveyId(null);
              setEditForm(null);
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-app border border-line text-xs sm:text-sm font-medium text-main disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Наступна</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}