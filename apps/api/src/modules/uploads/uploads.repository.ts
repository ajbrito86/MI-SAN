import { Injectable } from '@nestjs/common';
import { TipoMovimientoHistorial } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarCuota(cuotaPagoId: string) {
    return this.prisma.cuotaPago.findUnique({
      where: { id: cuotaPagoId },
      include: {
        ciclo: { include: { sociedad: true } },
        participante: true,
      },
    });
  }

  crearEvidencia(params: {
    cuotaPagoId: string;
    urlArchivo: string;
    nombreArchivo: string;
    mimeType: string;
    cargadoPor: string;
    sociedadId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const evidencia = await tx.evidenciaPago.create({
        data: {
          cuotaPagoId: params.cuotaPagoId,
          urlArchivo: params.urlArchivo,
          nombreArchivo: params.nombreArchivo,
          mimeType: params.mimeType,
          cargadoPor: params.cargadoPor,
        },
      });

      await tx.historialMovimiento.create({
        data: {
          sociedadId: params.sociedadId,
          usuarioId: params.cargadoPor,
          realizadoPor: params.cargadoPor,
          accion: TipoMovimientoHistorial.EVIDENCIA_CARGADA,
          descripcion: 'Evidencia de pago cargada.',
        },
      });

      return evidencia;
    });
  }
}
