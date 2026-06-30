import { apiRequestAutenticado } from './api';

export type Invitacion = {
  id: string;
  estado: string;
  createdAt: string;
  sociedad: {
    id: string;
    nombre: string;
    montoCuota: number;
    moneda: 'DOP' | 'USD';
    frecuencia: string;
    estado: string;
  };
};

export function listarMisInvitaciones(token: string) {
  return apiRequestAutenticado<Invitacion[]>('/invitations/my');
}

export function aceptarInvitacion(token: string, invitacionId: string) {
  return apiRequestAutenticado<{ id: string; estadoParticipante: string }>(`/invitations/${invitacionId}/accept`, {
    method: 'POST',
  });
}

export function rechazarInvitacion(token: string, invitacionId: string) {
  return apiRequestAutenticado<{ id: string; estado: string }>(`/invitations/${invitacionId}/reject`, {
    method: 'POST',
  });
}
