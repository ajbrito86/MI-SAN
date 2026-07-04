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

  buscarPorGoogleId(googleId: string) {
    return this.prisma.usuario.findUnique({ where: { googleId } });
  }

  buscarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
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

  vincularGoogle(usuarioId: string, data: { googleId: string; fotoPerfilUrl?: string | null; isVerified?: boolean }) {
    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        googleId: data.googleId,
        fotoPerfilUrl: data.fotoPerfilUrl,
        isVerified: data.isVerified,
      },
    });
  }

  crearRecuperacionContrasena(usuarioId: string, codigoHash: string, expiraEn: Date) {
    return this.prisma.recuperacionContrasena.create({
      data: {
        usuarioId,
        codigoHash,
        expiraEn,
      },
    });
  }

  listarRecuperacionesActivas(usuarioId: string) {
    return this.prisma.recuperacionContrasena.findMany({
      where: {
        usuarioId,
        usado: false,
        expiraEn: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  marcarRecuperacionUsada(id: string) {
    return this.prisma.recuperacionContrasena.update({
      where: { id },
      data: {
        usado: true,
        usadoEn: new Date(),
      },
    });
  }

  actualizarContrasena(usuarioId: string, passwordHash: string) {
    return this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        passwordHash,
        refreshTokenHash: null,
      },
    });
  }
}
