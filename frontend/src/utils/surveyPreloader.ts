import { apiClient, ensureAnonymousSession } from '../api/apiClient';
import type {
  PreferredTopicCount,
  RandomSurveyDto,
  SavedSurveyFilters,
} from '../types/survey';

export const SHUFFLE_BAG_KEY = 'mysurvey_shuffle_bag';
export const SHUFFLE_BAG_META_KEY = 'mysurvey_shuffle_bag_meta';
export const TOPIC_EXHAUSTED_PREFIX = 'mysurvey_topic_exhausted_';
export const PRELOADED_SURVEY_KEY = 'mysurvey_preloaded_next_survey';

export interface PreloadedSurveyEntry {
  filterSignature: string;
  survey: RandomSurveyDto | null;
  isPreferredPick: boolean;
  topicExhausted: boolean;
  emptyPoolMessage?: string;
}

function buildShuffleBag(preferredCount: PreferredTopicCount): number[] {
  const ones = Math.min(8, Math.max(5, preferredCount));
  const zeros = 10 - ones;
  return [...Array(ones).fill(1), ...Array(zeros).fill(0)];
}

export function getFilterSignature(filters: SavedSurveyFilters): string {
  return `${filters.domainId}:${filters.topicId}:${filters.preferredCount}`;
}

export function clearPreloadedSurvey(): void {
  sessionStorage.removeItem(PRELOADED_SURVEY_KEY);
}

export function consumePreloadedSurvey(
  filters: SavedSurveyFilters
): PreloadedSurveyEntry | null {
  try {
    const raw = sessionStorage.getItem(PRELOADED_SURVEY_KEY);
    if (!raw) return null;

    sessionStorage.removeItem(PRELOADED_SURVEY_KEY);
    const parsed = JSON.parse(raw) as PreloadedSurveyEntry;

    if (parsed.filterSignature !== getFilterSignature(filters)) {
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(PRELOADED_SURVEY_KEY);
    return null;
  }
}

export function drawNextTopicFlag(filters: SavedSurveyFilters): 0 | 1 {
  const metaSignature = getFilterSignature(filters);
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

/**
 * Завантажує 1 наступне питання відповідно до Shuffle Bag (використовується і для фонового буфера, і для прямого запиту).
 */
export async function fetchSingleSurveyQuestion(
  activeFilters: SavedSurveyFilters,
  excludeSurveyIds: number[] = []
): Promise<PreloadedSurveyEntry> {
  await ensureAnonymousSession();

  const exhaustedKey = `${TOPIC_EXHAUSTED_PREFIX}${activeFilters.topicId}`;
  let topicExhausted = sessionStorage.getItem(exhaustedKey) === 'true';

  const flag = drawNextTopicFlag(activeFilters);
  const preferred = flag === 1;
  let isPreferredPick = preferred;

  const savedRegionId = localStorage.getItem('mysurvey_user_region_id');
  const regionParam = savedRegionId ? { regionId: Number(savedRegionId) } : {};

  const primaryParams = preferred
    ? { topicId: activeFilters.topicId, ...regionParam }
    : { excludeTopicId: activeFilters.topicId, ...regionParam };

  const fallbackParams = preferred
    ? { excludeTopicId: activeFilters.topicId, ...regionParam }
    : { topicId: activeFilters.topicId, ...regionParam };

  try {
    let survey: RandomSurveyDto | null = null;

    try {
      const res = await apiClient.get<RandomSurveyDto>('/Surveys/random', {
        params: primaryParams,
      });

      if (!excludeSurveyIds.includes(res.data.surveyId)) {
        survey = res.data;
        if (preferred) {
          sessionStorage.removeItem(exhaustedKey);
          topicExhausted = false;
        }
      }
    } catch (firstErr: any) {
      if (firstErr.response?.status !== 404) {
        throw firstErr;
      }

      if (preferred) {
        sessionStorage.setItem(exhaustedKey, 'true');
        topicExhausted = true;
      }

      isPreferredPick = !preferred;
      const fallbackRes = await apiClient.get<RandomSurveyDto>('/Surveys/random', {
        params: fallbackParams,
      });

      if (!excludeSurveyIds.includes(fallbackRes.data.surveyId)) {
        survey = fallbackRes.data;
        if (!preferred) {
          sessionStorage.removeItem(exhaustedKey);
          topicExhausted = false;
        }
      }
    }

    return {
      filterSignature: getFilterSignature(activeFilters),
      survey,
      isPreferredPick,
      topicExhausted,
    };
  } catch (err: any) {
    if (err.response?.status === 404) {
      return {
        filterSignature: getFilterSignature(activeFilters),
        survey: null,
        isPreferredPick,
        topicExhausted,
        emptyPoolMessage:
          err.response?.data?.message ||
          'Ви вже відповіли на всі доступні активні опитування для обраних параметрів.',
      };
    }
    throw err;
  }
}

let inFlightPreload: Promise<void> | null = null;

/**
 * Фоново завантажує рівно 1 наступне питання в sessionStorage (NFR 1.2).
 */
export function preloadNextSurveyToBuffer(
  activeFilters: SavedSurveyFilters,
  excludeSurveyIds: number[] = []
): Promise<void> {
  const sig = getFilterSignature(activeFilters);

  try {
    const existingRaw = sessionStorage.getItem(PRELOADED_SURVEY_KEY);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as PreloadedSurveyEntry;
      if (
        existing.filterSignature === sig &&
        existing.survey &&
        !excludeSurveyIds.includes(existing.survey.surveyId)
      ) {
        return Promise.resolve();
      }
    }
  } catch {
    sessionStorage.removeItem(PRELOADED_SURVEY_KEY);
  }

  if (inFlightPreload) return inFlightPreload;

  inFlightPreload = fetchSingleSurveyQuestion(activeFilters, excludeSurveyIds)
    .then((entry) => {
      if (entry.survey || entry.emptyPoolMessage) {
        sessionStorage.setItem(PRELOADED_SURVEY_KEY, JSON.stringify(entry));
      }
    })
    .catch(() => {
      // Якщо фоновий запит не вдався, TakeSurveyPage зробить прямий запит під час переходу
    })
    .finally(() => {
      inFlightPreload = null;
    });

  return inFlightPreload;
}