import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
}
