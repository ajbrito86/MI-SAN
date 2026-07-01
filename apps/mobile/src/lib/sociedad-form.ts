import type { CrearSociedadPayload } from '@/services/sociedades-service';

export type SociedadForm = Omit<CrearSociedadPayload, 'montoCuota' | 'cantidadParticipantes' | 'fechaInicio'> & {
  montoCuota: string;
  cantidadParticipantes: string;
  fechaInicio: string;
};

type ResultadoValidacion =
  | { ok: true; payload: CrearSociedadPayload }
  | { ok: false; error: string };

export function prepararSociedadPayload(formulario: SociedadForm): ResultadoValidacion {
  const nombre = formulario.nombre.trim();
  const montoCuota = Number(formulario.montoCuota.trim().replace(',', '.'));
  const cantidadParticipantes = Number(formulario.cantidadParticipantes.trim());
  const fechaInicio = new Date(`${formulario.fechaInicio}T00:00:00`);

  if (!nombre) {
    return { ok: false, error: 'El nombre de la sociedad es obligatorio.' };
  }

  if (!Number.isFinite(montoCuota) || montoCuota <= 0) {
    return { ok: false, error: 'El monto de la cuota debe ser mayor que cero.' };
  }

  if (!Number.isInteger(cantidadParticipantes) || cantidadParticipantes < 2) {
    return { ok: false, error: 'La sociedad debe tener al menos 2 participantes.' };
  }

  if (Number.isNaN(fechaInicio.getTime())) {
    return { ok: false, error: 'Debes elegir una fecha de inicio valida.' };
  }

  return {
    ok: true,
    payload: {
      nombre,
      montoCuota,
      moneda: formulario.moneda,
      cantidadParticipantes,
      fechaInicio: fechaInicio.toISOString(),
      frecuencia: formulario.frecuencia,
      modalidadTurnos: formulario.modalidadTurnos,
      tipoPago: formulario.tipoPago,
    },
  };
}
