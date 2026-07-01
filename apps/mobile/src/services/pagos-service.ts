import { apiRequestAutenticado } from './api';

export type Pago = {
  id: string;
  sociedad: {
    id: string;
    nombre: string;
    frecuencia: string;
    tipoPago: string;
    moneda: 'DOP' | 'USD';
  };
  ciclo: {
    id: string;
    numeroCiclo: number;
    estado: string;
  };
  numeroCuota: number;
  monto: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  estado: string;
  observacion: string | null;
  metodoPagoReportado: MetodoPago | null;
  evidencias: EvidenciaPago[];
};

export type MetodoPago = 'EFECTIVO' | 'DEPOSITO_BANCARIO' | 'TRANSFERENCIA';

export type PagoSociedad = Pago & {
  participante: {
    id: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
  };
};

export type EvidenciaPago = {
  id: string;
  urlArchivo: string;
  nombreArchivo: string;
  mimeType: string;
  createdAt: string;
  cargadoPor?: {
    id: string;
    nombres: string;
    apellidos: string;
  };
};

export function listarMisPagos(token: string) {
  return apiRequestAutenticado<Pago[]>('/payments/my');
}

export function listarPagosSociedad(token: string, sociedadId: string) {
  return apiRequestAutenticado<PagoSociedad[]>(`/payments/society/${sociedadId}`);
}

export function reportarPago(token: string, cuotaPagoId: string, metodoPago: MetodoPago) {
  return apiRequestAutenticado<Pago>('/payments/report', {
    method: 'POST',
    body: JSON.stringify({ cuotaPagoId, metodoPago, observacion: 'Reportado desde la app movil.' }),
  });
}

export function confirmarPago(token: string, cuotaPagoId: string) {
  return apiRequestAutenticado<PagoSociedad>(`/payments/${cuotaPagoId}/confirm`, {
    method: 'POST',
  });
}

export function rechazarPago(token: string, cuotaPagoId: string, observacion: string) {
  return apiRequestAutenticado<PagoSociedad>(`/payments/${cuotaPagoId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ observacion }),
  });
}
