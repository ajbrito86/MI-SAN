import { apiRequest, apiRequestAutenticado } from './api';

export type Sociedad = {
  id: string;
  nombre: string;
  descripcion: string | null;
  rol: 'ORGANIZADOR' | 'PARTICIPANTE';
  montoCuota: number;
  moneda: 'DOP' | 'USD';
  frecuencia: string;
  modalidadTurnos: 'MANUAL' | 'ALEATORIA';
  tipoPago: 'EFECTIVO' | 'DEPOSITO_BANCARIO' | 'TRANSFERENCIA' | 'MIXTO';
  estado: string;
  cantidadParticipantes: number;
  participantesRegistrados?: number;
  ciclosRegistrados?: number;
  fechaInicio: string;
  fechaFinEstimada: string | null;
};

export type ParticipanteSociedad = {
  id: string;
  turno: number | null;
  estadoParticipante: string;
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
  };
};

export type CicloSociedad = {
  id: string;
  numeroCiclo: number;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
};

export type DetalleSociedad = Sociedad & {
  participantes: ParticipanteSociedad[];
  cicloActual: CicloSociedad | null;
  ciclos: CicloSociedad[];
};

export type MovimientoHistorial = {
  id: string;
  accion: string;
  descripcion: string;
  createdAt: string;
  realizador: {
    id: string;
    nombres: string;
    apellidos: string;
  };
  usuario: {
    id: string;
    nombres: string;
    apellidos: string;
  } | null;
};

export type TurnoCobro = {
  id: string;
  numeroTurno: number;
  fechaProgramada: string;
  montoCobro: number;
  montoEntregado: number | null;
  entregaIncompleta: boolean;
  estado: string;
  fechaEntrega: string | null;
  entregadoPor: string | null;
  participante: {
    id: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
  };
};

export type ResumenSociedad = {
  sociedadId: string;
  nombre: string;
  moneda: 'DOP' | 'USD';
  estado: string;
  participantesActivos: number;
  cicloActual: {
    id: string;
    numeroCiclo: number;
    estado: string;
  } | null;
  cuotasPorEstado: Record<string, { cantidad: number; monto: number }>;
  totalConfirmado: number;
  pagosConfirmados: number;
  participantesResumen: {
    participanteId: string;
    usuario: {
      id: string;
      nombres: string;
      apellidos: string;
      email: string;
      telefono: string;
    };
    totalConfirmado: number;
    totalPendiente: number;
    totalAtrasado: number;
    cuotasConfirmadas: number;
    cuotasPendientes: number;
    cuotasAtrasadas: number;
  }[];
};

export type CrearSociedadPayload = {
  nombre: string;
  descripcion?: string;
  montoCuota: number;
  moneda: 'DOP' | 'USD';
  frecuencia: 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
  modalidadTurnos: 'MANUAL' | 'ALEATORIA';
  tipoPago: 'EFECTIVO' | 'DEPOSITO_BANCARIO' | 'TRANSFERENCIA' | 'MIXTO';
  cantidadParticipantes: number;
  fechaInicio: string;
};

export type CrearInvitacionPayload = {
  telefonoInvitado?: string;
  emailInvitado?: string;
};

export function listarSociedades(token: string) {
  return apiRequestAutenticado<Sociedad[]>('/societies');
}

export function obtenerSociedad(token: string, sociedadId: string) {
  return apiRequestAutenticado<DetalleSociedad>(`/societies/${sociedadId}`);
}

export function listarParticipantes(token: string, sociedadId: string) {
  return apiRequestAutenticado<ParticipanteSociedad[]>(`/societies/${sociedadId}/participants`);
}

export function listarHistorial(token: string, sociedadId: string) {
  return apiRequestAutenticado<MovimientoHistorial[]>(`/societies/${sociedadId}/history`);
}

export function listarTurnos(token: string, cicloId: string) {
  return apiRequestAutenticado<TurnoCobro[]>(`/cycles/${cicloId}/turns`);
}

export function obtenerResumenSociedad(token: string, sociedadId: string, cicloId?: string) {
  const query = cicloId ? `?cicloId=${encodeURIComponent(cicloId)}` : '';
  return apiRequestAutenticado<ResumenSociedad>(`/reports/societies/${sociedadId}/summary${query}`);
}

export function crearSociedad(token: string, payload: CrearSociedadPayload) {
  return apiRequest<Sociedad>('/societies', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });
}

export function actualizarSociedad(token: string, sociedadId: string, payload: Partial<CrearSociedadPayload>) {
  return apiRequestAutenticado<Sociedad>(`/societies/${sociedadId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function crearInvitacion(token: string, sociedadId: string, payload: CrearInvitacionPayload) {
  return apiRequestAutenticado<{ id: string; estado: string }>(`/societies/${sociedadId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function crearCiclo(token: string, sociedadId: string) {
  return apiRequestAutenticado<{ id: string; numeroCiclo: number; estado: string }>(`/societies/${sociedadId}/cycles`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function generarTurnosAleatorios(token: string, cicloId: string) {
  return apiRequestAutenticado<TurnoCobro[]>(`/cycles/${cicloId}/turns/random`, {
    method: 'POST',
  });
}

export function generarTurnosManuales(token: string, cicloId: string, turnos: { participanteId: string; numeroTurno: number }[]) {
  return apiRequestAutenticado<TurnoCobro[]>(`/cycles/${cicloId}/turns/manual`, {
    method: 'POST',
    body: JSON.stringify({ turnos }),
  });
}

export function iniciarCiclo(token: string, cicloId: string) {
  return apiRequestAutenticado<{ id: string; estado: string; numeroCiclo: number }>(`/cycles/${cicloId}/start`, {
    method: 'POST',
  });
}

export function finalizarCiclo(token: string, cicloId: string) {
  return apiRequestAutenticado<{ id: string; estado: string; numeroCiclo: number }>(`/cycles/${cicloId}/finish`, {
    method: 'POST',
  });
}

export function cerrarSociedad(token: string, sociedadId: string) {
  return apiRequestAutenticado<Sociedad>(`/societies/${sociedadId}/close`, {
    method: 'POST',
  });
}

export function expulsarParticipante(token: string, participanteId: string, motivo: string) {
  return apiRequestAutenticado<ParticipanteSociedad>(`/participants/${participanteId}`, {
    method: 'DELETE',
    body: JSON.stringify({ motivo }),
  });
}

export function entregarTurno(token: string, cicloId: string, turnoId: string, permitirEntregaIncompleta = false) {
  return apiRequestAutenticado<TurnoCobro>(`/cycles/${cicloId}/turns/${turnoId}/deliver`, {
    method: 'POST',
    body: JSON.stringify({ permitirEntregaIncompleta }),
  });
}
