import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Tag,
  Sliders,
  Play,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Shuffle,
} from 'lucide-react';
import { apiClient, ensureAnonymousSession } from '../api/apiClient';
import type {
  PreferredTopicCount,
  SavedSurveyFilters,
  SurveyDomain,
  SurveyTopic,
} from '../types/survey';

export const SAVED_FILTERS_KEY = 'mysurvey_survey_filters';

const SLIDER_SECTIONS: {
  preferred: PreferredTopicCount;
  random: number;
  label: string;
  hint: string;
}[] = [
  { preferred: 5, random: 5, label: '5 / 5', hint: 'Рівний баланс теми та випадкових питань' },
  { preferred: 6, random: 4, label: '6 / 4', hint: 'Помірний фокус на обраній темі' },
  { preferred: 7, random: 3, label: '7 / 3', hint: 'Поглиблене проходження обраної теми' },
  { preferred: 8, random: 2, label: '8 / 2', hint: 'Максимальний акцент на обраній темі' },
];

export function SurveysFilterPage() {
  const navigate = useNavigate();

  // Статус анонімної реєстрації пристрою
  const [deviceStatus, setDeviceStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [deviceId, setDeviceId] = useState<string>('');
  const [isFromCache, setIsFromCache] = useState<boolean>(false);

  // Довідники областей і тем
  const [domains, setDomains] = useState<SurveyDomain[]>([]);
  const [topics, setTopics] = useState<SurveyTopic[]>([]);
  const [loadingDomains, setLoadingDomains] = useState<boolean>(true);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);

  // Обрані фільтри
  const [selectedDomainId, setSelectedDomainId] = useState<number | ''>('');
  const [selectedTopicId, setSelectedTopicId] = useState<number | ''>('');
  const [pendingTopicId, setPendingTopicId] = useState<number | null>(null);
  const [preferredCount, setPreferredCount] = useState<PreferredTopicCount>(5);
  const [restoredFromMemory, setRestoredFromMemory] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // 1. При вході: перевірка анонімного профілю пристрою + відновлення збережених фільтрів + завантаження областей
  useEffect(() => {
    ensureAnonymousSession().then((session) => {
      setDeviceId(session.deviceId);
      setIsFromCache(session.fromCache);
      setDeviceStatus(session.isRegistered ? 'ready' : 'error');
    });

    const rawSaved = localStorage.getItem(SAVED_FILTERS_KEY);
    if (rawSaved) {
      try {
        const parsed: SavedSurveyFilters = JSON.parse(rawSaved);
        if (parsed.domainId) {
          setSelectedDomainId(parsed.domainId);
          setPendingTopicId(parsed.topicId || null);
        }
        if ([5, 6, 7, 8].includes(parsed.preferredCount)) {
          setPreferredCount(parsed.preferredCount);
        }
        setRestoredFromMemory(true);
      } catch {
        localStorage.removeItem(SAVED_FILTERS_KEY);
      }
    }

    setLoadingDomains(true);
    apiClient
      .get('/Dictionaries/survey-domains')
      .then((res) => {
        const rawList = Array.isArray(res.data) ? res.data : [];
        const list: SurveyDomain[] = rawList.map((item: any) => ({
          domainId: item.domainId ?? item.id,
          domainName: item.domainName ?? item.name ?? '',
        }));
        setDomains(list);
      })
      .catch(() => {
        setDomains([]);
      })
      .finally(() => setLoadingDomains(false));
  }, []);

  // 2. Підвантаження тем після вибору області опитування
  useEffect(() => {
    if (selectedDomainId === '') {
      setTopics([]);
      setSelectedTopicId('');
      return;
    }

    setLoadingTopics(true);
    apiClient
      .get(`/Dictionaries/survey-domains/${selectedDomainId}/topics`)
      .then((res) => {
        const rawList = Array.isArray(res.data) ? res.data : [];
        const list: SurveyTopic[] = rawList.map((item: any) => ({
          topicId: item.topicId ?? item.id,
          domainId: item.domainId ?? Number(selectedDomainId),
          topicName: item.topicName ?? item.name ?? '',
        }));
        setTopics(list);

        if (pendingTopicId && list.some((t) => t.topicId === pendingTopicId)) {
          setSelectedTopicId(pendingTopicId);
        } else if (list.length > 0) {
          setSelectedTopicId(list[0].topicId);
        } else {
          setSelectedTopicId('');
        }
        setPendingTopicId(null);
      })
      .catch(() => {
        setTopics([]);
        setSelectedTopicId('');
      })
      .finally(() => setLoadingTopics(false));
  }, [selectedDomainId]);

  const handleDomainChange = (value: string) => {
    setFormError('');
    setRestoredFromMemory(false);
    setPendingTopicId(null);
    setSelectedDomainId(value === '' ? '' : Number(value));
  };

  const handleResetFilters = () => {
    localStorage.removeItem(SAVED_FILTERS_KEY);
    setSelectedDomainId('');
    setSelectedTopicId('');
    setTopics([]);
    setPreferredCount(5);
    setRestoredFromMemory(false);
    setFormError('');
  };

  // 3. Збереження вибраних фільтрів у пам'ять та перехід на сторінку опитування
  const handleStartSurvey = async () => {
    if (selectedDomainId === '' || selectedTopicId === '') {
      setFormError('Оберіть область опитування та тему перед початком.');
      return;
    }

    const domainObj = domains.find((d) => d.domainId === selectedDomainId);
    const topicObj = topics.find((t) => t.topicId === selectedTopicId);

    const filtersToSave: SavedSurveyFilters = {
      domainId: Number(selectedDomainId),
      domainName: domainObj?.domainName || '',
      topicId: Number(selectedTopicId),
      topicName: topicObj?.topicName || '',
      preferredCount,
      randomCount: 10 - preferredCount,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filtersToSave));

    await ensureAnonymousSession();
    navigate('/survey/play');
  };

  const currentSection =
    SLIDER_SECTIONS.find((s) => s.preferred === preferredCount) || SLIDER_SECTIONS[0];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Заголовок та статус ідентифікатора пристрою */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-main">Налаштування опитування</h1>
          <p className="text-sm text-muted mt-1">
            Оберіть напрямок, тему та співвідношення питань для вашої сесії
          </p>
        </div>

        <div
          title={deviceId ? `ID пристрою: ${deviceId}` : 'Перевірка пристрою'}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-line text-xs text-muted self-start sm:self-auto"
        >
          <ShieldCheck className="w-4 h-4 text-highlight shrink-0" />
          <span>
              {deviceStatus === 'checking'
              ? 'Ініціалізація профілю...'
              : localStorage.getItem('mysurvey_jwt_token')
              ? 'Ви авторизовані'
              : isFromCache
              ? 'Анонімний профіль збережено'
              : 'Анонімний профіль створено'}
          </span>
        </div>
      </div>

      {/* Плашка відновлених фільтрів */}
      {restoredFromMemory && (
        <div className="bg-card border border-line rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-highlight">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Підставлено ваші попередні збережені фільтри</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-muted hover:text-main transition cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Скинути</span>
          </button>
        </div>
      )}

      {/* Основна форма фільтрів */}
      <div className="bg-card border border-line rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm">
        {/* 1. Вибір області опитування */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-main">
            <Layers className="w-4 h-4 text-accent" />
            <span>1. Область опитування</span>
          </label>
          <select
            value={selectedDomainId}
            disabled={loadingDomains}
            onChange={(e) => handleDomainChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-app border border-line text-main text-sm sm:text-base focus:border-accent outline-none transition"
          >
            <option value="">
              {loadingDomains ? 'Завантаження областей...' : '— Оберіть область опитування —'}
            </option>
            {domains.map((d) => (
              <option key={d.domainId} value={d.domainId}>
                {d.domainName}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Вибір теми (підвантажується з обраної області) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-main">
            <Tag className="w-4 h-4 text-accent" />
            <span>2. Тема з обраної області</span>
          </label>
          <select
            value={selectedTopicId}
            disabled={selectedDomainId === '' || loadingTopics}
            onChange={(e) => {
              setFormError('');
              setSelectedTopicId(e.target.value === '' ? '' : Number(e.target.value));
            }}
            className="w-full px-4 py-3 rounded-xl bg-app border border-line text-main text-sm sm:text-base focus:border-accent outline-none transition disabled:opacity-50"
          >
            <option value="">
              {selectedDomainId === ''
                ? 'Спочатку оберіть область опитування'
                : loadingTopics
                ? 'Завантаження тем...'
                : topics.length === 0
                ? 'Тем у цій області не знайдено'
                : '— Оберіть тему —'}
            </option>
            {topics.map((t) => (
              <option key={t.topicId} value={t.topicId}>
                {t.topicName}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Повзунок на 4 секції: 5/5, 6/4, 7/3, 8/2 */}
        <div className="space-y-4 pt-2 border-t border-line">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-main">
              <Sliders className="w-4 h-4 text-accent" />
              <span>3. Співвідношення питань (Обрана тема / Рандомні)</span>
            </label>
            <span className="text-sm font-bold text-highlight">{currentSection.label}</span>
          </div>

          {/* Візуальна шкала розподілу 10 питань */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-app border border-line overflow-hidden flex">
              <div
                className="bg-accent transition-all duration-200"
                style={{ width: `${preferredCount * 10}%` }}
              />
              <div
                className="bg-highlight/80 transition-all duration-200"
                style={{ width: `${(10 - preferredCount) * 10}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-muted">
              <span>
                Обрана тема: <strong className="text-main">{preferredCount} питань</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <Shuffle className="w-3.5 h-3.5 text-highlight" />
                Рандомні з різних тем: <strong className="text-main">{10 - preferredCount} питань</strong>
              </span>
            </div>
          </div>

          {/* Інтерактивний range-повзунок */}
          <div className="px-1 pt-1">
            <input
              type="range"
              min={5}
              max={8}
              step={1}
              value={preferredCount}
              onChange={(e) => setPreferredCount(Number(e.target.value) as PreferredTopicCount)}
              className="w-full accent-(--accent) cursor-pointer h-2 rounded-lg bg-app"
            />
          </div>

          {/* 4 клікабельні секції для зручного вибору на мобільних і десктопі */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {SLIDER_SECTIONS.map((sec) => {
              const active = preferredCount === sec.preferred;
              return (
                <button
                  key={sec.preferred}
                  type="button"
                  onClick={() => setPreferredCount(sec.preferred)}
                  className={`py-2.5 px-2 rounded-xl border text-center transition cursor-pointer ${
                    active
                      ? 'bg-accent border-accent text-accent-text font-bold shadow-sm'
                      : 'bg-app border-line text-muted hover:text-main hover:border-accent/50 font-medium'
                  }`}
                >
                  <div className="text-sm sm:text-base">{sec.label}</div>
                  <div className="text-[10px] sm:text-xs opacity-80">
                    {sec.preferred} тем. / {sec.random} вип.
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted text-center">{currentSection.hint}</p>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs sm:text-sm">
            {formError}
          </div>
        )}

        {/* Кнопка "Почати опитування" */}
        <button
          type="button"
          onClick={handleStartSurvey}
          className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold text-base inline-flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer"
        >
          <Play className="w-5 h-5" />
          <span>Почати опитування</span>
        </button>
      </div>
    </div>
  );
}