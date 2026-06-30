import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UsuarioAutenticado } from '../types/usuario-autenticado.type';

type JwtPayload = {
  sub: string;
  email: string;
  telefono: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { usuario?: UsuarioAutenticado }>();
    const token = this.obtenerToken(request);

    if (!token) {
      throw new UnauthorizedException('Debes iniciar sesion para continuar.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      request.usuario = {
        id: payload.sub,
        email: payload.email,
        telefono: payload.telefono,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Tu sesion expiro. Inicia sesion nuevamente.');
    }
  }

  private obtenerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    const [tipo, token] = authorization?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : undefined;
  }
}
