import { Injectable } from '@nestjs/common';
import { EstadoUsuarioPlan, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorId(id: string) {
    return this.prisma.usuario.findUnique({
      where: { id },
    });
  }

  buscarPorEmailOTelefono(email?: string, telefono?: string) {
    return this.prisma.usuario.findFirst({
      where: {
        OR: [{ email }, { telefono }].filter((condicion) => Object.values(condicion).some(Boolean)),
      },
    });
  }

  actualizar(id: string, data: Prisma.UsuarioUpdateInput) {
    return this.prisma.usuario.update({
      where: { id },
      data,
    });
  }

  eliminarLogicamente(id: string) {
    const marcador = `eliminado-${id}`;

    return this.prisma.$transaction(async (tx) => {
      await tx.usuarioPlan.updateMany({
        where: { usuarioId: id, estado: EstadoUsuarioPlan.ACTIVO, isActive: true },
        data: { estado: EstadoUsuarioPlan.CANCELADO, isActive: false },
      });

      return tx.usuario.update({
        where: { id },
        data: {
          nombres: 'Cuenta',
          apellidos: 'eliminada',
          telefono: `${marcador}-telefono`,
          email: `${marcador}@mi-san.local`,
          fotoPerfilUrl: null,
          pushToken: null,
          refreshTokenHash: null,
          isActive: false,
        },
      });
    });
  }
}
