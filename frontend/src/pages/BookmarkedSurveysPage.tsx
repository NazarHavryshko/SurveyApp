import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bookmark,
  Trash2,
  AlertCircle,
  ArrowUpRight,
  Layers,
  Clock,
} from 'lucide-react';
import { apiClient } from '../api/apiClient';

// Точний інтерфейс відповідно до відповіді GET /api/Surveys/bookmarks
interface BookmarkedSurveyOption {
  optionId: number;
  optionText: string;
}

interface BookmarkedSurveyItem {
  surveyId: number;
  surveyText: string;
  surveyType: string;
  status: string;
  createdAt: string;
  expiresAt?: string;
  options: BookmarkedSurveyOption[];
}

export function BookmarkedSurveysPage() {
  const navigate = useNavigate();

  const [bookmarks, setBookmarks] = useState<BookmarkedSurveyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    apiClient
      .get<BookmarkedSurveyItem[]>('/Surveys/bookmarks')
      .then((res) => {
        if (!isMounted) return;
        setBookmarks(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        if (!isMounted) return;
        const status = err.response?.status;
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.title ||
          err.message;
        setError(`Не вдалося завантажити збережені опитування (${status || 'мережа'}): ${msg}`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Перехід на сторінку аналізу з передачею surveyText та статусу закладки
  const handleOpenAnalysis = (survey: BookmarkedSurveyItem) => {
    navigate(`/surveys/${survey.surveyId}/analysis`, {
      state: {
        questionText: survey.surveyText,
        isBookmarked: true,
        fromBookmarks: true
      },
    });
  };

  // Видалення опитування із закладок (DELETE /api/Surveys/{surveyId}/bookmark)
  const handleRemoveBookmark = async (e: React.MouseEvent, surveyId: number) => {
    e.stopPropagation();
    if (removingId !== null) return;

    try {
      setRemovingId(surveyId);
      await apiClient.delete(`/Surveys/${surveyId}/bookmark`);
      setBookmarks((prev) => prev.filter((item) => item.surveyId !== surveyId));
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.title ||
        'Не вдалося видалити із закладок';
      alert(msg);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      {/* Шапка сторінки */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
            <Bookmark className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-main">
              Відстежувані опитування
            </h1>
            <p className="text-xs text-muted">
              Натисніть на опитування, щоб переглянути актуальну статистику та коментарі
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-line text-xs text-muted">
          <Layers className="w-3.5 h-3.5 text-accent shrink-0" />
          <span>
            Всього: <strong className="text-main">{bookmarks.length}</strong>
          </span>
        </div>
      </div>

      {/* Стан завантаження / помилки / порожнього списку / картки */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-card border border-line rounded-2xl" />
          <div className="h-24 bg-card border border-line rounded-2xl" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-card border border-line rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-app border border-line flex items-center justify-center mx-auto text-muted">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-main">
              Список відстежуваних порожній
            </h2>
            <p className="text-sm text-muted max-w-md mx-auto">
              Натисніть кнопку «Відстежувати» на сторінці результатів будь-якого опитування, щоб швидко повертатися до нього пізніше.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/surveys"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-sm font-semibold transition"
            >
              <span>Перейти до опитувань</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((survey) => {
            const isActive = survey.status === 'Active';

            return (
              <div
                key={survey.surveyId}
                onClick={() => handleOpenAnalysis(survey)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleOpenAnalysis(survey);
                  }
                }}
                className="group bg-card border border-line hover:border-accent rounded-2xl p-4 sm:p-5 transition shadow-sm cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">

                    {/* Бейдж статусу опитування */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                        isActive
                          ? 'bg-emerald-950/50 border-emerald-800/70 text-emerald-400'
                          : 'bg-app border-line text-muted'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isActive ? 'Активне' : survey.status}
                    </span>

                    {Array.isArray(survey.options) && survey.options.length > 0 && (
                      <span className="text-muted">
                        • {survey.options.length} варіантів
                      </span>
                    )}
                  </div>

                  {/* Текст самого опитування (surveyText) */}
                  <h3 className="text-base sm:text-lg font-semibold text-main group-hover:text-accent transition line-clamp-2">
                    {survey.surveyText}
                  </h3>
                </div>

                {/* Кнопки справа */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleRemoveBookmark(e, survey.surveyId)}
                    disabled={removingId === survey.surveyId}
                    title="Перестати відстежувати"
                    className="p-2 rounded-xl bg-app border border-line text-muted hover:text-rose-400 hover:border-rose-800 transition cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-2 rounded-xl bg-app border border-line text-muted group-hover:text-accent group-hover:border-accent transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}