import { Platform } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

const API_LOCAL_URL = Platform.select({
  android: 'http://10.0.2.2:3000/api',
  default: 'http://localhost:3000/api',
});

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || API_LOCAL_URL;

export const API_PUBLIC_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export function getPublicFileUrl(urlArchivo: string) {
  if (urlArchivo.startsWith('http://') || urlArchivo.startsWith('https://')) {
    return urlArchivo;
  }

  return `${API_PUBLIC_BASE_URL}${urlArchivo}`;
}

type ApiOptions = RequestInit & {
  token?: string;
};

type ApiAutenticadoOptions = Omit<ApiOptions, 'token'> & {
  noCerrarSesionEnUnauthorized?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(data?.message ?? 'No pudimos completar la accion. Intentalo nuevamente.', response.status);
  }

  return data as T;
}

export async function apiRequestAutenticado<T>(path: string, options: ApiAutenticadoOptions = {}): Promise<T> {
  const { accessToken, refreshToken, actualizarTokens, cerrarSesion } = useAuthStore.getState();
  const { noCerrarSesionEnUnauthorized, ...requestOptions } = options;

  try {
    return await apiRequest<T>(path, { ...requestOptions, token: accessToken ?? undefined });
  } catch (error) {
    if (noCerrarSesionEnUnauthorized && error instanceof ApiError && error.status === 401) {
      throw error;
    }

    const debeRefrescar =
      error instanceof ApiError
        ? error.status === 401 || error.message.toLowerCase().includes('sesion')
        : error instanceof Error && error.message.toLowerCase().includes('sesion');

    if (!debeRefrescar || !refreshToken) {
      throw error;
    }

    try {
      const tokens = await apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      actualizarTokens(tokens);
      return await apiRequest<T>(path, { ...requestOptions, token: tokens.accessToken });
    } catch (refreshError) {
      cerrarSesion();
      throw refreshError;
    }
  }
}
