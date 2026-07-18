import { ConflictException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RolUsuario } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';
import { AuthRepository } from './auth.repository';
import { SuscripcionesService } from '../suscripciones/suscripciones.service';
import { SolicitarRecuperacionDto } from './dto/solicitar-recuperacion.dto';
import { ConfirmarRecuperacionDto } from './dto/confirmar-recuperacion.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

type Tokens = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly suscripcionesService: SuscripcionesService,
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
      rolGlobal: RolUsuario.ORGANIZADOR,
      passwordHash,
    });

    const tokens = await this.generarTokens(usuario.id, usuario.email, usuario.telefono);
    await this.guardarRefreshToken(usuario.id, tokens.refreshToken);
    const suscripcion = await this.suscripcionesService.asignarTrialInicial(usuario.id);

    return {
      usuario: { ...this.mapearUsuario(usuario), suscripcion },
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
    const suscripcion = await this.suscripcionesService.obtenerActual(usuario.id);
    const usuarioActualizado = (await this.authRepository.buscarPorId(usuario.id)) ?? usuario;

    return {
      usuario: { ...this.mapearUsuario(usuarioActualizado), suscripcion },
      ...tokens,
    };
  }

  async loginConGoogle(dto: GoogleLoginDto) {
    const perfilGoogle = await this.validarGoogleIdToken(dto.idToken);
    const email = perfilGoogle.email.toLowerCase();
    const usuarioPorGoogle = await this.authRepository.buscarPorGoogleId(perfilGoogle.googleId);

    let usuario = usuarioPorGoogle ?? (await this.authRepository.buscarPorEmail(email));

    if (usuario && !usuario.isActive && usuario.googleId === perfilGoogle.googleId) {
      const fueAnonimizado = this.usuarioFueAnonimizado(usuario);
      usuario = await this.authRepository.reactivarGoogle(usuario.id, {
        nombres: fueAnonimizado ? perfilGoogle.nombres : usuario.nombres,
        apellidos: fueAnonimizado ? perfilGoogle.apellidos : usuario.apellidos,
        telefono: fueAnonimizado ? `google:${perfilGoogle.googleId}` : usuario.telefono,
        email,
        fotoPerfilUrl: usuario.fotoPerfilUrl ?? perfilGoogle.fotoPerfilUrl,
        isVerified: usuario.isVerified || perfilGoogle.emailVerificado,
      });
      await this.suscripcionesService.reactivarUltimaSuscripcionSiNoTieneActiva(usuario.id);
    } else if (usuario && !usuario.isActive) {
      throw new UnauthorizedException('Tu cuenta no esta activa.');
    }

    if (usuario && usuario.isActive && usuario.googleId === perfilGoogle.googleId && this.usuarioFueAnonimizado(usuario)) {
      usuario = await this.authRepository.reactivarGoogle(usuario.id, {
        nombres: perfilGoogle.nombres,
        apellidos: perfilGoogle.apellidos,
        telefono: `google:${perfilGoogle.googleId}`,
        email,
        fotoPerfilUrl: usuario.fotoPerfilUrl ?? perfilGoogle.fotoPerfilUrl,
        isVerified: usuario.isVerified || perfilGoogle.emailVerificado,
      });
      await this.suscripcionesService.reactivarUltimaSuscripcionSiNoTieneActiva(usuario.id);
    }

    if (usuario && usuario.googleId !== perfilGoogle.googleId) {
      usuario = await this.authRepository.vincularGoogle(usuario.id, {
        googleId: perfilGoogle.googleId,
        fotoPerfilUrl: usuario.fotoPerfilUrl ?? perfilGoogle.fotoPerfilUrl,
        isVerified: usuario.isVerified || perfilGoogle.emailVerificado,
      });
    }

    if (!usuario) {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
      usuario = await this.authRepository.crear({
        nombres: perfilGoogle.nombres,
        apellidos: perfilGoogle.apellidos,
        telefono: `google:${perfilGoogle.googleId}`,
        email,
        googleId: perfilGoogle.googleId,
        rolGlobal: RolUsuario.ORGANIZADOR,
        passwordHash,
        fotoPerfilUrl: perfilGoogle.fotoPerfilUrl,
        isVerified: perfilGoogle.emailVerificado,
      });
    }

    const suscripcion = await this.suscripcionesService.obtenerActual(usuario.id);
    const tokens = await this.generarTokens(usuario.id, usuario.email, usuario.telefono);
    await this.guardarRefreshToken(usuario.id, tokens.refreshToken);

    return {
      usuario: { ...this.mapearUsuario(usuario), suscripcion },
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
    await this.authRepository.limpiarSesion(usuarioId);
    return { mensaje: 'Sesion cerrada correctamente.' };
  }

  async solicitarRecuperacion(dto: SolicitarRecuperacionDto) {
    const identificador = dto.identificador.trim();
    const usuario = await this.authRepository.buscarPorEmailOTelefono(identificador);
    const respuesta: { mensaje: string; codigoRecuperacion?: string } = {
      mensaje: 'Si encontramos una cuenta activa, enviaremos instrucciones para recuperar el acceso.',
    };

    if (!usuario || !usuario.isActive) {
      return respuesta;
    }

    const codigo = this.generarCodigoRecuperacion();
    const codigoHash = await bcrypt.hash(codigo, 12);
    const expiraEn = new Date(Date.now() + 15 * 60 * 1000);

    await this.authRepository.crearRecuperacionContrasena(usuario.id, codigoHash, expiraEn);

    if (this.debeExponerCodigoRecuperacion()) {
      respuesta.codigoRecuperacion = codigo;
    }

    return respuesta;
  }

  async confirmarRecuperacion(dto: ConfirmarRecuperacionDto) {
    const usuario = await this.authRepository.buscarPorEmailOTelefono(dto.identificador.trim());

    if (!usuario || !usuario.isActive) {
      throw new UnauthorizedException('Codigo invalido o expirado.');
    }

    const recuperaciones = await this.authRepository.listarRecuperacionesActivas(usuario.id);
    const recuperacionValida = await this.buscarRecuperacionValida(recuperaciones, dto.codigo);

    if (!recuperacionValida) {
      throw new UnauthorizedException('Codigo invalido o expirado.');
    }

    const passwordHash = await bcrypt.hash(dto.nuevaContrasena, 12);
    await this.authRepository.actualizarContrasena(usuario.id, passwordHash);
    await this.authRepository.marcarRecuperacionUsada(recuperacionValida.id);

    return { mensaje: 'Contrasena actualizada correctamente. Inicia sesion nuevamente.' };
  }

  private async generarTokens(usuarioId: string, email: string, telefono: string): Promise<Tokens> {
    const payload = { sub: usuarioId, email, telefono };
    const refreshTokenExpiresAt = this.proximoCorteSemanalSesion();
    const refreshExpiraEnSegundos = Math.max(1, Math.ceil((refreshTokenExpiresAt.getTime() - Date.now()) / 1000));
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiraEnSegundos,
      }),
    ]);

    return { accessToken, refreshToken, refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString() };
  }

  private proximoCorteSemanalSesion() {
    const horaUtcCorte = this.obtenerHoraUtcCorteSesion();
    const ahora = new Date();
    const proximoCorte = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000);
    proximoCorte.setUTCHours(horaUtcCorte, 0, 0, 0);

    if (proximoCorte.getTime() <= ahora.getTime()) {
      proximoCorte.setUTCDate(proximoCorte.getUTCDate() + 7);
    } else if (proximoCorte.getTime() < ahora.getTime() + 7 * 24 * 60 * 60 * 1000) {
      proximoCorte.setUTCDate(proximoCorte.getUTCDate() + 1);
    }

    return proximoCorte;
  }

  private obtenerHoraUtcCorteSesion() {
    const valor = Number(this.configService.get<string>('SESSION_DAILY_CUTOFF_UTC_HOUR') ?? '4');

    if (!Number.isInteger(valor) || valor < 0 || valor > 23) {
      return 4;
    }

    return valor;
  }

  private async guardarRefreshToken(usuarioId: string, refreshToken: string) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.authRepository.actualizarRefreshTokenHash(usuarioId, refreshTokenHash);
  }

  private generarCodigoRecuperacion() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private debeExponerCodigoRecuperacion() {
    return (
      this.configService.get<string>('NODE_ENV') !== 'production' ||
      this.configService.get<string>('ALLOW_PASSWORD_RESET_CODE_RESPONSE') === 'true'
    );
  }

  private async buscarRecuperacionValida(recuperaciones: { id: string; codigoHash: string }[], codigo: string) {
    for (const recuperacion of recuperaciones) {
      const valido = await bcrypt.compare(codigo, recuperacion.codigoHash);

      if (valido) {
        return recuperacion;
      }
    }

    return null;
  }

  private async validarGoogleIdToken(idToken: string) {
    const googleAudiences = this.obtenerGoogleAudiences();

    if (googleAudiences.length === 0) {
      throw new ServiceUnavailableException('Google Sign-In no esta configurado.');
    }

    try {
      const cliente = new OAuth2Client();
      const ticket = await cliente.verifyIdToken({
        idToken,
        audience: googleAudiences,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new UnauthorizedException('Token de Google invalido.');
      }

      const nombres = (payload.given_name || payload.name || payload.email.split('@')[0]).trim();
      const apellidos = (payload.family_name || '').trim();

      return {
        googleId: payload.sub,
        email: payload.email,
        nombres,
        apellidos,
        fotoPerfilUrl: payload.picture ?? null,
        emailVerificado: Boolean(payload.email_verified),
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException || error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Token de Google invalido.');
    }
  }

  private obtenerGoogleAudiences() {
    return [
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_IOS_CLIENT_ID'),
    ]
      .map((valor) => valor?.trim())
      .filter((valor): valor is string => Boolean(valor))
      .filter((valor, indice, lista) => lista.indexOf(valor) === indice);
  }

  private usuarioFueAnonimizado(usuario: { nombres: string; apellidos: string; telefono: string; email: string }) {
    return (
      usuario.nombres === 'Cuenta' ||
      usuario.apellidos === 'eliminada' ||
      usuario.telefono.startsWith('eliminado-') ||
      usuario.email.startsWith('eliminado-')
    );
  }

  private mapearUsuario(usuario: {
    id: string;
    nombres: string;
    apellidos: string;
    telefono: string;
    email: string;
    rolGlobal: string;
    fotoPerfilUrl?: string | null;
    isVerified?: boolean;
    googleId?: string | null;
  }) {
    const telefono = usuario.telefono.startsWith('google:') ? '' : usuario.telefono;

    return {
      id: usuario.id,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      telefono,
      email: usuario.email,
      googleId: usuario.googleId ?? null,
      rolGlobal: usuario.rolGlobal,
      fotoPerfilUrl: usuario.fotoPerfilUrl,
      isVerified: usuario.isVerified,
    };
  }
}
