import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SlidersHorizontal,
  User,
  FolderKanban,
  LogIn,
  UserPlus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { apiClient, JWT_TOKEN_KEY } from '../api/apiClient';
import type { AuthUserResponse } from '../types/auth';

type AuthStatus = 'checking' | 'authenticated' | 'guest';

const USER_PROFILE_STORAGE = 'mysurvey_user_profile';

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
  return (
    val === '2' ||
    val === '3' ||
    val === 'moderator' ||
    val === 'admin'
  );
}

function getCachedProfile(): AuthUserResponse | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_STORAGE);
    return raw ? (JSON.parse(raw) as AuthUserResponse) : null;
  } catch {
    return null;
  }
}

export function HomePage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>(() =>
    localStorage.getItem(JWT_TOKEN_KEY) ? 'checking' : 'guest'
  );
  const [profile, setProfile] = useState<AuthUserResponse | null>(() => getCachedProfile());

  useEffect(() => {
    let isMounted = true;

    const syncAuthAndProfile = () => {
      const token = localStorage.getItem(JWT_TOKEN_KEY);

      if (!token) {
        if (isMounted) {
          setProfile(null);
          setAuthStatus('guest');
        }
        return;
      }

      const cached = getCachedProfile();
      if (cached && isMounted) {
        setProfile(cached);
        setAuthStatus('authenticated');
      }

      apiClient
        .get<AuthUserResponse>('/Users/profile')
        .then((res) => {
          if (!isMounted) return;
          setProfile(res.data);
          localStorage.setItem(USER_PROFILE_STORAGE, JSON.stringify(res.data));
          setAuthStatus('authenticated');
        })
        .catch((err) => {
          if (!isMounted) return;
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem(JWT_TOKEN_KEY);
            localStorage.removeItem(USER_PROFILE_STORAGE);
            setProfile(null);
            setAuthStatus('guest');
          } else {
            setAuthStatus('authenticated');
          }
        });
    };

    syncAuthAndProfile();
    window.addEventListener('auth-changed', syncAuthAndProfile);

    return () => {
      isMounted = false;
      window.removeEventListener('auth-changed', syncAuthAndProfile);
    };
  }, []);

  const canModerate = checkCanModerate(profile);

  return (
    <div className="space-y-6 md:space-y-10">
      {/* Головний блок (Hero) */}
      <section className="bg-card border border-line rounded-2xl p-6 sm:p-8 md:p-12 shadow-sm">
        <div className="max-w-3xl space-y-4 md:space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-app border border-line text-xs font-medium text-highlight">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {authStatus === 'authenticated'
                ? `Ви увійшли${profile?.nickname ? `: ${profile.nickname}` : ''}`
                : 'Швидкі опитування та аналітика в реальному часі'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-main leading-tight">
            Обирайте цікаві теми, відповідайте за секунди та досліджуйте статистику
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-2xl">
            Перейдіть до фільтра опитувань, щоб підібрати питання за сферою діяльності, регіоном чи
            статусом, або перегляньте результати вже завершених досліджень.
          </p>

          {/* Основна кнопка — веде на сторінку фільтра опитувань (/surveys) */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/surveys"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold text-base transition shadow-sm"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Пройти опитування</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Секція дій залежно від перевірки авторизації */}
      {authStatus === 'checking' ? (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-card border border-line animate-pulse"
            />
          ))}
        </section>
      ) : authStatus === 'authenticated' ? (
        /* Варіант 1: Користувач АВТОРИЗОВАНИЙ */
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Картка 1: Для модератора/адміністратора — Модерація опитувань, для звичайного користувача — Пройти опитування */}
          {canModerate ? (
            <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-main">Модерація опитувань</h2>
                <p className="text-sm text-muted">
                  Перевіряйте нові опитування користувачів, схвалюйте коректні питання або відхиляйте
                  порушення.
                </p>
              </div>
              <Link
                to="/moderation"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-sm font-semibold transition"
              >
                <span>Перейти до модерації</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-app border border-line flex items-center justify-center text-accent">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-main">Пройти опитування</h2>
                <p className="text-sm text-muted">
                  Відкрийте каталог із фільтрами за сферами, темами та регіонами для вибору
                  опитування.
                </p>
              </div>
              <Link
                to="/surveys"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-sm font-semibold transition"
              >
                <span>Перейти до фільтра</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Картка 2: Відкрити профіль */}
          <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-app border border-line flex items-center justify-center text-highlight">
                <User className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-main">Відкрити профіль</h2>
              <p className="text-sm text-muted">
                Особистий кабінет, ваші демографічні параметри та прогрес пройдених опитувань.
              </p>
            </div>
            <Link
              to="/profile"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-app hover:border-accent border border-line text-main text-sm font-semibold transition"
            >
              <span>Мій профіль</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Картка 3: Подивитися свої опитування */}
          <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-app border border-line flex items-center justify-center text-accent">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-main">Подивитися свої опитування</h2>
              <p className="text-sm text-muted">
                Керуйте створеними питаннями, перевіряйте статус модерації та переглядайте
                аналітику.
              </p>
            </div>
            <Link
              to="/my-surveys"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-app hover:border-accent border border-line text-main text-sm font-semibold transition"
            >
              <span>Мої опитування</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      ) : (
        /* Варіант 2: Користувач НЕ авторизований */
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Картка Авторизації */}
          <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-app border border-line flex items-center justify-center text-accent">
                <LogIn className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-main">Авторизація</h2>
              <p className="text-sm text-muted">
                Увійдіть у свій акаунт, щоб відкрити особистий кабінет, історію відповідей та власні
                опитування.
              </p>
            </div>
            <Link
              to="/auth?mode=login"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-app hover:border-accent border border-line text-main text-sm font-semibold transition"
            >
              <span>Увійти в акаунт</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Картка Реєстрації */}
          <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-app border border-line flex items-center justify-center text-highlight">
                <UserPlus className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-main">Реєстрація</h2>
              <p className="text-sm text-muted">
                Створіть обліковий запис, щоб накопичувати відповіді та публікувати власні
                опитування для спільноти.
              </p>
            </div>
            <Link
              to="/auth?mode=register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-sm font-semibold transition"
            >
              <span>Зареєструватися</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}