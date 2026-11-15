import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Edit3,
  KeyRound,
  LogOut,
  MapPin,
  Briefcase,
  Heart,
  Calendar,
  CheckCircle2,
  Coins,
  ShieldCheck,
  AlertCircle,
  Save,
  X,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import {
  apiClient,
  ANON_USER_ID_KEY,
  ANON_REGISTERED_KEY,
  JWT_TOKEN_KEY,
} from '../api/apiClient';
import type {
  AuthUserResponse,
  ChangePasswordRequest,
  DictOption,
  UpdateProfileRequest,
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

function formatGender(gender?: number | string | null): string {
  const val = String(gender ?? '').trim().toLowerCase();
  if (val === '0' || val === 'male' || val === 'ч') return 'Чоловіча';
  if (val === '1' || val === 'female' || val === 'ж') return 'Жіноча';
  return 'Не вказано';
}

function normalizeGenderValue(gender?: number | string | null): string {
  const val = String(gender ?? '').trim().toLowerCase();
  if (val === '0' || val === 'male' || val === 'ч') return '0';
  if (val === '1' || val === 'female' || val === 'ж') return '1';
  return '';
}

function formatUserRole(userType?: number | string | null): string {
  const val = String(userType ?? '').trim().toLowerCase();
  if (val === '3' || val === 'admin') return 'Адміністратор';
  if (val === '2' || val === 'moderator') return 'Модератор';
  if (val === '1' || val === 'registered') return 'Зареєстрований користувач';
  if (val === '0' || val === 'anonymous') return 'Анонімний користувач';
  return 'Користувач';
}

export function ProfilePage() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState<AuthUserResponse | null>(() => {
    try {
      const raw = localStorage.getItem(USER_PROFILE_STORAGE);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string>('');
  const [bannerSuccess, setBannerSuccess] = useState<string>('');

  // Активна панель: перегляд | редагування профілю | зміна пароля
  const [activePanel, setActivePanel] = useState<'none' | 'editProfile' | 'changePassword'>('none');

  // Стан форми редагування профілю
  const [nickname, setNickname] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [occupationDomainId, setOccupationDomainId] = useState<string>('');
  const [occupationId, setOccupationId] = useState<string>('');
  const [regionId, setRegionId] = useState<string>('');
  const [hobbyId, setHobbyId] = useState<string>('');

  // Довідники для редагування
  const [regions, setRegions] = useState<DictOption[]>([]);
  const [hobbies, setHobbies] = useState<DictOption[]>([]);
  const [occupationDomains, setOccupationDomains] = useState<DictOption[]>([]);
  const [occupations, setOccupations] = useState<DictOption[]>([]);
  const [loadingDicts, setLoadingDicts] = useState<boolean>(false);
  const [loadingOccupations, setLoadingOccupations] = useState<boolean>(false);

  // Стан форми зміни пароля
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const handleLogout = () => {
    localStorage.removeItem(JWT_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_STORAGE);
    localStorage.removeItem(USER_REGION_STORAGE);
    localStorage.removeItem(ANON_USER_ID_KEY);
    localStorage.removeItem(ANON_REGISTERED_KEY);

    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('mysurvey_topic_exhausted_')) {
        sessionStorage.removeItem(key);
      }
    });

    window.dispatchEvent(new Event('auth-changed'));
    navigate('/auth?mode=login', { replace: true });
  };

  useEffect(() => {
    const jwt = localStorage.getItem(JWT_TOKEN_KEY);
    if (!jwt) {
      navigate('/auth?mode=login', { replace: true });
      return;
    }

    let isMounted = true;
    setLoading(true);
    setPageError('');

    apiClient
      .get<AuthUserResponse>('/Users/profile')
      .then((res) => {
        if (!isMounted) return;
        setProfile(res.data);
        localStorage.setItem(USER_PROFILE_STORAGE, JSON.stringify(res.data));
        if (res.data.userId) {
          localStorage.setItem(ANON_USER_ID_KEY, res.data.userId);
          localStorage.setItem(ANON_REGISTERED_KEY, 'true');
        }
        if (res.data.regionId) {
          localStorage.setItem(USER_REGION_STORAGE, String(res.data.regionId));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        if (err.response?.status === 401) {
          handleLogout();
          return;
        }
        const msg = err.response?.data?.message || err.message;
        setPageError(`Не вдалося завантажити профіль: ${msg}`);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleOpenEditProfile = async () => {
    if (!profile) return;
    setFormError('');
    setBannerSuccess('');
    setActivePanel('editProfile');

    setNickname(profile.nickname || '');
    setGender(normalizeGenderValue(profile.gender));
    setBirthYear(profile.birthYear ? String(profile.birthYear) : '');
    setRegionId(profile.regionId ? String(profile.regionId) : '');
    setHobbyId(profile.hobbyId ? String(profile.hobbyId) : '');
    setOccupationId(profile.occupationId ? String(profile.occupationId) : '');
    setOccupationDomainId('');
    setOccupations([]);

    setLoadingDicts(true);
    try {
      const [regionsRes, hobbiesRes, domainsRes] = await Promise.all([
        apiClient.get('/Dictionaries/regions'),
        apiClient.get('/Dictionaries/hobbies'),
        apiClient.get('/Dictionaries/occupation-domains'),
      ]);

      const loadedRegions = mapRegions(regionsRes.data);
      const loadedHobbies = mapHobbies(hobbiesRes.data);
      const loadedDomains = mapOccupationDomains(domainsRes.data);

      setRegions(loadedRegions);
      setHobbies(loadedHobbies);
      setOccupationDomains(loadedDomains);

      if (profile.occupationId && loadedDomains.length > 0) {
        const domainChecks = await Promise.all(
          loadedDomains.map(async (domain) => {
            try {
              const occRes = await apiClient.get(
                `/Dictionaries/occupation-domains/${domain.id}/occupations`
              );
              const list = mapOccupations(occRes.data);
              const found = list.some((o) => o.id === profile.occupationId);
              return found ? { domainId: String(domain.id), list } : null;
            } catch {
              return null;
            }
          })
        );

        const matched = domainChecks.find((item) => item !== null);
        if (matched) {
          setOccupationDomainId(matched.domainId);
          setOccupations(matched.list);
          setOccupationId(String(profile.occupationId));
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setFormError(`Не вдалося завантажити довідники: ${msg}`);
    } finally {
      setLoadingDicts(false);
    }
  };

  const handleDomainChange = async (newDomainId: string) => {
    setOccupationDomainId(newDomainId);
    setOccupationId('');
    setOccupations([]);

    if (!newDomainId) return;

    setLoadingOccupations(true);
    try {
      const res = await apiClient.get(
        `/Dictionaries/occupation-domains/${newDomainId}/occupations`
      );
      setOccupations(mapOccupations(res.data));
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      setFormError(`Не вдалося завантажити професії: ${msg}`);
    } finally {
      setLoadingOccupations(false);
    }
  };

  const handleOpenChangePassword = () => {
    setFormError('');
    setBannerSuccess('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPasswords(false);
    setActivePanel('changePassword');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setBannerSuccess('');

    if (
      !nickname.trim() ||
      gender === '' ||
      !birthYear ||
      !occupationId ||
      !regionId ||
      !hobbyId
    ) {
      setFormError('Заповніть усі обов’язкові поля профілю.');
      return;
    }

    setSaving(true);
    const payload: UpdateProfileRequest = {
      nickname: nickname.trim(),
      gender: Number(gender),
      birthYear: Number(birthYear),
      occupationId: Number(occupationId),
      regionId: Number(regionId),
      hobbyId: Number(hobbyId),
    };

    try {
      const res = await apiClient.put<AuthUserResponse>('/Users/profile', payload);
      setProfile(res.data);
      localStorage.setItem(USER_PROFILE_STORAGE, JSON.stringify(res.data));
      if (res.data.regionId) {
        localStorage.setItem(USER_REGION_STORAGE, String(res.data.regionId));
      }

      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('mysurvey_topic_exhausted_')) {
          sessionStorage.removeItem(key);
        }
      });

      window.dispatchEvent(new Event('auth-changed'));
      setActivePanel('none');
      setBannerSuccess('Дані профілю успішно оновлено.');
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : err.message);
      setFormError(`Помилка оновлення профілю (${status || 'мережа'}): ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setBannerSuccess('');

    if (newPassword.length < 4) {
      setFormError('Новий пароль має містити щонайменше 4 символи.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setFormError('Новий пароль та підтвердження не збігаються.');
      return;
    }

    setSaving(true);
    const payload: ChangePasswordRequest = {
      currentPassword,
      newPassword,
      confirmNewPassword,
    };

    try {
      await apiClient.put('/Users/password', payload);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setActivePanel('none');
      setBannerSuccess('Пароль успішно змінено.');
    } catch (err: any) {
      const status = err.response?.status;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.title ||
        (typeof err.response?.data === 'string' ? err.response.data : err.message);
      setFormError(`Помилка зміни пароля (${status || 'мережа'}): ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-5 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-app" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-app rounded-lg" />
            <div className="h-4 w-28 bg-app rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="h-24 bg-app rounded-2xl" />
          <div className="h-24 bg-app rounded-2xl" />
        </div>
        <div className="h-48 bg-app rounded-2xl" />
      </div>
    );
  }

  if (pageError && !profile?.userId) {
    return (
      <div className="w-full max-w-xl mx-auto bg-card border border-rose-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3 text-rose-500">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{pageError}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-accent-text text-sm font-semibold transition cursor-pointer"
        >
          Перейти до входу
        </button>
      </div>
    );
  }

  if (!profile) return null;

  const passwordsMatch =
    newPassword.length > 0 &&
    confirmNewPassword.length > 0 &&
    newPassword === confirmNewPassword;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {pageError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{pageError}</span>
        </div>
      )}

      {bannerSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs sm:text-sm font-medium flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{bannerSuccess}</span>
        </div>
      )}

      {/* Основна картка профілю */}
      <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* Шапка профілю + кнопка виходу */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
              <User className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-main tracking-tight">
                {profile.nickname || 'Користувач'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {formatUserRole(profile.userType)}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-500 text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Вийти з акаунта</span>
          </button>
        </div>

        {/* Статистика активності */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 sm:p-5 rounded-2xl bg-app/70 border border-line flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted">Пройдено опитувань</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-main mt-1">
                {profile.answersCount ?? 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-app/70 border border-line flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted">Токени для створення питань</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-main mt-1">
                {profile.availableQuestionTokens ?? 0}
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Coins className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Анкетні дані */}
        <div className="rounded-2xl bg-app/50 border border-line divide-y divide-line">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line">
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-card border border-line flex items-center justify-center text-muted shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs text-muted">Стать</span>
                <p className="text-sm font-semibold text-main truncate">
                  {formatGender(profile.gender)}
                </p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-card border border-line flex items-center justify-center text-muted shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs text-muted">Рік народження</span>
                <p className="text-sm font-semibold text-main truncate">
                  {profile.birthYear || 'Не вказано'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-line">
            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-card border border-line flex items-center justify-center text-muted shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs text-muted">Регіон</span>
                <p className="text-sm font-semibold text-main truncate">
                  {profile.regionName || (profile.regionId ? `#${profile.regionId}` : 'Не вказано')}
                </p>
              </div>
            </div>

            <div className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-card border border-line flex items-center justify-center text-muted shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-xs text-muted">Професія / спеціальність</span>
                <p className="text-sm font-semibold text-main truncate">
                  {profile.occupationName ||
                    (profile.occupationId ? `#${profile.occupationId}` : 'Не вказано')}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-card border border-line flex items-center justify-center text-muted shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs text-muted">Хобі</span>
              <p className="text-sm font-semibold text-main">
                {profile.hobbyName || (profile.hobbyId ? `#${profile.hobbyId}` : 'Не вказано')}
              </p>
            </div>
          </div>
        </div>

        {/* Дві кнопки дій: Редагувати профіль та Змінити пароль */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() =>
              activePanel === 'editProfile' ? setActivePanel('none') : handleOpenEditProfile()
            }
            className={`py-3 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              activePanel === 'editProfile'
                ? 'bg-accent text-accent-text ring-2 ring-accent/40'
                : 'bg-accent hover:bg-accent-hover text-accent-text shadow-sm'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Редагувати профіль</span>
          </button>

          <button
            type="button"
            onClick={() =>
              activePanel === 'changePassword'
                ? setActivePanel('none')
                : handleOpenChangePassword()
            }
            className={`py-3 px-4 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              activePanel === 'changePassword'
                ? 'bg-app border-2 border-accent text-accent'
                : 'bg-app hover:bg-card border border-line hover:border-accent/60 text-main'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Змінити пароль</span>
          </button>
        </div>
      </div>

      {/* ================= ПАНЕЛЬ 1: РЕДАГУВАННЯ ПРОФІЛЮ ================= */}
      {activePanel === 'editProfile' && (
        <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-main">Редагування профілю</h2>
            <button
              type="button"
              onClick={() => setActivePanel('none')}
              className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-app transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Нікнейм <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
              />
            </div>

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
                <input
                  type="number"
                  required
                  min={1920}
                  max={new Date().getFullYear() - 6}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Галузь роботи <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={occupationDomains}
                  value={occupationDomainId}
                  onChange={handleDomainChange}
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
                  disabled={loadingDicts || loadingOccupations || !occupationDomainId}
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

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="px-4 py-2.5 rounded-xl bg-app border border-line text-muted hover:text-main text-sm font-medium transition cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={saving || loadingDicts}
                className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-text text-sm font-semibold inline-flex items-center gap-2 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Збереження...' : 'Зберегти зміни'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= ПАНЕЛЬ 2: ЗМІНА ПАРОЛЯ ================= */}
      {activePanel === 'changePassword' && (
        <div className="bg-card border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-main">Зміна пароля</h2>
            <button
              type="button"
              onClick={() => setActivePanel('none')}
              className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-app transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs sm:text-sm font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-muted">
                Поточний пароль <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введіть поточний пароль"
                  className="w-full pl-3.5 pr-10 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main cursor-pointer"
                >
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Новий пароль <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  minLength={4}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Мінімум 4 символи"
                  className="w-full px-3.5 py-3 rounded-xl bg-app border border-line text-main text-sm focus:border-accent outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted">
                  Підтвердіть новий пароль <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Повторіть новий пароль"
                  className={`w-full px-3.5 py-3 rounded-xl bg-app border text-main text-sm outline-none transition ${
                    confirmNewPassword.length > 0
                      ? passwordsMatch
                        ? 'border-emerald-500'
                        : 'border-rose-500'
                      : 'border-line focus:border-accent'
                  }`}
                />
              </div>
            </div>

            {confirmNewPassword.length > 0 && !passwordsMatch && (
              <p className="text-xs text-rose-500 font-medium">
                Новий пароль та підтвердження не збігаються
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActivePanel('none')}
                className="px-4 py-2.5 rounded-xl bg-app border border-line text-muted hover:text-main text-sm font-medium transition cursor-pointer"
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={saving || !currentPassword || !passwordsMatch}
                className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-text text-sm font-semibold inline-flex items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed"
              >
                <KeyRound className="w-4 h-4" />
                <span>{saving ? 'Оновлення...' : 'Оновити пароль'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}