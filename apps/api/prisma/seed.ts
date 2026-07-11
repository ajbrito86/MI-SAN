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
  EstadoUsuarioPlan,
  PlataformaCompra,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD_DEMO = 'ClaveDemo123';
const PASSWORD_REVISION = 'Demo123*';
const SOCIEDAD_DEMO = 'San Demo Familiar';

function sumarDias(fecha: Date, dias: number) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
  const passwordRevisionHash = await bcrypt.hash(PASSWORD_REVISION, 10);
  const hoy = new Date();
  const inicio = sumarDias(hoy, -7);

  await prisma.configuracionGlobal.upsert({
    where: { clave: 'mobile_config' },
    update: {
      valorJson: {
        mantenimiento: {
          activo: false,
          mensaje: 'MI-SAN esta en mantenimiento temporal. Intenta nuevamente en unos minutos.',
        },
        version: {
          versionMinima: '1.0.0',
          forzarActualizacion: false,
          mensajeActualizacion: 'Hay una nueva version de MI-SAN disponible.',
        },
        featureFlags: {
          anunciosActivos: true,
          premiumActivo: true,
          trialActivo: true,
          comprasActivas: true,
        },
        monetizacion: {
          duracionTrialDias: 45,
          precioPremiumUsd: 4.99,
          frecuenciaInterstitialMinutos: 10,
        },
        mensajes: {
          global: null,
        },
      },
      descripcion: 'Configuracion publica consumida por la app movil.',
      isPublic: true,
      isActive: true,
    },
    create: {
      clave: 'mobile_config',
      valorJson: {
        mantenimiento: {
          activo: false,
          mensaje: 'MI-SAN esta en mantenimiento temporal. Intenta nuevamente en unos minutos.',
        },
        version: {
          versionMinima: '1.0.0',
          forzarActualizacion: false,
          mensajeActualizacion: 'Hay una nueva version de MI-SAN disponible.',
        },
        featureFlags: {
          anunciosActivos: true,
          premiumActivo: true,
          trialActivo: true,
          comprasActivas: true,
        },
        monetizacion: {
          duracionTrialDias: 45,
          precioPremiumUsd: 4.99,
          frecuenciaInterstitialMinutos: 10,
        },
        mensajes: {
          global: null,
        },
      },
      descripcion: 'Configuracion publica consumida por la app movil.',
      isPublic: true,
      isActive: true,
    },
  });

  const planTrial = await prisma.plan.upsert({
    where: { codigo: 'GRATIS_TRIAL' },
    update: {
      nombre: 'Gratis Trial',
      descripcion: 'Prueba Premium inicial de 45 dias sin anuncios.',
      precio: '0',
      duracionDias: 45,
      permiteAds: false,
      isPagoUnico: false,
      isActive: true,
    },
    create: {
      codigo: 'GRATIS_TRIAL',
      nombre: 'Gratis Trial',
      descripcion: 'Prueba Premium inicial de 45 dias sin anuncios.',
      precio: '0',
      duracionDias: 45,
      permiteAds: false,
      isPagoUnico: false,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { codigo: 'GRATIS_ADS' },
    update: {
      nombre: 'Gratis con anuncios',
      descripcion: 'Acceso gratuito con anuncios discretos.',
      precio: '0',
      duracionDias: null,
      permiteAds: true,
      isPagoUnico: false,
      isActive: true,
    },
    create: {
      codigo: 'GRATIS_ADS',
      nombre: 'Gratis con anuncios',
      descripcion: 'Acceso gratuito con anuncios discretos.',
      precio: '0',
      duracionDias: null,
      permiteAds: true,
      isPagoUnico: false,
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { codigo: 'PREMIUM_SIN_ADS' },
    update: {
      nombre: 'Premium sin anuncios',
      descripcion: 'Pago unico para eliminar anuncios.',
      precio: '4.99',
      duracionDias: null,
      permiteAds: false,
      isPagoUnico: true,
      isActive: true,
    },
    create: {
      codigo: 'PREMIUM_SIN_ADS',
      nombre: 'Premium sin anuncios',
      descripcion: 'Pago unico para eliminar anuncios.',
      precio: '4.99',
      duracionDias: null,
      permiteAds: false,
      isPagoUnico: true,
      isActive: true,
    },
  });

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

  const usuarioRevision = await prisma.usuario.upsert({
    where: { email: 'usuario_demo@mi-san.kingdom-devs.net' },
    update: {
      nombres: 'Usuario',
      apellidos: 'Demo',
      telefono: '8090009999',
      rolGlobal: RolUsuario.ORGANIZADOR,
      passwordHash: passwordRevisionHash,
      isActive: true,
      isVerified: true,
    },
    create: {
      nombres: 'Usuario',
      apellidos: 'Demo',
      telefono: '8090009999',
      email: 'usuario_demo@mi-san.kingdom-devs.net',
      rolGlobal: RolUsuario.ORGANIZADOR,
      passwordHash: passwordRevisionHash,
      isActive: true,
      isVerified: true,
    },
  });

  for (const usuario of [ana, luis, usuarioRevision]) {
    const planActivo = await prisma.usuarioPlan.findFirst({
      where: { usuarioId: usuario.id, estado: EstadoUsuarioPlan.ACTIVO, isActive: true },
    });

    if (!planActivo) {
      await prisma.usuarioPlan.create({
        data: {
          usuarioId: usuario.id,
          planId: planTrial.id,
          fechaInicio: hoy,
          fechaFin: sumarDias(hoy, 45),
          estado: EstadoUsuarioPlan.ACTIVO,
          plataformaCompra: PlataformaCompra.MANUAL,
          esTrial: true,
          isActive: true,
        },
      });
    }
  }

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
  console.log(`- ${usuarioRevision.email} / ${PASSWORD_REVISION}`);
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
