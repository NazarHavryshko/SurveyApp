import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Coins,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Archive,
  AlertCircle,
  FileQuestion,
  Users,
  ChevronDown,
  Layers,
  ListChecks,
  Download,
} from 'lucide-react';
import { apiClient, JWT_TOKEN_KEY } from '../api/apiClient';
import type { AuthUserResponse } from '../types/auth';

const USER_PROFILE_STORAGE = 'mysurvey_user_profile';

export interface SurveyOptionStat {
  optionId: number;
  text: string;
  votesCount: number;
  percentage: number;
}

export interface MySurveyItem {
  id: string | number;
  text: string;
  surveyType: string;
  isMultipleChoice: boolean;
  topicName?: string | null;
  status: string | number;
  createdAt: string;
  totalVotes: number;
  options: SurveyOptionStat[];
  responseStats: SurveyOptionStat[];
}

interface DiagramItem {
  label: string;
  count: number;
}

interface SurveyDiagramResponse {
  surveyId: number;
  surveyType?: string;
  totalResponses: number;
  items: DiagramItem[];
}

function isMultipleChoiceType(rawType?: string | number | null): boolean {
  if (rawType === undefined || rawType === null) return false;
  const val = String(rawType).trim().toLowerCase();
  return (
    val === '1' ||
    val === 'multiple' ||
    val === 'multiplechoice' ||
    val === 'multiple_choice' ||
    val === 'many' ||
    val.includes('кілька') ||
    val.includes('множин')
  );
}

function formatSurveyType(rawType?: string | number | null): string {
  if (rawType === undefined || rawType === null || String(rawType).trim() === '') {
    return 'Один варіант';
  }

  const val = String(rawType).trim().toLowerCase();

  if (
    val === '0' ||
    val === 'single' ||
    val === 'singlechoice' ||
    val === 'single_choice' ||
    val === 'one'
  ) {
    return 'Один варіант';
  }

  if (isMultipleChoiceType(val)) {
    return 'Кілька варіантів';
  }

  if (
    val === '2' ||
    val === 'numeric' ||
    val === 'range' ||
    val === 'scale' ||
    val === 'rating'
  ) {
    return 'Числова відповідь';
  }

  if (val === '3' || val === 'boolean' || val === 'yesno' || val === 'yes_no') {
    return 'Так / Ні';
  }

  return String(rawType);
}

function formatVotesLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} голос`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} голоси`;
  return `${count} голосів`;
}

function normalizeSurveys(rawList: any[]): MySurveyItem[] {
  if (!Array.isArray(rawList)) return [];

  return rawList.map((item, index) => {
    const rawOptions = Array.isArray(
      item.options ?? item.surveyOptions ?? item.answerOptions ?? item.answers
    )
      ? item.options ?? item.surveyOptions ?? item.answerOptions ?? item.answers
      : [];

    const mappedOptions: SurveyOptionStat[] = rawOptions.map((opt: any, optIdx: number) => ({
      optionId: Number(opt.optionId ?? opt.surveyOptionId ?? opt.id ?? optIdx + 1),
      text: String(opt.optionText ?? opt.text ?? opt.answerText ?? opt.name ?? ''),
      votesCount: Number(
        opt.votesCount ?? opt.answersCount ?? opt.responsesCount ?? opt.count ?? 0
      ),
      percentage: 0,
    }));

    const rawType = item.surveyType ?? item.questionType ?? item.type ?? null;

    return {
      id: item.surveyId ?? item.questionId ?? item.id ?? index,
      text: String(
        item.questionText ?? item.surveyText ?? item.text ?? item.title ?? 'Без тексту'
      ),
      surveyType: formatSurveyType(rawType),
      isMultipleChoice: isMultipleChoiceType(rawType),
      topicName: item.topicName ?? item.topic?.topicName ?? item.topic?.name ?? null,
      status: item.status ?? item.moderationStatus ?? 0,
      createdAt: String(item.createdAt ?? item.createdDate ?? item.dateCreated ?? ''),
      totalVotes: 0,
      options: mappedOptions,
      responseStats: [],
    };
  });
}

function applyDiagramStats(
  survey: MySurveyItem,
  diagram: SurveyDiagramResponse | null
): MySurveyItem {
  const diagramItems = Array.isArray(diagram?.items) ? diagram!.items : [];
  const hasDiagramType =
    Boolean(diagram?.surveyType) && diagram?.surveyType !== 'string';

  const isMultiple = hasDiagramType
    ? isMultipleChoiceType(diagram!.surveyType)
    : survey.isMultipleChoice;

  const resolvedType = hasDiagramType
    ? formatSurveyType(diagram!.surveyType)
    : survey.surveyType;

  if (isMultiple) {
    const sumItemCounts = diagramItems.reduce((sum, d) => sum + Number(d.count ?? 0), 0);
    const totalVotes =
      diagram?.totalResponses !== undefined && diagram?.totalResponses !== null
        ? Number(diagram.totalResponses)
        : sumItemCounts;

    const responseStats: SurveyOptionStat[] = diagramItems.map((d, idx) => {
      const count = Number(d.count ?? 0);
      return {
        optionId: idx + 1,
        text: String(d.label ?? 'Без назви'),
        votesCount: count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 1000) / 10 : 0,
      };
    });

    return {
      ...survey,
      surveyType: resolvedType,
      isMultipleChoice: true,
      totalVotes,
      responseStats,
    };
  }

  let mergedOptions: SurveyOptionStat[] = survey.options.map((opt) => {
    const normalizedLabel = opt.text.trim().toLowerCase();
    const matched = diagramItems.find(
      (d) => String(d.label ?? '').trim().toLowerCase() === normalizedLabel
    );
    return {
      ...opt,
      votesCount: matched ? Number(matched.count ?? 0) : opt.votesCount,
    };
  });

  if (mergedOptions.length === 0 && diagramItems.length > 0) {
    mergedOptions = diagramItems.map((d, idx) => ({
      optionId: idx + 1,
      text: String(d.label ?? ''),
      votesCount: Number(d.count ?? 0),
      percentage: 0,
    }));
  }

  const sumVotes = mergedOptions.reduce((sum, o) => sum + o.votesCount, 0);
  const totalVotes =
    diagram?.totalResponses !== undefined && diagram?.totalResponses !== null
      ? Number(diagram.totalResponses)
      : sumVotes;

  const optionsWithPercent = mergedOptions.map((opt) => ({
    ...opt,
    percentage: totalVotes > 0 ? Math.round((opt.votesCount / totalVotes) * 1000) / 10 : 0,
  }));

  return {
    ...survey,
    surveyType: resolvedType,
    isMultipleChoice: false,
    totalVotes,
    options: optionsWithPercent,
    responseStats: optionsWithPercent,
  };
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Дата не вказана';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusBadge(status: string | number) {
  const val = String(status).trim().toLowerCase();

  if (val === '1' || val === 'approved' || val === 'active' || val === 'published') {
    return {
      label: 'Активне',
      className: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    };
  }

  if (val === '2' || val === 'rejected' || val === 'declined') {
    return {
      label: 'Відхилено',
      className: 'bg-rose-500/10 border-rose-500/25 text-rose-500',
      icon: <XCircle className="w-3.5 h-3.5" />,
    };
  }

  if (val === '3' || val === 'closed' || val === 'archived' || val === 'completed') {
    return {
      label: 'Завершене',
      className: 'bg-app border-line text-muted',
      icon: <Archive className="w-3.5 h-3.5" />,
    };
  }

  return {
    label: 'На модерації',
    className: 'bg-amber-500/10 border-amber-500/25 text-amber-500',
    icon: <Clock className="w-3.5 h-3.5" />,
  };
}

export function MySurveysPage() {
  const navigate = useNavigate();

  const [tokens, setTokens] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(USER_PROFILE_STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Number(parsed?.availableQuestionTokens ?? 0);
      }
    } catch {
      // Ігноруємо пошкоджений кеш
    }
    return 0;
  });

  const [surveys, setSurveys] = useState<MySurveyItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [csvErrorBySurvey, setCsvErrorBySurvey] = useState<Record<string, string>>({});
  const [downloadingCsvId, setDownloadingCsvId] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const jwt = localStorage.getItem(JWT_TOKEN_KEY);
    if (!jwt) {
      navigate('/auth?mode=login', { replace: true });
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    async function loadMySurveys() {
      try {
        const [profileRes, surveysRes] = await Promise.all([
          apiClient.get<AuthUserResponse>('/Users/profile'),
          apiClient.get('/Surveys/my'),
        ]);

        if (!isMounted) return;

        const availableTokens = Number(profileRes.data?.availableQuestionTokens ?? 0);
        setTokens(availableTokens);
        localStorage.setItem(USER_PROFILE_STORAGE, JSON.stringify(profileRes.data));

        const baseSurveys = normalizeSurveys(surveysRes.data);

        const enrichedSurveys = await Promise.all(
          baseSurveys.map(async (survey) => {
            try {
              const diagramRes = await apiClient.get<SurveyDiagramResponse>(
                `/internal/surveys/${survey.id}/diagram`
              );
              return applyDiagramStats(survey, diagramRes.data);
            } catch {
              return applyDiagramStats(survey, null);
            }
          })
        );

        if (!isMounted) return;
        setSurveys(enrichedSurveys);
      } catch (err: any) {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          navigate('/auth?mode=login', { replace: true });
          return;
        }
        const msg = err.response?.data?.message || err.message;
        setError(`Не вдалося завантажити ваші опитування: ${msg}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadMySurveys();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const canCreateSurvey = tokens > 0;

  const handleCreateClick = () => {
    if (!canCreateSurvey) return;
    navigate('/surveys/create');
  };

  const toggleSurvey = (id: string | number) => {
    const key = String(id);
    setExpandedIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleDownloadCsv = async (surveyId: string | number) => {
    const key = String(surveyId);
    if (downloadingCsvId) return;

    setDownloadingCsvId(key);
    setCsvErrorBySurvey((prev) => ({ ...prev, [key]: '' }));

    try {
      const response = await apiClient.get(`/internal/surveys/${surveyId}/responses/csv`, {
        responseType: 'blob',
      });

      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      let fileName = `survey_${surveyId}_responses.csv`;

      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^;"'\n]+)["']?/i);
        if (match?.[1]) {
          fileName = decodeURIComponent(match[1]);
        }
      }

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      let message = err.message;
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed.message || text;
        } catch {
          // Залишаємо стандартне повідомлення помилки
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      setCsvErrorBySurvey((prev) => ({
        ...prev,
        [key]: `Не вдалося завантажити CSV-файл: ${message}`,
      }));
    } finally {
      setDownloadingCsvId(null);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Верхня панель: заголовок, баланс токенів та кнопка створення */}
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-main tracking-tight">
              Мої опитування
            </h1>
            <p className="text-xs sm:text-sm text-muted">
              Натисніть на опитування зі списку, щоб переглянути результати відповідей та вивантажити
              CSV-звіт.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Лічильник доступних токенів */}
            <div
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold ${
                canCreateSurvey
                  ? 'bg-accent/10 border-accent/25 text-accent'
                  : 'bg-rose-500/10 border-rose-500/25 text-rose-500'
              }`}
            >
              <Coins className="w-4 h-4 shrink-0" />
              <span>Токени: {tokens}</span>
            </div>

            {/* Кнопка створення (заблокована при 0 токенів) */}
            <button
              type="button"
              disabled={!canCreateSurvey || loading}
              onClick={handleCreateClick}
              title={
                canCreateSurvey
                  ? 'Створити нове опитування (витратиться 1 токен)'
                  : 'Недостатньо токенів для створення опитування'
              }
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-45 disabled:hover:bg-accent text-accent-text text-xs sm:text-sm font-semibold transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>Створити нове опитування</span>
            </button>
          </div>
        </div>

        {/* Підказка, коли токенів 0 */}
        {!loading && !canCreateSurvey && (
          <div className="p-3 rounded-xl bg-app border border-line text-xs text-muted flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              У вас зараз <strong className="text-main">0 токенів</strong>. Проходьте опитування інших
              користувачів, щоб отримати токени для створення власних питань.
            </span>
          </div>
        )}
      </div>

      {/* Помилка завантаження */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Стан завантаження */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="bg-card border border-line rounded-2xl p-5 space-y-3 animate-pulse"
            >
              <div className="flex gap-2">
                <div className="h-5 w-24 bg-app rounded-full" />
                <div className="h-5 w-28 bg-app rounded-full" />
              </div>
              <div className="h-5 w-3/4 bg-app rounded-lg" />
            </div>
          ))}
        </div>
      ) : surveys.length === 0 ? (
        /* Порожній список */
        <div className="bg-card border border-line rounded-3xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-app border border-line flex items-center justify-center text-muted mx-auto">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-main">
            Ви ще не створили жодного опитування
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto">
            {canCreateSurvey
              ? 'Натисніть «Створити нове опитування», щоб опублікувати своє перше питання.'
              : 'Накопичте принаймні 1 токен за відповіді в опитуваннях, щоб створити власне.'}
          </p>
        </div>
      ) : (
        /* Список опитувань (згорнутий за замовчуванням) */
        <div className="space-y-3">
          {surveys.map((survey) => {
            const key = String(survey.id);
            const badge = getStatusBadge(survey.status);
            const isExpanded = Boolean(expandedIds[key]);
            const csvError = csvErrorBySurvey[key];

            return (
              <article
                key={survey.id}
                className={`bg-card border rounded-2xl transition shadow-sm overflow-hidden ${
                  isExpanded ? 'border-accent/50' : 'border-line hover:border-accent/40'
                }`}
              >
                {/* Клікабельна шапка: статус, тип та назва опитування */}
                <button
                  type="button"
                  onClick={() => toggleSurvey(survey.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer transition hover:bg-app/40"
                >
                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Статус */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${badge.className}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {/* Тип опитування */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent text-xs font-medium">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{survey.surveyType}</span>
                      </span>

                      {/* Тема (якщо передана) */}
                      {survey.topicName && (
                        <span className="px-2.5 py-0.5 rounded-full bg-app border border-line text-xs text-muted">
                          {survey.topicName}
                        </span>
                      )}
                    </div>

                    {/* Назва / текст опитування */}
                    <h2 className="text-base sm:text-lg font-bold text-main leading-snug">
                      {survey.text}
                    </h2>
                  </div>

                  <div
                    className={`w-9 h-9 rounded-xl bg-app border border-line flex items-center justify-center text-muted shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-accent border-accent/40' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {/* Розгорнутий блок */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4 border-t border-line bg-app/30 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <div className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Створено: {formatDate(survey.createdAt)}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="inline-flex items-center gap-1.5 font-medium">
                          <Users className="w-3.5 h-3.5" />
                          <span>Усього відповідей: {survey.totalVotes}</span>
                        </div>

                        {survey.totalVotes > 0 && (
                          <button
                            type="button"
                            disabled={downloadingCsvId === key}
                            onClick={() => handleDownloadCsv(survey.id)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>
                              {downloadingCsvId === key
                                ? 'Формування CSV...'
                                : 'Завантажити повний CSV'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {csvError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                        {csvError}
                      </div>
                    )}

                    {survey.isMultipleChoice ? (
                      <>
                        {survey.options.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                              <ListChecks className="w-3.5 h-3.5" />
                              <span>Варіанти відповідей:</span>
                            </div>

                            <ul className="rounded-xl bg-card border border-line divide-y divide-line">
                              {survey.options.map((opt, idx) => (
                                <li
                                  key={opt.optionId}
                                  className="px-4 py-2.5 text-sm text-main flex items-center gap-2.5"
                                >
                                  <span className="text-xs font-mono text-muted w-4 shrink-0">
                                    {idx + 1}.
                                  </span>
                                  <span>{opt.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="space-y-2">
                          <span className="block text-xs font-semibold text-muted">
                            Відповіді користувачів:
                          </span>

                          {survey.responseStats.length === 0 ? (
                            <p className="text-xs sm:text-sm text-muted py-1">
                              Відповідей користувачів поки немає.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {survey.responseStats.map((stat) => (
                                <div
                                  key={stat.optionId}
                                  className="px-4 py-3 rounded-xl bg-card border border-line flex items-center justify-between gap-3"
                                >
                                  <span className="text-sm font-medium text-main">
                                    {stat.text}
                                  </span>

                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-xs text-muted">
                                      {formatVotesLabel(stat.votesCount)}
                                    </span>
                                    <span className="min-w-[54px] text-right px-2.5 py-1 rounded-lg bg-app border border-line text-xs sm:text-sm font-bold text-accent">
                                      {stat.percentage}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : survey.options.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted py-2">
                        Фіксовані варіанти відповідей відсутні (числове або відкрите опитування).
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {survey.options.map((opt) => (
                          <div
                            key={opt.optionId}
                            className="px-4 py-3 rounded-xl bg-card border border-line flex items-center justify-between gap-3"
                          >
                            <span className="text-sm font-medium text-main">{opt.text}</span>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className="text-xs text-muted">
                                {formatVotesLabel(opt.votesCount)}
                              </span>
                              <span className="min-w-[54px] text-right px-2.5 py-1 rounded-lg bg-app border border-line text-xs sm:text-sm font-bold text-accent">
                                {opt.percentage}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}