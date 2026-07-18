import { apiRequest, apiRequestAutenticado } from './api';
import { eliminarDispositivoPush } from './push-notifications-service';
import { type Suscripcion } from './suscripciones-service';

export type Usuario = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  googleId?: string | null;
  email: string;
  rolGlobal: 'ORGANIZADOR' | 'PARTICIPANTE';
  fotoPerfilUrl?: string | null;
  isVerified?: boolean;
  suscripcion?: Suscripcion;
};

export type AuthResponse = {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type LoginPayload = {
  identificador: string;
  contrasena: string;
};

export type GoogleLoginPayload = {
  idToken: string;
};

export type RegistroPayload = {
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  contrasena: string;
};

export type ActualizarPerfilPayload = {
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginConGoogle(payload: GoogleLoginPayload) {
  return apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function registrar(payload: RegistroPayload) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function solicitarRecuperacionContrasena(identificador: string) {
  return apiRequest<{ mensaje: string; codigoRecuperacion?: string }>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ identificador }),
  });
}

export function confirmarRecuperacionContrasena(payload: { identificador: string; codigo: string; nuevaContrasena: string }) {
  return apiRequest<{ mensaje: string }>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function obtenerPerfil(token: string) {
  return apiRequest<Usuario>('/users/me', { token });
}

export function actualizarPerfil(payload: ActualizarPerfilPayload) {
  return apiRequestAutenticado<Usuario>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function logout(token: string) {
  await eliminarDispositivoPush().catch(() => null);
  return apiRequest<{ mensaje: string }>('/auth/logout', {
    method: 'POST',
    token,
  });
}

export function eliminarCuenta(contrasena: string) {
  return apiRequestAutenticado<{ mensaje: string }>('/users/me', {
    method: 'DELETE',
    body: JSON.stringify(contrasena ? { contrasena } : {}),
    noCerrarSesionEnUnauthorized: true,
  });
}
