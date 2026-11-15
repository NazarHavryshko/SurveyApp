import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  LogIn,
  UserPlus,
  Lock,
  User,
  Calendar,
  Briefcase,
  MapPin,
  Heart,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  apiClient,
  ensureAnonymousSession,
  getPersistentDeviceId,
  ANON_USER_ID_KEY,
  ANON_REGISTERED_KEY,
  JWT_TOKEN_KEY,
} from '../api/apiClient';
import type {
  AuthUserResponse,
  DictOption,
  LoginRequest,
  RegisterRequest,
} from '../types/auth';
import { SearchableSelect } from '../components/SearchableSelect';

const USER_PROFILE_STORAGE = 'mysurvey_user_profile';
const USER_REGION_STORAGE = 'mysurvey_user_region_id';

function mapRegions(rawList: any[]): DictOption[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => ({
      id: Number(item.regionId ?? item.id ?? 0),
      name: String(item.regionName ?? item.name ?? ''),
    }))
    .filter((item) => item.id > 0 && item.name.length > 0);
}

function mapHobbies(rawList: any[]): DictOption[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => ({
      id: Number(item.hobbyId ?? item.id ?? 0),
      name: String(item.hobbyName ?? item.name ?? ''),
    }))
    .filter((item) => item.id > 0 && item.name.length > 0);
}

function mapOccupationDomains(rawList: any[]): DictOption[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => ({
      id: Number(item.occupationDomainId ?? item.domainId ?? item.id ?? 0),
      name: String(item.occupationDomainName ?? item.domainName ?? item.name ?? ''),
    }))
    .filter((item) => item.id > 0 && item.name.length > 0);
}

function mapOccupations(rawList: any[]): DictOption[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((item) => ({
      id: Number(item.occupationId ?? item.id ?? 0),
      name: String(item.occupationName ?? item.name ?? ''),
    }))
    .filter((item) => item.id > 0 && item.name.length > 0);
}

export function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [mode, setMode] = useState<'login' | 'register'>(() =>
    searchParams.get('mode') === 'login' || location.pathname === '/login'
      ? 'login'
      : 'register'
  );
  const [deviceKey, setDeviceKey] = useState<string>(() => getPersistentDeviceId());

  // Спільні поля
  const [nickname, setNickname] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Поля реєстрації
  const [gender, setGender] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [occupationDomainId, setOccupationDomainId] = useState<string>('');
  const [occupationId, setOccupationId] = useState<string>('');
  const [regionId, setRegionId] = useState<string>('');
  const [hobbyId, setHobbyId] = useState<string>('');

  // Довідники
  const [regions, setRegions] = useState<DictOption[]>([]);
  const [hobbies, setHobbies] = useState<DictOption[]>([]);
  const [occupationDomains, setOccupationDomains] = useState<DictOption[]>([]);
  const [occupations, setOccupations] = useState<DictOption[]>([]);

  const [loadingDicts, setLoadingDicts] = useState<boolean>(true);
  const [loadingOccupations, setLoadingOccupations] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Синхронізація активної вкладки з URL (?mode=login / ?mode=register)
  useEffect(() => {
    if (searchParams.get('mode') === 'login' || location.pathname === '/login') {
      setMode('login');
    } else {
      setMode('register');
    }
  }, [location.pathname, searchParams]);

  // 1. Ініціалізуємо анонімну сесію, фіксуємо deviceKey пристрою та завантажуємо базові довідники
  useEffect(() => {
    let isMounted = true;

    async function initForm() {
      setLoadingDicts(true);
      try {
        const session = await ensureAnonymousSession();
        const currentDeviceKey = session.deviceId || getPersistentDeviceId();

        const [regionsRes, hobbiesRes, domainsRes] = await Promise.all([
          apiClient.get('/Dictionaries/regions'),
          apiClient.get('/Dictionaries/hobbies'),
          apiClient.get('/Dictionaries/occupation-domains'),
        ]);

        if (!isMounted) return;

        setDeviceKey(currentDeviceKey);
        setRegions(mapRegions(regionsRes.data));
        setHobbies(mapHobbies(hobbiesRes.data));
        setOccupationDomains(mapOccupationDomains(domainsRes.data));
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err.response?.data?.message || err.message;
        setError(`Не вдалося завантажити довідники: ${msg}`);
      } finally {
        if (isMounted) setLoadingDicts(false);
      }
    }

    initForm();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Каскадне завантаження професій після вибору галузі роботи
  useEffect(() => {
    setOccupationId('');
    setOccupations([]);

    if (!occupationDomainId) return;

    let isMounted = true;
    setLoadingOccupations(true);

    apiClient
      .get(`/Dictionaries/occupation-domains/${occupationDomainId}/occupations`)
      .then((res) => {
        if (isMounted) {
          setOccupations(mapOccupations(res.data));
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg = err.response?.data?.message || err.message;
          setError(`Не вдалося завантажити список професій: ${msg}`);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingOccupations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [occupationDomainId]);

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const isRegisterValid =
    deviceKey.trim().length > 0 &&
    nickname.trim().length > 0 &&
    password.length >= 4 &&
    passwordsMatch &&
    gender !== '' &&
    birthYear !== '' &&
    Number(birthYear) >= 1920 &&
    Number(birthYear) <= new Date().getFullYear() - 6 &&
    occupationDomainId !== '' &&
    occupationId !== '' &&
    regionId !== '' &&
    hobbyId !== '';

  const isLoginValid = nickname.trim().length > 0 && password.length > 0;

  const saveSessionAndRedirect = async (rawResponse: any, message: string) => {
    const jwt = rawResponse?.token || rawResponse?.accessToken || '';
    if (jwt) {
      localStorage.setItem(JWT_TOKEN_KEY, jwt);
    }

    let profileData: AuthUserResponse = rawResponse?.user ?? rawResponse;

    if (!profileData?.nickname && jwt) {
      try {
        const profileRes = await apiClient.get<AuthUserResponse>('/Users/profile');
        profileData = profileRes.data;
      } catch {
        // Профіль підвантажиться безпосередньо на сторінці /profile
      }
    }

    if (profileData?.userId) {
      localStorage.setItem(ANON_USER_ID_KEY, profileData.userId);
      localStorage.setItem(ANON_REGISTERED_KEY, 'true');
    }
    if (profileData?.regionId) {
      localStorage.setItem(USER_REGION_STORAGE, String(profileData.regionId));
    }
    if (profileData?.nickname || profileData?.userId) {
      localStorage.setItem(USER_PROFILE_STORAGE, JSON.stringify(profileData));
    }

    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('mysurvey_topic_exhausted_')) {
        sessionStorage.removeItem(key);
      }
    });

    window.dispatchEvent(new Event('auth-changed'));

    setSuccessMsg(message);
    setTimeout(() => {
      navigate('/profile', { replace: true });
    }, 600);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError('Паролі не збігаються. Перевірте правильність введення.');
      return;
    }

    if (!isRegisterValid) {
      setError('Будь ласка, заповніть усі обов’язкові поля форми.');
      return;
    }

    setSubmitting(true);

    const trimmedNickname = nickname.trim();
    const payload: RegisterRequest = {
      deviceKey: deviceKey.trim(),
      nickname: trimmedNickname,
      password,
      gender: Number(gender),
      birthYear: Number(birthYear),
      occupationId: Number(occupationId),
      regionId: Number(regionId),
      hobbyId: Number(hobbyId),
    };

    try {
      const registerRes = await apiClient.post<any>('/Users/register', payload);
      let authPayload = registerRes.data;

      if (!authPayload?.token && !authPayload?.accessToken) {
        const loginRes = await apiClient.post<any>('/Users/login', {
          nickname: trimmedNickname,
          password,
        });
        authPayload = loginRes.data;
      }

      await saveSessionAndRedirect(
        authPayload,
        `Акаунт «${trimmedNickname}» створено! Переходимо до профілю...`
      );
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : err.message);
      setError(`Помилка реєстрації (${status || 'мережа'}): ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!isLoginValid) {
      setError('Введіть нікнейм та пароль.');
      return;
    }

    setSubmitting(true);

    const trimmedNickname = nickname.trim();
    const payload: LoginRequest = {
      nickname: trimmedNickname,
      password,
    };

    try {
      const res = await apiClient.post<any>('/Users/login', payload);
      await saveSessionAndRedirect(
        res.data,
        `Вітаємо, ${res.data?.nickname || trimmedNickname}! Вхід виконано.`
      );
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : err.message);
      setError(`Помилка входу (${status || 'мережа'}): ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setSearchParams({ mode: nextMode }, { replace: true });
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5">
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Перемикач Вхід / Реєстрація */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-app border border-line">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`py-2.5 px-4 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              mode === 'login'
                ? 'bg-accent text-accent-text shadow-sm'
                : 'text-muted hover:text-main'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Вхід</span>
          </button>

          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`py-2.5 px-4 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              mode === 'register'
                ? 'bg-accent text-accent-text shadow-sm'
                : 'text-muted hover:text-main'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Реєстрація</span>
          </button>
        </div>

        {/* Заголовок */}
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-main">
            {mode === 'register' ? 'Створення профілю' : 'Вхід в акаунт'}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            {mode === 'register'
              ? 'Усі накопичені анонімні відповіді та токени питань прив’яжуться до вашого акаунта.'
              : 'Увійдіть за своїм нікнеймом та паролем.'}
          </p>
        </div>

        {/* Повідомлення про помилку / успіх */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs sm:text-sm font-medium flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'login' ? (
          /* ================= ФОРМА ВХОДУ ================= */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Нікнейм <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Введіть нікнейм"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Пароль <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введіть пароль"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isLoginValid || submitting}
              className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-text font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              <span>{submitting ? 'Виконується вхід...' : 'Увійти'}</span>
            </button>
          </form>
        ) : (
          /* ================= ФОРМА РЕЄСТРАЦІЇ ================= */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Нікнейм */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Нікнейм <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Придумайте унікальний нікнейм"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                />
              </div>
            </div>

            {/* Пароль та Повтор пароля */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Пароль <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Мінімум 4 символи"
                    className="w-full pl-10 pr-9 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Повторити пароль <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Повторіть пароль"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-app border text-main text-sm outline-none transition ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-emerald-500'
                          : 'border-rose-500'
                        : 'border-line focus:border-accent'
                    }`}
                  />
                </div>
              </div>
            </div>

            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-rose-500 font-medium">Паролі не збігаються</p>
            )}

            {/* Стать та Рік народження */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Стать <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                >
                  <option value="">Оберіть стать...</option>
                  <option value="0">Чоловіча</option>
                  <option value="1">Жіноча</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Рік народження <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    required
                    min={1920}
                    max={new Date().getFullYear() - 6}
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="Наприклад, 2004"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Галузь роботи та Професія / спеціальність */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Галузь роботи <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={occupationDomains}
                  value={occupationDomainId}
                  onChange={setOccupationDomainId}
                  disabled={loadingDicts}
                  placeholder={loadingDicts ? 'Завантаження...' : 'Почніть вводити галузь...'}
                  icon={<Briefcase className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Професія / спеціальність <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={occupations}
                  value={occupationId}
                  onChange={setOccupationId}
                  disabled={!occupationDomainId || loadingOccupations}
                  placeholder={
                    !occupationDomainId
                      ? 'Спочатку оберіть галузь'
                      : loadingOccupations
                      ? 'Завантаження...'
                      : 'Почніть вводити професію...'
                  }
                />
              </div>
            </div>

            {/* Регіон та Хобі */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Регіон <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={regions}
                  value={regionId}
                  onChange={setRegionId}
                  disabled={loadingDicts}
                  placeholder={loadingDicts ? 'Завантаження...' : 'Почніть вводити регіон...'}
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Хобі <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={hobbies}
                  value={hobbyId}
                  onChange={setHobbyId}
                  disabled={loadingDicts}
                  placeholder={loadingDicts ? 'Завантаження...' : 'Почніть вводити хобі...'}
                  icon={<Heart className="w-4 h-4" />}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isRegisterValid || submitting || loadingDicts}
              className="w-full py-3.5 px-6 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-text font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Реєстрація...' : 'Зареєструватися'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}