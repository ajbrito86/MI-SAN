import { apiRequestAutenticado } from './api';

export type DashboardResumen = {
  sociedadesActivas: number;
  pagosPendientes: number;
  totalPendiente: number;
  pagosReportadosPendientes: number;
  proximoPago: {
    id: string;
    sociedadId: string;
    sociedad: string;
    moneda: 'DOP' | 'USD';
    monto: number;
    estado: string;
    numeroCuota: number;
    fechaVencimiento: string;
  } | null;
  proximoCobro: {
    id: string;
    sociedadId: string;
    sociedad: string;
    moneda: 'DOP' | 'USD';
    montoPlanificado: number;
    numeroTurno: number;
    fechaProgramada: string;
  } | null;
  alertas: {
    id: string;
    titulo: string;
    mensaje: string;
    tipo: string;
    createdAt: string;
  }[];
};

export function obtenerResumenDashboard(token: string) {
  return apiRequestAutenticado<DashboardResumen>('/dashboard/summary');
}
