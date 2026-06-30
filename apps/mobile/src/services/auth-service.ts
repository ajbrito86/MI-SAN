import { apiRequest } from './api';

export type Usuario = {
  id: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  rolGlobal: 'ORGANIZADOR' | 'PARTICIPANTE';
  fotoPerfilUrl?: string | null;
  isVerified?: boolean;
};

export type AuthResponse = {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  identificador: string;
  contrasena: string;
};

export type RegistroPayload = {
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  contrasena: string;
};

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>('/auth/login', {
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

export function obtenerPerfil(token: string) {
  return apiRequest<Usuario>('/users/me', { token });
}

export function logout(token: string) {
  return apiRequest<{ mensaje: string }>('/auth/logout', {
    method: 'POST',
    token,
  });
}
