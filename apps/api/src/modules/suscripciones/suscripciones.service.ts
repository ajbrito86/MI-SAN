import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoUsuarioPlan, PlataformaCompra, Prisma, RolUsuario, TipoAuditoriaMonetizacion } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { ComprarPremiumDto } from './dto/comprar-premium.dto';

const CODIGO_TRIAL = 'GRATIS_TRIAL';
const CODIGO_GRATIS_ADS = 'GRATIS_ADS';
const CODIGO_PREMIUM = 'PREMIUM_SIN_ADS';
const PLANES_BASE = {
  [CODIGO_TRIAL]: {
    nombre: 'Gratis Trial',
    descripcion: 'Prueba Premium inicial de 45 dias sin anuncios.',
    precio: '0',
    duracionDias: 45,
    permiteAds: false,
    isPagoUnico: false,
  },
  [CODIGO_GRATIS_ADS]: {
    nombre: 'Gratis con anuncios',
    descripcion: 'Acceso gratuito con anuncios discretos.',
    precio: '0',
    duracionDias: null,
    permiteAds: true,
    isPagoUnico: false,
  },
  [CODIGO_PREMIUM]: {
    nombre: 'Premium sin anuncios',
    descripcion: 'Pago unico para eliminar anuncios.',
    precio: '0.99',
    duracionDias: null,
    permiteAds: false,
    isPagoUnico: true,
  },
} as const;

@Injectable()
export class SuscripcionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracionService: ConfiguracionService,
  ) {}

  async asignarTrialInicial(usuarioId: string) {
    const existente = await this.prisma.usuarioPlan.findFirst({
      where: { usuarioId, estado: EstadoUsuarioPlan.ACTIVO, isActive: true },
      include: { plan: true },
    });

    if (existente) {
      return this.mapearSuscripcion(existente);
    }

    const plan = await this.buscarPlanActivo(CODIGO_TRIAL);
    const configuracion = await this.configuracionService.obtenerConfiguracionMobile();
    const fechaInicio = new Date();
    const fechaFin = this.sumarDias(fechaInicio, configuracion.monetizacion.duracionTrialDias);

    const suscripcion = await this.prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: usuarioId },
        data: { rolGlobal: RolUsuario.ORGANIZADOR },
      });

      return tx.usuarioPlan.create({
        data: {
          usuarioId,
          planId: plan.id,
          fechaInicio,
          fechaFin,
          estado: EstadoUsuarioPlan.ACTIVO,
          plataformaCompra: PlataformaCompra.MANUAL,
          esTrial: true,
          isActive: true,
        },
        include: { plan: true },
      });
    });

    await this.registrarEvento(usuarioId, 'trial_iniciado', { plan: CODIGO_TRIAL });
    await this.registrarAuditoria({
      usuarioId,
      tipo: TipoAuditoriaMonetizacion.TRIAL_INICIADO,
      planNuevo: CODIGO_TRIAL,
      metadataJson: { duracionTrialDias: configuracion.monetizacion.duracionTrialDias },
    });

    return this.mapearSuscripcion(suscripcion);
  }

  async obtenerActual(usuarioId: string) {
    const suscripcion = await this.prisma.usuarioPlan.findFirst({
      where: { usuarioId, estado: EstadoUsuarioPlan.ACTIVO, isActive: true },
      include: { plan: true },
      orderBy: { fechaInicio: 'desc' },
    });

    if (!suscripcion) {
      return this.asignarTrialInicial(usuarioId);
    }

    if (this.trialExpirado(suscripcion)) {
      return this.expirarTrialUsuario(usuarioId, suscripcion.id);
    }

    await this.sincronizarRolPorPlan(usuarioId, suscripcion.plan.codigo);

    return this.mapearSuscripcion(suscripcion);
  }

  async listarHistorial(usuarioId: string) {
    const historial = await this.prisma.usuarioPlan.findMany({
      where: { usuarioId },
      include: { plan: true },
      orderBy: { fechaInicio: 'desc' },
    });

    return historial.map((suscripcion) => this.mapearSuscripcion(suscripcion));
  }

  async comprarPremium(usuarioId: string, dto: ComprarPremiumDto = {}) {
    return this.activarPremium(usuarioId, dto, 'premium_comprado');
  }

  async restaurarCompra(usuarioId: string, dto: ComprarPremiumDto = {}) {
    return this.activarPremium(usuarioId, dto, 'premium_restaurado');
  }

  private async activarPremium(usuarioId: string, dto: ComprarPremiumDto, evento: string) {
    const plan = await this.buscarPlanActivo(CODIGO_PREMIUM);
    const fechaInicio = new Date();

    const suscripcion = await this.prisma.$transaction(async (tx) => {
      await tx.usuarioPlan.updateMany({
        where: { usuarioId, estado: EstadoUsuarioPlan.ACTIVO, isActive: true },
        data: { estado: EstadoUsuarioPlan.CANCELADO, isActive: false },
      });

      await tx.usuario.update({
        where: { id: usuarioId },
        data: { rolGlobal: RolUsuario.ORGANIZADOR },
      });

      return tx.usuarioPlan.create({
        data: {
          usuarioId,
          planId: plan.id,
          fechaInicio,
          fechaFin: null,
          estado: EstadoUsuarioPlan.ACTIVO,
          plataformaCompra: dto.plataformaCompra ?? PlataformaCompra.MANUAL,
          transaccionExternaId: dto.transaccionExternaId,
          esTrial: false,
          isActive: true,
        },
        include: { plan: true },
      });
    });

    await this.registrarEvento(usuarioId, evento, {
      plan: CODIGO_PREMIUM,
      plataformaCompra: dto.plataformaCompra ?? PlataformaCompra.MANUAL,
    });
    await this.registrarAuditoria({
      usuarioId,
      tipo: evento === 'premium_restaurado' ? TipoAuditoriaMonetizacion.PREMIUM_RESTAURADO : TipoAuditoriaMonetizacion.PREMIUM_COMPRADO,
      planNuevo: CODIGO_PREMIUM,
      plataforma: dto.plataformaCompra ?? PlataformaCompra.MANUAL,
      transaccionExternaId: dto.transaccionExternaId,
    });

    return this.mapearSuscripcion(suscripcion);
  }

  async expirarTrials() {
    const ahora = new Date();
    const planGratisAds = await this.buscarPlanActivo(CODIGO_GRATIS_ADS);
    const trialsVencidos = await this.prisma.usuarioPlan.findMany({
      where: {
        estado: EstadoUsuarioPlan.ACTIVO,
        isActive: true,
        esTrial: true,
        fechaFin: { lte: ahora },
        plan: { codigo: CODIGO_TRIAL },
      },
      select: { id: true, usuarioId: true },
    });

    for (const trial of trialsVencidos) {
      await this.prisma.$transaction(async (tx) => {
        await tx.usuarioPlan.update({
          where: { id: trial.id },
          data: { estado: EstadoUsuarioPlan.EXPIRADO, isActive: false },
        });

        await tx.usuarioPlan.create({
          data: {
            usuarioId: trial.usuarioId,
            planId: planGratisAds.id,
            fechaInicio: ahora,
            fechaFin: null,
            estado: EstadoUsuarioPlan.ACTIVO,
            plataformaCompra: PlataformaCompra.MANUAL,
            esTrial: false,
            isActive: true,
          },
        });

        await tx.usuario.update({
          where: { id: trial.usuarioId },
          data: { rolGlobal: RolUsuario.PARTICIPANTE },
        });

        await tx.eventoAnalitica.create({
          data: {
            usuarioId: trial.usuarioId,
            nombre: 'trial_expirado',
            tipo: 'NEGOCIO',
            metadataJson: { planAnterior: CODIGO_TRIAL, planNuevo: CODIGO_GRATIS_ADS },
          },
        });

        await tx.auditoriaMonetizacion.create({
          data: {
            usuarioId: trial.usuarioId,
            tipo: TipoAuditoriaMonetizacion.TRIAL_EXPIRADO,
            planAnterior: CODIGO_TRIAL,
            planNuevo: CODIGO_GRATIS_ADS,
          },
        });
      });
    }

    return { trialsExpirados: trialsVencidos.length };
  }

  private async expirarTrialUsuario(usuarioId: string, usuarioPlanId: string) {
    const ahora = new Date();
    const planGratisAds = await this.buscarPlanActivo(CODIGO_GRATIS_ADS);

    const suscripcion = await this.prisma.$transaction(async (tx) => {
      await tx.usuarioPlan.update({
        where: { id: usuarioPlanId },
        data: { estado: EstadoUsuarioPlan.EXPIRADO, isActive: false },
      });

      await tx.usuario.update({
        where: { id: usuarioId },
        data: { rolGlobal: RolUsuario.PARTICIPANTE },
      });

      await tx.eventoAnalitica.create({
        data: {
          usuarioId,
          nombre: 'trial_expirado',
          tipo: 'NEGOCIO',
          metadataJson: { planAnterior: CODIGO_TRIAL, planNuevo: CODIGO_GRATIS_ADS },
        },
      });

      await tx.auditoriaMonetizacion.create({
        data: {
          usuarioId,
          tipo: TipoAuditoriaMonetizacion.TRIAL_EXPIRADO,
          planAnterior: CODIGO_TRIAL,
          planNuevo: CODIGO_GRATIS_ADS,
        },
      });

      return tx.usuarioPlan.create({
        data: {
          usuarioId,
          planId: planGratisAds.id,
          fechaInicio: ahora,
          fechaFin: null,
          estado: EstadoUsuarioPlan.ACTIVO,
          plataformaCompra: PlataformaCompra.MANUAL,
          esTrial: false,
          isActive: true,
        },
        include: { plan: true },
      });
    });

    return this.mapearSuscripcion(suscripcion);
  }

  private async sincronizarRolPorPlan(usuarioId: string, codigoPlan: string) {
    const rolGlobal = codigoPlan === CODIGO_GRATIS_ADS ? RolUsuario.PARTICIPANTE : RolUsuario.ORGANIZADOR;

    await this.prisma.usuario
      .update({
        where: { id: usuarioId },
        data: { rolGlobal },
      })
      .catch(() => null);
  }

  private trialExpirado(suscripcion: { esTrial: boolean; fechaFin: Date | null; plan: { codigo: string } }) {
    return suscripcion.esTrial && suscripcion.plan.codigo === CODIGO_TRIAL && Boolean(suscripcion.fechaFin && suscripcion.fechaFin <= new Date());
  }

  private async buscarPlanActivo(codigo: string) {
    const definicion = PLANES_BASE[codigo as keyof typeof PLANES_BASE];

    if (definicion) {
      return this.prisma.plan.upsert({
        where: { codigo },
        update: { ...definicion, isActive: true },
        create: { codigo, ...definicion, isActive: true },
      });
    }

    const plan = await this.prisma.plan.findFirst({
      where: { codigo, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException(`No existe un plan activo con codigo ${codigo}.`);
    }

    return plan;
  }

  private mapearSuscripcion(suscripcion: {
    id: string;
    fechaInicio: Date;
    fechaFin: Date | null;
    estado: EstadoUsuarioPlan;
    plataformaCompra: PlataformaCompra;
    transaccionExternaId: string | null;
    esTrial: boolean;
    plan: {
      codigo: string;
      nombre: string;
      precio: unknown;
      permiteAds: boolean;
      isPagoUnico: boolean;
    };
  }) {
    const diasRestantes = suscripcion.fechaFin ? Math.max(0, this.diferenciaDias(new Date(), suscripcion.fechaFin)) : null;
    const mostrarAds = suscripcion.plan.permiteAds;

    return {
      id: suscripcion.id,
      plan: suscripcion.plan.codigo,
      nombrePlan: suscripcion.plan.nombre,
      premium: !mostrarAds,
      mostrarAds,
      diasRestantes,
      fechaInicio: suscripcion.fechaInicio,
      fechaFin: suscripcion.fechaFin,
      estado: suscripcion.estado,
      plataformaCompra: suscripcion.plataformaCompra,
      transaccionExternaId: suscripcion.transaccionExternaId,
      esTrial: suscripcion.esTrial,
      precio: Number(suscripcion.plan.precio),
      pagoUnico: suscripcion.plan.isPagoUnico,
    };
  }

  private sumarDias(fecha: Date, dias: number) {
    const copia = new Date(fecha);
    copia.setDate(copia.getDate() + dias);
    return copia;
  }

  private diferenciaDias(desde: Date, hasta: Date) {
    const milisegundosPorDia = 1000 * 60 * 60 * 24;
    return Math.ceil((hasta.getTime() - desde.getTime()) / milisegundosPorDia);
  }

  private async registrarEvento(usuarioId: string, nombre: string, metadataJson?: Record<string, unknown>) {
    await this.prisma.eventoAnalitica
      .create({
        data: {
          usuarioId,
          nombre,
          tipo: 'NEGOCIO',
          metadataJson: metadataJson as Prisma.InputJsonValue | undefined,
        },
      })
      .catch(() => null);
  }

  private async registrarAuditoria(data: {
    usuarioId: string;
    tipo: TipoAuditoriaMonetizacion;
    planAnterior?: string;
    planNuevo?: string;
    plataforma?: PlataformaCompra;
    transaccionExternaId?: string;
    metadataJson?: Record<string, unknown>;
  }) {
    await this.prisma.auditoriaMonetizacion
      .create({
        data: {
          usuarioId: data.usuarioId,
          tipo: data.tipo,
          planAnterior: data.planAnterior,
          planNuevo: data.planNuevo,
          plataforma: data.plataforma,
          transaccionExternaId: data.transaccionExternaId,
          metadataJson: data.metadataJson as Prisma.InputJsonValue | undefined,
        },
      })
      .catch(() => null);
  }
}
