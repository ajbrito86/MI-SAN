import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import { AuthRepository } from './auth.repository';

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegistroDto) {
    const email = dto.email.toLowerCase();
    const existente = await this.authRepository.buscarPorEmailOTelefono(email);
    const telefonoExistente = await this.authRepository.buscarPorEmailOTelefono(dto.telefono);

    if (existente || telefonoExistente) {
      throw new ConflictException('Ya existe una cuenta con ese correo o telefono.');
    }

    const passwordHash = await bcrypt.hash(dto.contrasena, 12);
    const usuario = await this.authRepository.crear({
      nombres: dto.nombres.trim(),
      apellidos: dto.apellidos.trim(),
      telefono: dto.telefono.trim(),
      email,
      passwordHash,
    });

    const tokens = await this.generarTokens(usuario.id, usuario.email, usuario.telefono);
    await this.guardarRefreshToken(usuario.id, tokens.refreshToken);

    return {
      usuario: this.mapearUsuario(usuario),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const usuario = await this.authRepository.buscarPorEmailOTelefono(dto.identificador.trim());

    if (!usuario || !usuario.isActive) {
      throw new UnauthorizedException('Correo, telefono o contrasena incorrectos.');
    }

    const contrasenaValida = await bcrypt.compare(dto.contrasena, usuario.passwordHash);

    if (!contrasenaValida) {
      throw new UnauthorizedException('Correo, telefono o contrasena incorrectos.');
    }

    const tokens = await this.generarTokens(usuario.id, usuario.email, usuario.telefono);
    await this.guardarRefreshToken(usuario.id, tokens.refreshToken);

    return {
      usuario: this.mapearUsuario(usuario),
      ...tokens,
    };
  }

  async refrescar(refreshToken: string): Promise<Tokens> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; email: string; telefono: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const usuario = await this.authRepository.buscarPorId(payload.sub);

      if (!usuario?.refreshTokenHash || !usuario.isActive) {
        throw new UnauthorizedException('Tu sesion expiro. Inicia sesion nuevamente.');
      }

      const refreshValido = await bcrypt.compare(refreshToken, usuario.refreshTokenHash);

      if (!refreshValido) {
        throw new UnauthorizedException('Tu sesion expiro. Inicia sesion nuevamente.');
      }

      const tokens = await this.generarTokens(usuario.id, usuario.email, usuario.telefono);
      await this.guardarRefreshToken(usuario.id, tokens.refreshToken);
      return tokens;
    } catch {
      throw new UnauthorizedException('Tu sesion expiro. Inicia sesion nuevamente.');
    }
  }

  async cerrarSesion(usuarioId: string) {
    await this.authRepository.actualizarRefreshTokenHash(usuarioId, null);
    return { mensaje: 'Sesion cerrada correctamente.' };
  }

  private async generarTokens(usuarioId: string, email: string, telefono: string): Promise<Tokens> {
    const payload = { sub: usuarioId, email, telefono };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async guardarRefreshToken(usuarioId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.authRepository.actualizarRefreshTokenHash(usuarioId, refreshTokenHash);
  }

  private mapearUsuario(usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
    rolGlobal: string;
  }) {
    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      telefono: usuario.telefono,
      email: usuario.email,
      rolGlobal: usuario.rolGlobal,
    };
  }
}
