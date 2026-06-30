import {
  EstadoCiclo,
  EstadoPago,
  EstadoParticipante,
  EstadoSociedad,
  EstadoTurno,
  FrecuenciaSociedad,
  ModalidadTurno,
  PrismaClient,
  TipoMovimientoHistorial,
  TipoNotificacion,
  TipoPago,
  RolUsuario,
  Moneda,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD_DEMO = 'ClaveDemo123';
const SOCIEDAD_DEMO = 'San Demo Familiar';

function sumarDias(fecha: Date, dias: number) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
  const hoy = new Date();
  const inicio = sumarDias(hoy, -7);

  const ana = await prisma.usuario.upsert({
    where: { email: 'ana.prueba@misan.local' },
    update: {
      nombres: 'Ana',
      apellidos: 'Prueba',
      telefono: '8090001234',
      rolGlobal: RolUsuario.ORGANIZADOR,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
    create: {
      nombres: 'Ana',
      apellidos: 'Prueba',
      telefono: '8090001234',
      email: 'ana.prueba@misan.local',
      rolGlobal: RolUsuario.ORGANIZADOR,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  const luis = await prisma.usuario.upsert({
    where: { email: 'luis.demo@misan.local' },
    update: {
      nombres: 'Luis',
      apellidos: 'Demo',
      telefono: '8090002222',
      rolGlobal: RolUsuario.PARTICIPANTE,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
    create: {
      nombres: 'Luis',
      apellidos: 'Demo',
      telefono: '8090002222',
      email: 'luis.demo@misan.local',
      rolGlobal: RolUsuario.PARTICIPANTE,
      passwordHash,
      isActive: true,
      isVerified: true,
    },
  });

  const sociedadExistente = await prisma.sociedad.findFirst({
    where: { nombre: SOCIEDAD_DEMO, organizadorId: ana.id },
  });

  const sociedad = sociedadExistente
    ? await prisma.sociedad.update({
        where: { id: sociedadExistente.id },
        data: {
          descripcion: 'Sociedad de prueba para validar el MVP.',
          montoCuota: '1500',
          moneda: Moneda.DOP,
          frecuencia: FrecuenciaSociedad.MENSUAL,
          modalidadTurnos: ModalidadTurno.MANUAL,
          tipoPago: TipoPago.MIXTO,
          cantidadParticipantes: 2,
          fechaInicio: inicio,
          fechaFinEstimada: sumarDias(inicio, 60),
          estado: EstadoSociedad.ACTIVA,
          isActive: true,
        },
      })
    : await prisma.sociedad.create({
        data: {
          nombre: SOCIEDAD_DEMO,
          descripcion: 'Sociedad de prueba para validar el MVP.',
          organizadorId: ana.id,
          montoCuota: '1500',
          moneda: Moneda.DOP,
          frecuencia: FrecuenciaSociedad.MENSUAL,
          modalidadTurnos: ModalidadTurno.MANUAL,
          tipoPago: TipoPago.MIXTO,
          cantidadParticipantes: 2,
          fechaInicio: inicio,
          fechaFinEstimada: sumarDias(inicio, 60),
          estado: EstadoSociedad.ACTIVA,
        },
      });

  const participanteAna = await prisma.participanteSociedad.upsert({
    where: { usuarioId_sociedadId: { usuarioId: ana.id, sociedadId: sociedad.id } },
    update: { estadoParticipante: EstadoParticipante.ACTIVO, turno: 1, fechaIngreso: inicio, isActive: true },
    create: {
      usuarioId: ana.id,
      sociedadId: sociedad.id,
      estadoParticipante: EstadoParticipante.ACTIVO,
      turno: 1,
      fechaIngreso: inicio,
      isActive: true,
    },
  });

  const participanteLuis = await prisma.participanteSociedad.upsert({
    where: { usuarioId_sociedadId: { usuarioId: luis.id, sociedadId: sociedad.id } },
    update: { estadoParticipante: EstadoParticipante.ACTIVO, turno: 2, fechaIngreso: inicio, isActive: true },
    create: {
      usuarioId: luis.id,
      sociedadId: sociedad.id,
      estadoParticipante: EstadoParticipante.ACTIVO,
      turno: 2,
      fechaIngreso: inicio,
      isActive: true,
    },
  });

  const ciclo = await prisma.cicloSociedad.upsert({
    where: { sociedadId_numeroCiclo: { sociedadId: sociedad.id, numeroCiclo: 1 } },
    update: { fechaInicio: inicio, fechaFin: sumarDias(inicio, 60), estado: EstadoCiclo.ACTIVO },
    create: {
      sociedadId: sociedad.id,
      numeroCiclo: 1,
      fechaInicio: inicio,
      fechaFin: sumarDias(inicio, 60),
      estado: EstadoCiclo.ACTIVO,
    },
  });

  await prisma.turnoCobro.upsert({
    where: { cicloId_participanteId: { cicloId: ciclo.id, participanteId: participanteAna.id } },
    update: {
      numeroTurno: 1,
      fechaProgramada: sumarDias(inicio, 30),
      montoCobro: '3000',
      estado: EstadoTurno.PENDIENTE,
      fechaEntrega: null,
      entregadoPor: null,
    },
    create: {
      cicloId: ciclo.id,
      participanteId: participanteAna.id,
      numeroTurno: 1,
      fechaProgramada: sumarDias(inicio, 30),
      montoCobro: '3000',
      estado: EstadoTurno.PENDIENTE,
    },
  });

  await prisma.turnoCobro.upsert({
    where: { cicloId_participanteId: { cicloId: ciclo.id, participanteId: participanteLuis.id } },
    update: {
      numeroTurno: 2,
      fechaProgramada: sumarDias(inicio, 60),
      montoCobro: '3000',
      estado: EstadoTurno.PENDIENTE,
      fechaEntrega: null,
      entregadoPor: null,
    },
    create: {
      cicloId: ciclo.id,
      participanteId: participanteLuis.id,
      numeroTurno: 2,
      fechaProgramada: sumarDias(inicio, 60),
      montoCobro: '3000',
      estado: EstadoTurno.PENDIENTE,
    },
  });

  const cuotaAna = await prisma.cuotaPago.upsert({
    where: { cicloId_participanteId_numeroCuota: { cicloId: ciclo.id, participanteId: participanteAna.id, numeroCuota: 1 } },
    update: {
      monto: '1500',
      fechaVencimiento: sumarDias(hoy, 3),
      estado: EstadoPago.PENDIENTE,
      metodoPagoReportado: null,
      observacion: 'Cuota demo lista para reportar pago.',
    },
    create: {
      cicloId: ciclo.id,
      participanteId: participanteAna.id,
      numeroCuota: 1,
      monto: '1500',
      fechaVencimiento: sumarDias(hoy, 3),
      estado: EstadoPago.PENDIENTE,
      metodoPagoReportado: null,
      observacion: 'Cuota demo lista para reportar pago.',
    },
  });

  const cuotaLuis = await prisma.cuotaPago.upsert({
    where: { cicloId_participanteId_numeroCuota: { cicloId: ciclo.id, participanteId: participanteLuis.id, numeroCuota: 1 } },
    update: {
      monto: '1500',
      fechaVencimiento: sumarDias(hoy, -2),
      fechaPago: hoy,
      estado: EstadoPago.REPORTADO,
      metodoPagoReportado: TipoPago.DEPOSITO_BANCARIO,
      observacion: 'Pago demo reportado por Luis.',
    },
    create: {
      cicloId: ciclo.id,
      participanteId: participanteLuis.id,
      numeroCuota: 1,
      monto: '1500',
      fechaVencimiento: sumarDias(hoy, -2),
      fechaPago: hoy,
      estado: EstadoPago.REPORTADO,
      metodoPagoReportado: TipoPago.DEPOSITO_BANCARIO,
      observacion: 'Pago demo reportado por Luis.',
    },
  });

  await prisma.evidenciaPago.deleteMany({
    where: {
      cuotaPagoId: { in: [cuotaAna.id, cuotaLuis.id] },
    },
  });

  const notificacionDemo = await prisma.notificacion.findFirst({
    where: {
      usuarioId: ana.id,
      titulo: 'Pago pendiente de revision',
      mensaje: 'Luis Demo reporto una cuota en San Demo Familiar.',
      tipo: TipoNotificacion.RECORDATORIO_PAGO,
    },
  });

  if (!notificacionDemo) {
    await prisma.notificacion.create({
      data: {
        usuarioId: ana.id,
        titulo: 'Pago pendiente de revision',
        mensaje: 'Luis Demo reporto una cuota en San Demo Familiar.',
        tipo: TipoNotificacion.RECORDATORIO_PAGO,
      },
    });
  }

  const historialDemo = await prisma.historialMovimiento.findFirst({
    where: {
      sociedadId: sociedad.id,
      accion: TipoMovimientoHistorial.SOCIEDAD_CREADA,
      descripcion: 'Datos demo sincronizados.',
    },
  });

  if (!historialDemo) {
    await prisma.historialMovimiento.create({
      data: {
        sociedadId: sociedad.id,
        usuarioId: ana.id,
        realizadoPor: ana.id,
        accion: TipoMovimientoHistorial.SOCIEDAD_CREADA,
        descripcion: 'Datos demo sincronizados.',
        metadataJson: { seed: true },
      },
    });
  }

  console.log('Demo listo:');
  console.log(`- ${ana.email} / ${PASSWORD_DEMO}`);
  console.log(`- ${luis.email} / ${PASSWORD_DEMO}`);
  console.log(`- Sociedad: ${sociedad.nombre}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
