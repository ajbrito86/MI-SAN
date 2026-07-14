import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EstadoUsuarioPlan, PlataformaCompra, Prisma, RolUsuario, TipoAuditoriaMonetizacion } from '@prisma/client';
import { google } from 'googleapis';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfiguracionService } from '../configuracion/configuracion.service';
import { ComprarPremiumDto } from './dto/comprar-premium.dto';

const CODIGO_TRIAL = 'GRATIS_TRIAL';
const CODIGO_GRATIS_ADS = 'GRATIS_ADS';
const CODIGO_PREMIUM = 'PREMIUM_SIN_ADS';
const PREMIUM_PRODUCT_ID_DEFAULT = 'premium_sin_ads';
const GOOGLE_PLAY_PACKAGE_NAME_DEFAULT = 'app.mi_san.mobile';
const APP_STORE_BUNDLE_ID_DEFAULT = 'app.mi-san.mobile';
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
    precio: '4.99',
    duracionDias: null,
    permiteAds: false,
    isPagoUnico: true,
  },
} as const;

type ValidacionCompraPremium = {
  productId: string;
  plataforma: PlataformaCompra;
  orderId?: string;
  transactionId?: string;
  originalTransactionId?: string;
  packageName?: string;
  bundleId?: string;
  purchaseTimeMillis?: string | number;
  purchaseState?: number | null;
  acknowledgementState?: number | null;
  consumptionState?: number | null;
  purchaseType?: number | null;
  environment?: string;
};

type AppStoreReceiptResponse = {
  status?: number;
  environment?: string;
  receipt?: {
    bundle_id?: string;
    in_app?: AppStoreReceiptPurchase[];
  };
  latest_receipt_info?: AppStoreReceiptPurchase[];
};

type AppStoreReceiptPurchase = {
  product_id?: string;
  transaction_id?: string;
  original_transaction_id?: string;
  purchase_date_ms?: string;
  cancellation_date_ms?: string;
};

@Injectable()
export class SuscripcionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracionService: ConfiguracionService,
    private readonly configService: ConfigService,
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

  async reactivarUltimaSuscripcionSiNoTieneActiva(usuarioId: string) {
    const activa = await this.prisma.usuarioPlan.findFirst({
      where: { usuarioId, estado: EstadoUsuarioPlan.ACTIVO, isActive: true },
      select: { id: true },
    });

    if (activa) {
      return;
    }

    const ultimaCancelada = await this.prisma.usuarioPlan.findFirst({
      where: { usuarioId, estado: EstadoUsuarioPlan.CANCELADO, isActive: false },
      orderBy: { fechaInicio: 'desc' },
      select: { id: true },
    });

    if (!ultimaCancelada) {
      return;
    }

    await this.prisma.usuarioPlan.update({
      where: { id: ultimaCancelada.id },
      data: { estado: EstadoUsuarioPlan.ACTIVO, isActive: true },
    });
  }

  async comprarPremium(usuarioId: string, dto: ComprarPremiumDto = {}) {
    return this.activarPremium(usuarioId, dto, 'premium_comprado');
  }

  async restaurarCompra(usuarioId: string, dto: ComprarPremiumDto = {}) {
    return this.activarPremium(usuarioId, dto, 'premium_restaurado');
  }

  private async activarPremium(usuarioId: string, dto: ComprarPremiumDto, evento: string) {
    const validacionCompra = await this.validarActivacionPremiumPermitida(dto);

    const plan = await this.buscarPlanActivo(CODIGO_PREMIUM);
    const fechaInicio = new Date();
    const transaccionExternaId =
      dto.transaccionExternaId ?? validacionCompra?.orderId ?? validacionCompra?.transactionId ?? dto.purchaseToken;

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
          transaccionExternaId,
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
      transaccionExternaId,
      metadataJson: {
        productId: dto.productId,
        packageNameAndroid: dto.packageNameAndroid,
        appBundleIdIos: dto.appBundleIdIos,
        originalTransactionIdIos: dto.originalTransactionIdIos,
        validacionCompra,
      },
    });

    return this.mapearSuscripcion(suscripcion);
  }

  private async validarActivacionPremiumPermitida(dto: ComprarPremiumDto) {
    const esProduccion = this.configService.get<string>('NODE_ENV') === 'production';
    const billingRealHabilitado = this.configService.get<string>('BILLING_REAL_ENABLED') === 'true';
    const activacionManualPermitida = this.configService.get<string>('ALLOW_MANUAL_PREMIUM_ACTIVATION') === 'true';

    if (esProduccion && !billingRealHabilitado && !activacionManualPermitida) {
      throw new ForbiddenException('Las compras Premium estan desactivadas hasta integrar Billing real.');
    }

    if (billingRealHabilitado) {
      return this.validarCompraPremiumReal(dto);
    }

    return null;
  }

  private validarCompraPremiumReal(dto: ComprarPremiumDto) {
    if (dto.plataformaCompra === PlataformaCompra.GOOGLE_PLAY) {
      return this.validarCompraGooglePlay(dto);
    }

    if (dto.plataformaCompra === PlataformaCompra.APP_STORE) {
      return this.validarCompraAppStore(dto);
    }

    throw new ForbiddenException('Billing real requiere una compra de Google Play o App Store.');
  }

  private async validarCompraGooglePlay(dto: ComprarPremiumDto): Promise<ValidacionCompraPremium> {
    const productIdEsperado = this.obtenerPremiumProductIdEsperado();
    const packageNameEsperado = this.configService.get<string>('GOOGLE_PLAY_PACKAGE_NAME') || GOOGLE_PLAY_PACKAGE_NAME_DEFAULT;

    if (!dto.productId || dto.productId !== productIdEsperado) {
      throw new ForbiddenException('Product ID de Google Play invalido.');
    }

    if (!dto.purchaseToken) {
      throw new ForbiddenException('Falta purchaseToken de Google Play.');
    }

    if (dto.packageNameAndroid && dto.packageNameAndroid !== packageNameEsperado) {
      throw new ForbiddenException('Package name de Google Play invalido.');
    }

    const androidPublisher = google.androidpublisher({
      version: 'v3',
      auth: await this.crearGooglePlayAuth(),
    });

    const respuesta = await androidPublisher.purchases.products.get({
      packageName: packageNameEsperado,
      productId: productIdEsperado,
      token: dto.purchaseToken,
    });
    const compra = respuesta.data;

    if (compra.purchaseState !== 0) {
      throw new ForbiddenException('La compra de Google Play no esta completada.');
    }

    if (compra.acknowledgementState !== 1) {
      await androidPublisher.purchases.products.acknowledge({
        packageName: packageNameEsperado,
        productId: productIdEsperado,
        token: dto.purchaseToken,
      });
    }

    return {
      productId: productIdEsperado,
      plataforma: PlataformaCompra.GOOGLE_PLAY,
      packageName: packageNameEsperado,
      orderId: compra.orderId ?? undefined,
      purchaseTimeMillis: compra.purchaseTimeMillis ?? undefined,
      purchaseState: compra.purchaseState,
      acknowledgementState: compra.acknowledgementState,
      consumptionState: compra.consumptionState,
      purchaseType: compra.purchaseType,
    };
  }

  private async validarCompraAppStore(dto: ComprarPremiumDto): Promise<ValidacionCompraPremium> {
    const productIdEsperado = this.obtenerPremiumProductIdEsperado();
    const bundleIdEsperado = this.configService.get<string>('APP_STORE_BUNDLE_ID') || APP_STORE_BUNDLE_ID_DEFAULT;

    if (!dto.productId || dto.productId !== productIdEsperado) {
      throw new ForbiddenException('Product ID de App Store invalido.');
    }

    if (!dto.transactionReceipt) {
      throw new ForbiddenException('Falta transactionReceipt de App Store.');
    }

    if (dto.appBundleIdIos && dto.appBundleIdIos !== bundleIdEsperado) {
      throw new ForbiddenException('Bundle ID de App Store invalido.');
    }

    const respuesta = await this.verificarReceiptAppStore(dto.transactionReceipt);
    const bundleIdReceipt = respuesta.receipt?.bundle_id;

    if (bundleIdReceipt && bundleIdReceipt !== bundleIdEsperado) {
      throw new ForbiddenException('Bundle ID del recibo App Store invalido.');
    }

    const compra = [...(respuesta.receipt?.in_app ?? []), ...(respuesta.latest_receipt_info ?? [])]
      .filter((item) => item.product_id === productIdEsperado && !item.cancellation_date_ms)
      .sort((a, b) => Number(b.purchase_date_ms ?? 0) - Number(a.purchase_date_ms ?? 0))[0];

    if (!compra?.transaction_id) {
      throw new ForbiddenException('No se encontro una compra Premium valida en el recibo de App Store.');
    }

    if (dto.originalTransactionIdIos && compra.original_transaction_id && dto.originalTransactionIdIos !== compra.original_transaction_id) {
      throw new ForbiddenException('Transaccion original de App Store invalida.');
    }

    return {
      productId: productIdEsperado,
      plataforma: PlataformaCompra.APP_STORE,
      bundleId: bundleIdEsperado,
      transactionId: compra.transaction_id,
      originalTransactionId: compra.original_transaction_id,
      purchaseTimeMillis: compra.purchase_date_ms,
      environment: respuesta.environment,
    };
  }

  private async verificarReceiptAppStore(receiptData: string) {
    const produccion = 'https://buy.itunes.apple.com/verifyReceipt';
    const sandbox = 'https://sandbox.itunes.apple.com/verifyReceipt';
    const respuestaProduccion = await this.enviarReceiptAppStore(produccion, receiptData);

    if (respuestaProduccion.status === 21007) {
      return this.enviarReceiptAppStore(sandbox, receiptData);
    }

    if (respuestaProduccion.status === 21008) {
      return this.enviarReceiptAppStore(produccion, receiptData);
    }

    if (respuestaProduccion.status !== 0) {
      throw new ForbiddenException(`Recibo de App Store invalido. Codigo ${respuestaProduccion.status ?? 'desconocido'}.`);
    }

    return respuestaProduccion;
  }

  private async enviarReceiptAppStore(url: string, receiptData: string): Promise<AppStoreReceiptResponse> {
    const password = this.configService.get<string>('APP_STORE_SHARED_SECRET');
    const respuesta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        ...(password ? { password } : {}),
        'exclude-old-transactions': true,
      }),
    });

    if (!respuesta.ok) {
      throw new ForbiddenException('No se pudo validar el recibo con App Store.');
    }

    return (await respuesta.json()) as AppStoreReceiptResponse;
  }

  private obtenerPremiumProductIdEsperado() {
    return (
      this.configService.get<string>('PREMIUM_PRODUCT_ID') ||
      this.configService.get<string>('GOOGLE_PLAY_PREMIUM_PRODUCT_ID') ||
      PREMIUM_PRODUCT_ID_DEFAULT
    );
  }

  private async crearGooglePlayAuth() {
    const credentials = this.obtenerGooglePlayCredentials();

    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
  }

  private obtenerGooglePlayCredentials() {
    const base64 = this.configService.get<string>('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64');
    const raw = base64
      ? Buffer.from(base64, 'base64').toString('utf8')
      : this.configService.get<string>('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');

    if (!raw) {
      throw new ForbiddenException('Faltan credenciales de Google Play para validar compras.');
    }

    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new ForbiddenException('Credenciales de Google Play invalidas.');
    }
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
