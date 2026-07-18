import { apiRequestAutenticado } from './api';

export type ConversacionSan = {
  id: string;
  participanteId: string;
  participante: {
    id: string;
    nombres: string;
    apellidos: string;
    email: string;
    telefono: string;
  };
  ultimoMensaje: {
    id: string;
    mensaje: string;
    createdAt: string;
    remitente: {
      id: string;
      nombres: string;
      apellidos: string;
    };
  } | null;
  updatedAt: string;
};

export type MensajeChat = {
  id: string;
  mensaje: string;
  createdAt: string;
  leido: boolean;
  remitente: {
    id: string;
    nombres: string;
    apellidos: string;
  };
};

export function listarConversacionesSan(token: string, sociedadId: string) {
  return apiRequestAutenticado<ConversacionSan[]>(`/societies/${sociedadId}/chats`);
}

export function listarMensajesSan(token: string, sociedadId: string, participanteId: string) {
  return apiRequestAutenticado<MensajeChat[]>(`/societies/${sociedadId}/chats/${participanteId}/messages`);
}

export function enviarMensajeSan(token: string, sociedadId: string, participanteId: string, mensaje: string) {
  return apiRequestAutenticado<MensajeChat>(`/societies/${sociedadId}/chats/${participanteId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ mensaje }),
  });
}

export type MotivoReporteChat =
  | 'LENGUAJE_OFENSIVO'
  | 'ACOSO_O_AMENAZA'
  | 'CONTENIDO_SEXUAL_O_INAPROPIADO'
  | 'ESTAFA_O_FRAUDE'
  | 'SPAM'
  | 'OTRO';

export function reportarChat(
  token: string,
  sociedadId: string,
  participanteId: string,
  data: { mensajeId?: string; motivo: MotivoReporteChat; descripcion?: string },
) {
  return apiRequestAutenticado<{ id: string; estado: string; mensaje: string }>(
    `/societies/${sociedadId}/chats/${participanteId}/reports`,
    { method: 'POST', body: JSON.stringify(data) },
  );
}
