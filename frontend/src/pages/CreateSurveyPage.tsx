import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  Coins,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  Tag,
  FolderOpen,
  MapPin,
  Clock,
  Hash,
} from 'lucide-react';
import { apiClient, JWT_TOKEN_KEY } from '../api/apiClient';
import { SearchableSelect } from '../components/SearchableSelect';
import type { AuthUserResponse, DictOption } from '../types/auth';

const USER_PROFILE_STORAGE = 'mysurvey_user_profile';
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

type SurveyTypeOption = 'SingleChoice' | 'MultipleChoice' | 'Numeric';

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

export function CreateSurveyPage() {
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

  // Довідники галузей, тем та регіонів
  const [surveyDomains, setSurveyDomains] = useState<DictOption[]>([]);
  const [topics, setTopics] = useState<DictOption[]>([]);
  const [regions, setRegions] = useState<DictOption[]>([]);

  const [surveyDomainId, setSurveyDomainId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [regionTargetId, setRegionTargetId] = useState<string>('');
  const [durationDays, setDurationDays] = useState<string>('7');

  const [loadingInit, setLoadingInit] = useState<boolean>(true);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);

  // Поля опитування
  const [surveyText, setSurveyText] = useState<string>('');
  const [surveyType, setSurveyType] = useState<SurveyTypeOption>('SingleChoice');
  const [options, setOptions] = useState<string[]>(['', '']);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Завантаження балансу токенів, галузей опитувань та регіонів
  useEffect(() => {
    const jwt = localStorage.getItem(JWT_TOKEN_KEY);
    if (!jwt) {
      navigate('/auth?mode=login', { replace: true });
      return;
    }

    let isMounted = true;
    setLoadingInit(true);
    setError('');

    Promise.all([
      apiClient.get<AuthUserResponse>('/Users/profile'),
      apiClient.get('/Dictionaries/survey-domains'),
      apiClient.get('/Dictionaries/regions'),
    ])
      .then(([profileRes, domainsRes, regionsRes]) => {
        if (!isMounted) return;

        const availableTokens = Number(profileRes.data?.availableQuestionTokens ?? 0);
        setTokens(availableTokens);
        localStorage.setItem(USER_PROFILE_STORAGE, JSON.stringify(profileRes.data));

        setSurveyDomains(mapSurveyDomains(domainsRes.data));
        setRegions(mapRegions(regionsRes.data));
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          navigate('/auth?mode=login', { replace: true });
          return;
        }
        const msg = err.response?.data?.message || err.message;
        setError(`Не вдалося завантажити дані форми: ${msg}`);
      })
      .finally(() => {
        if (isMounted) setLoadingInit(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Каскадне завантаження тем після вибору галузі опитування
  useEffect(() => {
    setTopicId('');
    setTopics([]);

    if (!surveyDomainId) return;

    let isMounted = true;
    setLoadingTopics(true);

    apiClient
      .get(`/Dictionaries/survey-domains/${surveyDomainId}/topics`)
      .then((res) => {
        if (isMounted) {
          setTopics(mapTopics(res.data));
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg = err.response?.data?.message || err.message;
          setError(`Не вдалося завантажити теми опитувань: ${msg}`);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingTopics(false);
      });

    return () => {
      isMounted = false;
    };
  }, [surveyDomainId]);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, idx) => (idx === index ? value : opt)));
  };

  const handleAddOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const isChoiceType = surveyType === 'SingleChoice' || surveyType === 'MultipleChoice';
  const cleanedOptions = options.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
  const hasDuplicateOptions =
    new Set(cleanedOptions.map((opt) => opt.toLowerCase())).size !== cleanedOptions.length;

  const parsedDuration = Number(durationDays);
  const isDurationValid =
    durationDays.trim() !== '' &&
    Number.isInteger(parsedDuration) &&
    parsedDuration >= 1 &&
    parsedDuration <= 365;

  const canCreate = tokens > 0;
  const isFormValid =
    canCreate &&
    topicId !== '' &&
    surveyText.trim().length >= 5 &&
    isDurationValid &&
    (!isChoiceType || (cleanedOptions.length >= MIN_OPTIONS && !hasDuplicateOptions));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!canCreate) {
      setError('У вас недостатньо токенів для створення нового опитування.');
      return;
    }

    if (!isDurationValid) {
      setError('Тривалість опитування має становити від 1 до 365 днів.');
      return;
    }

    if (isChoiceType && hasDuplicateOptions) {
      setError('Варіанти відповідей не повинні повторюватися.');
      return;
    }

    if (!isFormValid) {
      setError('Перевірте правильність заповнення всіх обов’язкових полів.');
      return;
    }

    setSubmitting(true);

    const payload = {
      surveyText: surveyText.trim(),
      surveyType,
      topicId: Number(topicId),
      regionTargetId: regionTargetId ? Number(regionTargetId) : null,
      durationDays: parsedDuration,
      options: isChoiceType
        ? cleanedOptions.map((text, idx) => ({
            optionText: text,
            orderIndex: idx,
          }))
        : [],
    };

    try {
      await apiClient.post('/Surveys', payload);

      const nextTokens = Math.max(0, tokens - 1);
      setTokens(nextTokens);

      try {
        const rawProfile = localStorage.getItem(USER_PROFILE_STORAGE);
        if (rawProfile) {
          const parsed = JSON.parse(rawProfile);
          localStorage.setItem(
            USER_PROFILE_STORAGE,
            JSON.stringify({ ...parsed, availableQuestionTokens: nextTokens })
          );
        }
      } catch {
        // Ігноруємо помилку оновлення кешу
      }

      window.dispatchEvent(new Event('auth-changed'));
      setSuccessMsg('Опитування створено та відправлено на модерацію!');

      setTimeout(() => {
        navigate('/my-surveys', { replace: true });
      }, 800);
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : err.message);
      setError(`Помилка створення опитування (${status || 'мережа'}): ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Навігація назад + баланс токенів */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/my-surveys"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-line hover:border-accent/50 text-xs sm:text-sm font-medium text-muted hover:text-main transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад до моїх опитувань</span>
        </Link>

        <div
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold ${
            canCreate
              ? 'bg-accent/10 border-accent/25 text-accent'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-500'
          }`}
        >
          <Coins className="w-4 h-4 shrink-0" />
          <span>Доступно токенів: {tokens}</span>
        </div>
      </div>

      {/* Основна картка форми */}
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="space-y-1 pb-5 border-b border-line">
          <h1 className="text-xl sm:text-2xl font-bold text-main tracking-tight">
            Нове опитування
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            За створення одного опитування списується <strong className="text-main">1 токен</strong>.
            Після перевірки модератором воно стане доступним іншим користувачам.
          </p>
        </div>

        {/* Попередження при 0 токенів */}
        {!loadingInit && !canCreate && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              У вас немає доступних токенів для створення опитування. Пройдіть опитування інших
              користувачів, щоб заробити токен.
            </span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs sm:text-sm font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Категорія: Галузь та Тема */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Галузь опитування <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={surveyDomains}
                value={surveyDomainId}
                onChange={setSurveyDomainId}
                disabled={loadingInit || !canCreate}
                placeholder={loadingInit ? 'Завантаження...' : 'Оберіть галузь...'}
                icon={<FolderOpen className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Тема <span className="text-rose-500">*</span>
              </label>
              <SearchableSelect
                options={topics}
                value={topicId}
                onChange={setTopicId}
                disabled={!surveyDomainId || loadingTopics || !canCreate}
                placeholder={
                  !surveyDomainId
                    ? 'Спочатку оберіть галузь'
                    : loadingTopics
                    ? 'Завантаження тем...'
                    : 'Оберіть тему...'
                }
                icon={<Tag className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Тип опитування */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted">
              Тип опитування <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'SingleChoice' as const,
                  label: 'Один варіант',
                  desc: 'Вибір однієї відповіді',
                },
                {
                  id: 'MultipleChoice' as const,
                  label: 'Кілька варіантів',
                  desc: 'Множинний вибір',
                },
                {
                  id: 'Numeric' as const,
                  label: 'Числова відповідь',
                  desc: 'Довільне число без меж',
                },
              ].map((typeItem) => {
                const active = surveyType === typeItem.id;
                return (
                  <button
                    key={typeItem.id}
                    type="button"
                    disabled={!canCreate}
                    onClick={() => setSurveyType(typeItem.id)}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      active
                        ? 'bg-accent/10 border-accent text-main'
                        : 'bg-app/60 border-line hover:border-accent/40 text-main'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                      <Layers
                        className={`w-4 h-4 shrink-0 ${active ? 'text-accent' : 'text-muted'}`}
                      />
                      <span>{typeItem.label}</span>
                    </div>
                    <p className="text-[11px] text-muted mt-1">{typeItem.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Текст питання */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-muted">
                Текст питання <span className="text-rose-500">*</span>
              </label>
              <span className="text-muted font-mono">{surveyText.length}/300</span>
            </div>
            <div className="relative">
              <HelpCircle className="w-4 h-4 text-muted absolute left-3.5 top-3.5 pointer-events-none" />
              <textarea
                required
                rows={3}
                minLength={5}
                maxLength={300}
                disabled={!canCreate}
                value={surveyText}
                onChange={(e) => setSurveyText(e.target.value)}
                placeholder="Сформулюйте чітке та зрозуміле питання..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition resize-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Варіанти відповідей або підказка для числового типу */}
          {isChoiceType ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-muted">
                  Варіанти відповідей (від {MIN_OPTIONS} до {MAX_OPTIONS}){' '}
                  <span className="text-rose-500">*</span>
                </label>

                {options.length < MAX_OPTIONS && (
                  <button
                    type="button"
                    disabled={!canCreate}
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/25 text-accent text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Додати варіант</span>
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-7 text-center text-xs font-mono text-muted shrink-0">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={150}
                      disabled={!canCreate}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Варіант відповіді №${idx + 1}`}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition disabled:opacity-60"
                    />
                    {options.length > MIN_OPTIONS && (
                      <button
                        type="button"
                        disabled={!canCreate}
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

              {hasDuplicateOptions && (
                <p className="text-xs text-rose-500 font-medium">
                  Виявлено однакові варіанти відповідей — зробіть їх унікальними.
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-app/60 border border-line flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0 mt-0.5">
                <Hash className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-semibold text-main">
                  Вільне введення числа без обмежень
                </p>
                <p className="text-xs text-muted">
                  Респонденти самостійно вказуватимуть будь-яке числове значення у відповідь на ваше
                  питання без заданих мінімальних чи максимальних меж.
                </p>
              </div>
            </div>
          )}

          {/* Додаткові параметри: Цільовий регіон та Тривалість опитування */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Цільовий регіон (необов’язково)
              </label>
              <SearchableSelect
                options={regions}
                value={regionTargetId}
                onChange={setRegionTargetId}
                disabled={loadingInit || !canCreate}
                placeholder="Усі регіони України"
                icon={<MapPin className="w-4 h-4" />}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-muted">
                  Тривалість опитування (днів) <span className="text-rose-500">*</span>
                </label>
                <span className="text-muted">від 1 до 365</span>
              </div>

              <div className="relative">
                <Clock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  required
                  min={1}
                  max={365}
                  step={1}
                  disabled={!canCreate}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="Наприклад, 7"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition disabled:opacity-60"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[1, 3, 7, 14, 30, 365].map((days) => (
                  <button
                    key={days}
                    type="button"
                    disabled={!canCreate}
                    onClick={() => setDurationDays(String(days))}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer disabled:opacity-50 ${
                      Number(durationDays) === days
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-app border-line text-muted hover:text-main'
                    }`}
                  >
                    {days === 365 ? '1 рік (365)' : `${days} дн.`}
                  </button>
                ))}
              </div>

              {!isDurationValid && (
                <p className="text-xs text-rose-500 font-medium">
                  Вкажіть ціле число днів від 1 до 365.
                </p>
              )}
            </div>
          </div>

          {/* Кнопки дій */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-line">
            <Link
              to="/my-surveys"
              className="px-4 py-3 rounded-xl bg-app border border-line text-muted hover:text-main text-sm font-medium transition"
            >
              Скасувати
            </Link>

            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-45 disabled:hover:bg-accent text-accent-text text-sm font-semibold inline-flex items-center gap-2 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Створення...' : 'Опублікувати опитування'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}