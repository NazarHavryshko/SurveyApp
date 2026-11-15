import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Send,
  SlidersHorizontal,
  Sparkles,
  Shuffle,
  CheckCircle2,
  Circle,
  CheckSquare,
  Square,
  AlertCircle,
  Info,
} from 'lucide-react';
import { apiClient, ensureAnonymousSession } from '../api/apiClient';
import { SAVED_FILTERS_KEY } from './SurveysFilterPage';
import type {
  RandomSurveyDto,
  SavedSurveyFilters,
  SubmitResponseRequest,
} from '../types/survey';

const SHUFFLE_BAG_KEY = 'mysurvey_shuffle_bag';
const SHUFFLE_BAG_META_KEY = 'mysurvey_shuffle_bag_meta';
const TOPIC_EXHAUSTED_PREFIX = 'mysurvey_topic_exhausted_';

function buildShuffleBag(preferredCount: number): number[] {
  const ones = Math.min(8, Math.max(5, preferredCount));
  const zeros = 10 - ones;
  return [...Array(ones).fill(1), ...Array(zeros).fill(0)];
}

/**
 * Бере одне випадкове значення (1 або 0) зі списку Shuffle Bag.
 * Коли список закінчується — створює його заново відповідно до вибраного відношення.
 */
function drawNextTopicFlag(filters: SavedSurveyFilters): 0 | 1 {
  const metaSignature = `${filters.domainId}:${filters.topicId}:${filters.preferredCount}`;
  const savedMeta = localStorage.getItem(SHUFFLE_BAG_META_KEY);
  let bag: number[] = [];

  if (savedMeta === metaSignature) {
    try {
      const parsed = JSON.parse(localStorage.getItem(SHUFFLE_BAG_KEY) || '[]');
      if (Array.isArray(parsed)) {
        bag = parsed.filter((v) => v === 0 || v === 1);
      }
    } catch {
      bag = [];
    }
  }

  if (bag.length === 0) {
    bag = buildShuffleBag(filters.preferredCount);
  }

  const randomIndex = Math.floor(Math.random() * bag.length);
  const picked = (bag[randomIndex] === 1 ? 1 : 0) as 0 | 1;

  bag.splice(randomIndex, 1);
  localStorage.setItem(SHUFFLE_BAG_KEY, JSON.stringify(bag));
  localStorage.setItem(SHUFFLE_BAG_META_KEY, metaSignature);

  return picked;
}

export function TakeSurveyPage() {
  const navigate = useNavigate();
  const hasLoadedRef = useRef(false);

  const [filters, setFilters] = useState<SavedSurveyFilters | null>(null);
  const [survey, setSurvey] = useState<RandomSurveyDto | null>(null);
  const [isPreferredPick, setIsPreferredPick] = useState<boolean>(true);
  const [topicExhausted, setTopicExhausted] = useState<boolean>(false);

  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [openAnswer, setOpenAnswer] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [emptyPoolMessage, setEmptyPoolMessage] = useState<string>('');

  const fetchNextQuestion = async (activeFilters: SavedSurveyFilters) => {
    setLoading(true);
    setError('');
    setEmptyPoolMessage('');
    setSurvey(null);
    setSelectedOptionIds([]);
    setOpenAnswer('');

    const exhaustedKey = `${TOPIC_EXHAUSTED_PREFIX}${activeFilters.topicId}`;
    setTopicExhausted(sessionStorage.getItem(exhaustedKey) === 'true');

    try {
      await ensureAnonymousSession();

      const flag = drawNextTopicFlag(activeFilters);
      const preferred = flag === 1;
      setIsPreferredPick(preferred);

      const savedRegionId = localStorage.getItem('mysurvey_user_region_id');
      const regionParam = savedRegionId ? { regionId: Number(savedRegionId) } : {};

      const primaryParams = preferred
        ? { topicId: activeFilters.topicId, ...regionParam }
        : { excludeTopicId: activeFilters.topicId, ...regionParam };

      const fallbackParams = preferred
        ? { excludeTopicId: activeFilters.topicId, ...regionParam }
        : { topicId: activeFilters.topicId, ...regionParam };

      try {
        const res = await apiClient.get<RandomSurveyDto>('/Surveys/random', {
          params: primaryParams,
        });
        if (preferred) {
          sessionStorage.removeItem(exhaustedKey);
          setTopicExhausted(false);
        }
        setSurvey(res.data);
      } catch (firstErr: any) {
        if (firstErr.response?.status === 404) {
          if (preferred) {
            // Усі питання з вибраної теми закінчилися — вмикаємо банер і переходимо на рандомні теми
            sessionStorage.setItem(exhaustedKey, 'true');
            setTopicExhausted(true);
          }

          setIsPreferredPick(!preferred);
          const fallbackRes = await apiClient.get<RandomSurveyDto>('/Surveys/random', {
            params: fallbackParams,
          });

          if (!preferred) {
            sessionStorage.removeItem(exhaustedKey);
            setTopicExhausted(false);
          }
          setSurvey(fallbackRes.data);
        } else {
          throw firstErr;
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setEmptyPoolMessage(
          err.response?.data?.message ||
            'Ви вже відповіли на всі доступні активні опитування для обраних параметрів.'
        );
      } else {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.response?.data?.title || err.message;
        setError(`Не вдалося завантажити питання (${status || 'мережа'}): ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const rawFilters = localStorage.getItem(SAVED_FILTERS_KEY);
    if (!rawFilters) {
      navigate('/surveys', { replace: true });
      return;
    }

    try {
      const parsed: SavedSurveyFilters = JSON.parse(rawFilters);
      if (!parsed.topicId) {
        navigate('/surveys', { replace: true });
        return;
      }
      setFilters(parsed);
      fetchNextQuestion(parsed);
    } catch {
      navigate('/surveys', { replace: true });
    }
  }, [navigate]);

  const normalizedType = survey?.surveyType?.toLowerCase() ?? '';
  const options = survey?.options ?? [];
  const isMultiple = normalizedType.includes('multiple');
  const isRatingScale = normalizedType.includes('rating');
  const isNumericInput = isRatingScale || normalizedType.includes('numeric');
  const isOpenOrNumeric =
    options.length === 0 ||
    ['numeric', 'open', 'text'].some((t) => normalizedType.includes(t));

  const handleToggleOption = (optionId: number) => {
    if (isMultiple) {
      setSelectedOptionIds((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptionIds([optionId]);
    }
  };

  const canSubmit = isOpenOrNumeric
    ? openAnswer.trim().length > 0
    : selectedOptionIds.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey || !canSubmit || submitting) return;

    setSubmitting(true);
    setError('');

    const payload: SubmitResponseRequest = {
      surveyId: survey.surveyId,
      selectedOptionIds: isOpenOrNumeric ? [] : selectedOptionIds,
      openAnswer: isOpenOrNumeric ? openAnswer.trim() : null,
      isPreferredDomain: isPreferredPick,
    };

    try {
      await apiClient.post('/internal/responses', payload);
      navigate(`/surveys/${survey.surveyId}/analysis`, {
        state: {
          completed: true,
          surveyId: survey.surveyId,
          questionText: survey.surveyText,
        },
      });
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        navigate(`/surveys/${survey.surveyId}/analysis`, {
          state: {
            completed: true,
            surveyId: survey.surveyId,
            questionText: survey.surveyText,
          },
        });
        return;
      }
      const msg = err.response?.data?.message || err.response?.data?.title || err.message;
      setError(`Помилка відправки відповіді (${status || 'мережа'}): ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-line rounded-2xl p-6 sm:p-10 space-y-5 animate-pulse">
        <div className="h-5 w-44 bg-app rounded-lg" />
        <div className="h-8 w-full bg-app rounded-xl" />
        <div className="space-y-3 pt-2">
          <div className="h-14 bg-app rounded-xl" />
          <div className="h-14 bg-app rounded-xl" />
          <div className="h-14 bg-app rounded-xl" />
        </div>
      </div>
    );
  }

  if (emptyPoolMessage) {
    return (
      <div className="max-w-xl mx-auto bg-card border border-line rounded-2xl p-6 sm:p-8 text-center space-y-5">
        <div className="w-12 h-12 rounded-2xl bg-app border border-line flex items-center justify-center text-highlight mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-main">Усі доступні опитування пройдено</h2>
          <p className="text-sm text-muted">{emptyPoolMessage}</p>
        </div>
        <Link
          to="/surveys"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-sm font-semibold transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Змінити тему у фільтрах</span>
        </Link>
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="max-w-xl mx-auto bg-card border border-rose-800/70 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3 text-rose-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {filters && (
            <button
              type="button"
              onClick={() => fetchNextQuestion(filters)}
              className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Спробувати ще раз
            </button>
          )}
          <Link
            to="/surveys"
            className="px-4 py-2.5 rounded-xl bg-app border border-line text-main text-xs sm:text-sm font-medium transition"
          >
            До фільтрів
          </Link>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Верхня панель інформації про поточне питання та джерело (обрана тема / рандом) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-line text-highlight font-medium">
          {isPreferredPick ? (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Обрана тема: {filters?.topicName || `#${survey.topicId}`}</span>
            </>
          ) : (
            <>
              <Shuffle className="w-3.5 h-3.5" />
              <span>Випадкова тема (мікс {filters?.preferredCount}/{filters?.randomCount})</span>
            </>
          )}
        </div>

        <Link
          to="/surveys"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-line text-muted hover:text-main transition"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Змінити фільтр</span>
        </Link>
      </div>

      {/* Банер-повідомлення, коли питання в обраній темі вичерпано */}
      {topicExhausted && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs sm:text-sm">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-main">
                Ви вже відповіли на всі питання з теми «{filters?.topicName || `#${filters?.topicId}`}»
              </p>
              <p className="text-xs text-muted">
                Продовжуємо показувати випадкові питання з інших тем.
              </p>
            </div>
          </div>
          <Link
            to="/surveys"
            className="shrink-0 self-start sm:self-center px-3 py-1.5 rounded-xl bg-card border border-line hover:border-accent text-xs font-medium text-main transition"
          >
            Обрати іншу тему
          </Link>
        </div>
      )}

      {/* Картка опитування */}
      <div className="bg-card border border-line rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm">
        <div className="space-y-2">
          <span className="text-xs text-muted">
            {isOpenOrNumeric
              ? isRatingScale
                ? 'Оцініть за шкалою (введіть число)'
                : 'Відкрита / числова відповідь'
              : isMultiple
              ? 'Оберіть один або кілька варіантів'
              : isRatingScale
              ? 'Оберіть оцінку за шкалою'
              : 'Оберіть один варіант відповіді'}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-main leading-snug">
            {survey.surveyText}
          </h1>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isOpenOrNumeric ? (
            <div>
              <input
                type={isNumericInput ? 'number' : 'text'}
                step={isRatingScale ? '1' : 'any'}
                min={isRatingScale ? '1' : undefined}
                max={isRatingScale ? '10' : undefined}
                required
                placeholder={isRatingScale ? 'Введіть оцінку...' : 'Введіть вашу відповідь...'}
                value={openAnswer}
                onChange={(e) => setOpenAnswer(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-app border border-line text-main text-base focus:border-accent outline-none transition"
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {options.map((opt) => {
                const isSelected = selectedOptionIds.includes(opt.optionId);
                return (
                  <button
                    key={opt.optionId}
                    type="button"
                    onClick={() => handleToggleOption(opt.optionId)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-main font-medium shadow-sm'
                        : 'bg-app border-line text-muted hover:text-main hover:border-accent/50'
                    }`}
                  >
                    <span className="text-sm sm:text-base">{opt.optionText}</span>
                    <span className={isSelected ? 'text-accent shrink-0' : 'text-muted shrink-0'}>
                      {isMultiple ? (
                        isSelected ? (
                          <CheckSquare className="w-5 h-5" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )
                      ) : isSelected ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-text font-semibold text-base inline-flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Надсилання відповіді...' : 'Відповісти'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}