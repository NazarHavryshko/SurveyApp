import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart2,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { SurveyChart } from '../components/SurveyChart';
import type { OptionStat, SurveyDiagramData } from '../types/survey';

const SHUFFLE_BAG_KEY = 'mysurvey_shuffle_bag';

function getRemainingBagCount(): number {
  try {
    const raw = localStorage.getItem(SHUFFLE_BAG_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

interface DiagramApiResponse {
  surveyId: number;
  surveyType: string;
  totalResponses: number;
  items: {
    label: string;
    count: number;
  }[];
}

export function SurveyAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const passedQuestionText = (location.state as { questionText?: string } | null)?.questionText;

  const [data, setData] = useState<SurveyDiagramData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [remainingInCycle] = useState<number>(() => getRemainingBagCount());

  useEffect(() => {
    if (!id) {
      navigate('/surveys', { replace: true });
      return;
    }

    setLoading(true);
    setError('');

    apiClient
      .get<DiagramApiResponse>(`/internal/surveys/${id}/diagram`)
      .then((res) => {
        const raw = res.data;
        const items = Array.isArray(raw?.items) ? raw.items : [];
        const total =
          Number(raw?.totalResponses) ||
          items.reduce((acc, item) => acc + Number(item.count || 0), 0);

        const normalizedStats: OptionStat[] = items.map((item) => {
          const count = Number(item.count || 0);
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return {
            label: item.label || 'Варіант',
            count,
            percentage,
          };
        });

        setData({
          surveyId: Number(raw?.surveyId ?? id),
          questionText: passedQuestionText || `Опитування #${id}`,
          surveyType: (raw?.surveyType as any) || 'SingleChoice',
          totalResponses: total,
          averageAnsweredMs: 0,
          stats: normalizedStats,
        });
      })
      .catch((err) => {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.response?.data?.title || err.message;
        setError(`Не вдалося завантажити діаграму (${status || 'мережа'}): ${msg}`);
      })
      .finally(() => setLoading(false));
  }, [id, navigate, passedQuestionText]);

  const handleNextQuestion = () => {
    // Повертаємось на сторінку проходження; поточний масив mysurvey_shuffle_bag
    // не перестворюється, а забирає наступний елемент (наприклад, 9 з 10 -> 8 з 10)
    navigate('/survey/play');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Верхня плашка статусу та залишку питань у поточному циклі */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-line text-highlight font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Відповідь збережено</span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-line text-muted">
          <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>
            Залишилось у списку:{' '}
            <strong className="text-main">{remainingInCycle} з 10</strong>
          </span>
        </div>
      </div>

      {/* Основна картка з кольоровою діаграмою */}
      <div className="bg-card border border-line rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
          <BarChart2 className="w-4 h-4" />
          <span>Статистика відповідей • #{id}</span>
        </div>

        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-7 w-3/4 bg-app rounded-xl" />
            <div className="h-64 w-full bg-app rounded-2xl" />
            <div className="h-14 w-full bg-app rounded-xl" />
            <div className="h-14 w-full bg-app rounded-xl" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : data ? (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-main leading-snug">
              {data.questionText}
            </h1>

            <SurveyChart stats={data.stats} totalResponses={data.totalResponses} />
          </>
        ) : null}

        {/* Кнопки: Наступне питання та Фільтри */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleNextQuestion}
            className="flex-1 py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold text-base inline-flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer"
          >
            <span>Наступне питання</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <Link
            to="/surveys"
            className="sm:w-auto py-3.5 px-4 rounded-xl bg-app border border-line hover:border-accent text-muted hover:text-main text-sm font-medium inline-flex items-center justify-center gap-2 transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Фільтри</span>
          </Link>
        </div>
      </div>
    </div>
  );
}