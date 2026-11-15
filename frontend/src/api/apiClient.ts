import axios from 'axios';

export const DEVICE_ID_KEY = 'mysurvey_device_id';
export const ANON_USER_ID_KEY = 'mysurvey_anon_user_id';
export const ANON_REGISTERED_KEY = 'mysurvey_anon_registered';
export const JWT_TOKEN_KEY = 'mysurvey_jwt_token';

function fnv1aHash(str: string, seed: number): string {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Генерує та зберігає постійний унікальний ключ пристрою (deviceKey), який не змінюється.
 */
export function getPersistentDeviceId(): string {
  const cached = localStorage.getItem(DEVICE_ID_KEY);
  if (cached) return cached;

  const signature = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency ?? '0',
    navigator.platform ?? '',
  ].join('|');

  const p1 = fnv1aHash(signature, 0x811c9dc5);
  const p2 = fnv1aHash(signature, 0x01000193);
  const p3 = fnv1aHash(signature, 0x1b873593);
  const p4 = fnv1aHash(signature, 0x85ebca6b);

  const deviceKey = `${p1}-${p2.slice(0, 4)}-4${p2.slice(5, 8)}-a${p3.slice(1, 4)}-${p3.slice(4, 8)}${p4}`;

  localStorage.setItem(DEVICE_ID_KEY, deviceKey);
  return deviceKey;
}

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const jwt = localStorage.getItem(JWT_TOKEN_KEY);
  const deviceKey = getPersistentDeviceId();
  const anonUserId = localStorage.getItem(ANON_USER_ID_KEY);

  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  } else {
    delete config.headers.Authorization;
  }

  config.headers['X-Device-Key'] = deviceKey;
  if (anonUserId) {
    config.headers['X-Anonymous-Token'] = anonUserId;
  }

  return config;
});

/**
 * Перевіряє в localStorage, чи вже створено анонімного користувача на пристрої.
 * Якщо ні — надсилає POST /api/Users/anonymous із { deviceKey } та зберігає отриманий userId.
 */
export async function ensureAnonymousSession(): Promise<{
  deviceId: string;
  userId: string;
  isRegistered: boolean;
  fromCache: boolean;
  error?: string;
}> {
  const deviceKey = getPersistentDeviceId();
  const hasJwt = Boolean(localStorage.getItem(JWT_TOKEN_KEY));
  const alreadyRegistered = localStorage.getItem(ANON_REGISTERED_KEY) === 'true';
  const cachedUserId = localStorage.getItem(ANON_USER_ID_KEY) || '';

  if (hasJwt || (alreadyRegistered && cachedUserId)) {
    return {
      deviceId: deviceKey,
      userId: cachedUserId,
      isRegistered: true,
      fromCache: true,
    };
  }

  try {
    const res = await apiClient.post('/Users/anonymous', {
      deviceKey,
    });

    const returnedUserId = String(res.data?.userId || '');
    if (!returnedUserId) {
      throw new Error('Сервер не повернув userId');
    }

    localStorage.setItem(ANON_USER_ID_KEY, returnedUserId);
    localStorage.setItem(ANON_REGISTERED_KEY, 'true');

    return {
      deviceId: deviceKey,
      userId: returnedUserId,
      isRegistered: true,
      fromCache: false,
    };
  } catch (err: any) {
    const status = err.response?.status;
    const msg = err.response?.data?.title || err.response?.data?.message || err.message;
    return {
      deviceId: deviceKey,
      userId: '',
      isRegistered: false,
      fromCache: false,
      error: `Помилка ${status || 'мережі'}: ${msg}`,
    };
  }
}