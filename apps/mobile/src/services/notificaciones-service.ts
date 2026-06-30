import { apiRequestAutenticado } from './api';

export type Notificacion = {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  metadataJson: {
    sociedadId?: string;
    participanteId?: string;
    cuotaPagoId?: string;
    turnoId?: string;
    destino?: 'DETALLE_SAN' | 'PAGOS' | 'INVITACIONES' | 'CHAT_SAN';
  } | null;
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

export function marcarTodasNotificacionesLeidas(token: string) {
  return apiRequestAutenticado<{ count: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}

export function contarNotificacionesNoLeidas(token: string) {
  return apiRequestAutenticado<{ cantidad: number }>('/notifications/unread-count');
}
