import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  buscarPorEmailOTelefono(identificador: string) {
    return this.prisma.usuario.findFirst({
      where: {
        OR: [{ email: identificador.toLowerCase() }, { telefono: identificador }],
      },
    });
  }

  buscarPorId(id: string) {
    return this.prisma.usuario.findUnique({ where: { id } });
  }

  crear(data: Prisma.UsuarioCreateInput) {
    return this.prisma.usuario.create({ data });
  }

  actualizarRefreshTokenHash(usuarioId: string, refreshTokenHash: string | null) {
    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { refreshTokenHash },
    });
  }
}
