import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  AlertCircle,
  Bookmark,
  MessageSquare,
  Send,
  Reply,
  Trash2,
  CornerDownRight,
  LogIn,
} from 'lucide-react';
import { apiClient, JWT_TOKEN_KEY } from '../api/apiClient';
import { SurveyChart } from '../components/SurveyChart';
import { SAVED_FILTERS_KEY } from './SurveysFilterPage';
import {
  PRELOADED_SURVEY_KEY,
  SHUFFLE_BAG_KEY,
  preloadNextSurveyToBuffer,
} from '../utils/surveyPreloader';
import type {
  OptionStat,
  SavedSurveyFilters,
  SurveyDiagramData,
} from '../types/survey';

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
  id: string;
  surveyId: number;
  nextCommentId: number;
  comments: SurveyComment[];
}

export function SurveyAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Перевірка авторизації користувача
  const isAuthenticated = Boolean(localStorage.getItem(JWT_TOKEN_KEY));

  // Зчитуємо параметри, передані через роутер
  const passedState = location.state as {
    questionText?: string;
    isBookmarked?: boolean;
    fromBookmarks?: boolean;
  } | null;

  const passedQuestionText = passedState?.questionText;
  const isFromBookmarks = Boolean(passedState?.fromBookmarks);

  // Визначення прав адміністратора
  const isAdmin =
    isAuthenticated &&
    (localStorage.getItem('userRole') === 'Admin' ||
      localStorage.getItem('role') === 'Admin' ||
      localStorage.getItem('isAdmin') === 'true');

  // Стейт діаграми
  const [data, setData] = useState<SurveyDiagramData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [remainingInCycle, setRemainingInCycle] = useState<number>(() => getRemainingBagCount());
  const [isNextReady, setIsNextReady] = useState<boolean>(() =>
    Boolean(sessionStorage.getItem(PRELOADED_SURVEY_KEY))
  );

  // Стейт відстеження опитування (закладки)
  const [isBookmarked, setIsBookmarked] = useState<boolean>(Boolean(passedState?.isBookmarked));
  const [bookmarkLoading, setBookmarkLoading] = useState<boolean>(false);

  // Стейт коментарів
  const [comments, setComments] = useState<SurveyComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(true);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Стейт відповіді на конкретний коментар
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);

  // Завантаження коментарів: GET /api/internal/surveys/{surveyId}/comments
  const fetchComments = useCallback(async () => {
    if (!id) return;
    try {
      setCommentsLoading(true);
      const res = await apiClient.get<CommentsApiResponse>(`/internal/surveys/${id}/comments`);
      setComments(Array.isArray(res.data?.comments) ? res.data.comments : []);
    } catch (err) {
      console.error('Помилка завантаження коментарів:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      navigate('/surveys', { replace: true });
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError('');

    // 1. Запит №1: отримання даних кругової діаграми
    apiClient
      .get<DiagramApiResponse>(`/internal/surveys/${id}/diagram`)
      .then((res) => {
        if (!isMounted) return;
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
        if (!isMounted) return;
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.response?.data?.title || err.message;
        setError(`Не вдалося завантажити діаграму (${status || 'мережа'}): ${msg}`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Запит №2: перевірка чи відстежується опитування (тільки для авторизованих)
    if (isAuthenticated) {
      apiClient
        .get<{ isBookmarked: boolean }>(`/Surveys/${id}/bookmark/status`)
        .then((res) => {
          if (isMounted) {
            setIsBookmarked(Boolean(res.data?.isBookmarked));
          }
        })
        .catch(() => {
          // Ігноруємо помилки статусу закладок
        });
    }

    // 3. Запит №3 (паралельний у фоні): підвантаження наступного питання
    if (!isFromBookmarks) {
      const rawFilters = localStorage.getItem(SAVED_FILTERS_KEY);
      if (rawFilters) {
        try {
          const parsedFilters = JSON.parse(rawFilters) as SavedSurveyFilters;
          if (parsedFilters.topicId) {
            preloadNextSurveyToBuffer(parsedFilters, [Number(id)]).then(() => {
              if (!isMounted) return;
              setRemainingInCycle(getRemainingBagCount());
              setIsNextReady(Boolean(sessionStorage.getItem(PRELOADED_SURVEY_KEY)));
            });
          }
        } catch {
          // Ігноруємо пошкоджені фільтри
        }
      }
    }

    // 4. Запит №4: завантаження коментарів
    fetchComments();

    return () => {
      isMounted = false;
    };
  }, [id, navigate, passedQuestionText, isFromBookmarks, isAuthenticated, fetchComments]);

  // Почати / перестати відстежувати опитування
  const handleToggleBookmark = async () => {
    if (!id || !isAuthenticated || bookmarkLoading) return;
    try {
      setBookmarkLoading(true);
      if (isBookmarked) {
        await apiClient.delete(`/Surveys/${id}/bookmark`);
        setIsBookmarked(false);
      } else {
        await apiClient.post(`/Surveys/${id}/bookmark`);
        setIsBookmarked(true);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.title ||
        'Не вдалося змінити статус відстеження';
      alert(msg);
    } finally {
      setBookmarkLoading(false);
    }
  };

  // Додавання основного коментаря
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !isAuthenticated || !newCommentText.trim() || submittingComment) return;

    try {
      setSubmittingComment(true);
      await apiClient.post(`/internal/surveys/${id}/comments`, {
        text: newCommentText.trim(),
        parentCommentId: null,
      });
      setNewCommentText('');
      await fetchComments();
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        data?.title ||
        (typeof data === 'string' ? data : '') ||
        err.message;
      alert(`Помилка (${status || 'мережа'}): ${msg}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Додавання відповіді на коментар
  const handleAddReply = async (parentCommentId: number) => {
    if (!id || !isAuthenticated || !replyText.trim() || submittingReply) return;

    try {
      setSubmittingReply(true);
      await apiClient.post(`/internal/surveys/${id}/comments`, {
        text: replyText.trim(),
        parentCommentId,
      });
      setReplyText('');
      setReplyingToId(null);
      await fetchComments();
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.message ||
        data?.title ||
        (typeof data === 'string' ? data : '') ||
        err.message;
      alert(`Помилка (${status || 'мережа'}): ${msg}`);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Видалення коментаря або відповіді
  const handleDeleteComment = async (commentId: number, replyId?: number) => {
    if (!id) return;
    const confirmMsg =
      replyId !== undefined
        ? 'Видалити цю відповідь?'
        : 'Видалити цей коментар разом з усіма відповідями?';

    if (!window.confirm(confirmMsg)) return;

    try {
      await apiClient.delete(`/internal/surveys/${id}/comments/${commentId}`, {
        params: replyId !== undefined ? { replyId } : undefined,
      });
      await fetchComments();
    } catch (err: any) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.title ||
        'Не вдалося видалити запис';
      alert(msg);
    }
  };

  const handleNextQuestion = () => {
    navigate('/survey/play');
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Якщо відкрито зі сторінки закладок — показуємо кнопку повернення; інакше — статус відповіді */}
      {isFromBookmarks ? (
        <div>
          <Link
            to="/bookmarks"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-line hover:border-accent text-xs font-medium text-muted hover:text-main transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Назад до відстежуваних</span>
          </Link>
        </div>
      ) : (
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
      )}

      {/* Основна картка з кольоровою діаграмою */}
      <div className="bg-card border border-line rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
            <BarChart2 className="w-4 h-4" />
            <span>Статистика відповідей • #{id}</span>
          </div>

          {/* Кнопка відстеження опитування (лише для зареєстрованих користувачів) */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={bookmarkLoading}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer disabled:opacity-50 ${
                isBookmarked
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-app border-line text-muted hover:text-main hover:border-accent'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? 'Відстежується' : 'Відстежувати'}</span>
            </button>
          )}
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

        {/* Кнопки "Наступне питання" та "Фільтри" відображаються лише поза режимом закладок */}
        {!isFromBookmarks && (
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex-1 py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold text-base inline-flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer"
            >
              <span>{isNextReady ? 'Наступне питання' : 'Наступне питання'}</span>
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
        )}
      </div>

      {/* Секція коментарів */}
      <div className="bg-card border border-line rounded-2xl p-5 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-main">
          <MessageSquare className="w-4 h-4 text-accent" />
          <span>Коментарі ({comments.length})</span>
        </div>

        {/* Форма створення коментаря (лише для зареєстрованих користувачів) */}
        {isAuthenticated ? (
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Напишіть коментар до опитування..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-app border border-line text-sm text-main placeholder:text-muted focus:outline-none focus:border-accent transition"
            />
            <button
              type="submit"
              disabled={!newCommentText.trim() || submittingComment}
              className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-medium text-sm inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Надіслати</span>
            </button>
          </form>
        ) : (
          <div className="p-3.5 rounded-xl bg-app border border-line flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-muted">
            <span>Лише зареєстровані користувачі можуть залишати коментарі.</span>
            <Link
              to="/auth?mode=login"
              className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Увійти</span>
            </Link>
          </div>
        )}

        {/* Список коментарів */}
        {commentsLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-20 bg-app rounded-xl" />
            <div className="h-20 bg-app rounded-xl" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-sm text-muted py-4">
            Поки що немає коментарів.{isAuthenticated ? ' Будьте першим!' : ''}
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.commentId}
                className="p-4 rounded-xl bg-app border border-line space-y-3"
              >
                {/* Шапка основного коментаря */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-main">
                      {comment.nickname || 'Користувач'}
                    </span>
                    <span className="ml-2 text-xs text-muted">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>

                  {isAuthenticated && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(
                            replyingToId === comment.commentId ? null : comment.commentId
                          );
                          setReplyText('');
                        }}
                        className="text-xs text-muted hover:text-accent inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>Відповісти</span>
                      </button>

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.commentId)}
                          title="Видалити коментар (Адмін)"
                          className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-950/50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Текст коментаря */}
                <p className="text-sm text-main/90 whitespace-pre-wrap break-words">
                  {comment.text}
                </p>

                {/* Форма додавання відповіді (лише для зареєстрованих) */}
                {isAuthenticated && replyingToId === comment.commentId && (
                  <div className="pt-1 flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Відповідь для ${comment.nickname || 'користувача'}...`}
                      className="flex-1 px-3 py-2 rounded-lg bg-card border border-line text-xs text-main placeholder:text-muted focus:outline-none focus:border-accent"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleAddReply(comment.commentId)}
                      disabled={!replyText.trim() || submittingReply}
                      className="px-3 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-text text-xs font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      Відповісти
                    </button>
                  </div>
                )}

                {/* Гілка відповідей (replies) */}
                {Array.isArray(comment.replies) && comment.replies.length > 0 && (
                  <div className="pl-4 sm:pl-6 pt-2 space-y-2.5 border-l-2 border-line">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.replyId}
                        className="p-3 rounded-lg bg-card/70 border border-line/60 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3 h-3 text-accent shrink-0" />
                            <span className="text-xs font-semibold text-main">
                              {reply.nickname || 'Користувач'}
                            </span>
                            <span className="text-[11px] text-muted">
                              {formatDate(reply.createdAt)}
                            </span>
                          </div>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteComment(comment.commentId, reply.replyId)
                              }
                              title="Видалити відповідь (Адмін)"
                              className="text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-950/50 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-main/90 pl-4 whitespace-pre-wrap break-words">
                          {reply.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}