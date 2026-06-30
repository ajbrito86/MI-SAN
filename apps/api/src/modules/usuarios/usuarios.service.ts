import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';
import { UsuariosRepository } from './usuarios.repository';

@Injectable()
export class UsuariosService {
  constructor(private readonly usuariosRepository: UsuariosRepository) {}

  async obtenerPerfil(usuarioId: string) {
    const usuario = await this.usuariosRepository.buscarPorId(usuarioId);

    if (!usuario || !usuario.isActive) {
      throw new NotFoundException('No encontramos tu perfil.');
    }

    return this.mapearUsuario(usuario);
  }

  async actualizarPerfil(usuarioId: string, dto: ActualizarPerfilDto) {
    const email = dto.email?.toLowerCase();
    const duplicado = await this.usuariosRepository.buscarPorEmailOTelefono(email, dto.telefono);

    if (duplicado && duplicado.id !== usuarioId) {
      throw new ConflictException('Ya existe una cuenta con ese correo o telefono.');
    }

    const usuario = await this.usuariosRepository.actualizar(usuarioId, {
      nombres: dto.nombres?.trim(),
      apellidos: dto.apellidos?.trim(),
      telefono: dto.telefono?.trim(),
      email,
    });

    return this.mapearUsuario(usuario);
  }

  private mapearUsuario(usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
    rolGlobal: string;
    fotoPerfilUrl: string | null;
    isVerified: boolean;
    createdAt: Date;
  }) {
    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      telefono: usuario.telefono,
      email: usuario.email,
      rolGlobal: usuario.rolGlobal,
      fotoPerfilUrl: usuario.fotoPerfilUrl,
      isVerified: usuario.isVerified,
      createdAt: usuario.createdAt,
    };
  }
}
