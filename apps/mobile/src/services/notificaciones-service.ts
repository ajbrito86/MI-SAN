import { apiRequestAutenticado } from './api';

export type Notificacion = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  createdAt: string;
};

export function listarNotificaciones(token: string) {
  return apiRequestAutenticado<Notificacion[]>('/notifications');
}

export function marcarNotificacionLeida(token: string, notificacionId: string) {
  return apiRequestAutenticado<Notificacion>(`/notifications/${notificacionId}/read`, {
    method: 'PATCH',
  });
}
