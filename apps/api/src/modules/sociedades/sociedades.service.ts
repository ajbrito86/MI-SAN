import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoSociedad, Prisma, RolUsuario } from '@prisma/client';
import { ActualizarSociedadDto } from './dto/actualizar-sociedad.dto';
import { CrearSociedadDto } from './dto/crear-sociedad.dto';
import { SociedadesRepository } from './sociedades.repository';

@Injectable()
export class SociedadesService {
  constructor(private readonly sociedadesRepository: SociedadesRepository) {}

  async crear(organizadorId: string, dto: CrearSociedadDto) {
    const usuario = await this.sociedadesRepository.buscarUsuario(organizadorId);

    if (!usuario || !usuario.isActive) {
      throw new NotFoundException('No encontramos tu perfil.');
    }

    if (usuario.rolGlobal !== RolUsuario.ORGANIZADOR) {
      throw new ForbiddenException('Solo un usuario organizador puede crear sociedades.');
    }

    const sociedad = await this.sociedadesRepository.crearConOrganizador(organizadorId, dto);
    return this.mapearSociedad(sociedad, organizadorId);
  }

  async listarDelUsuario(usuarioId: string) {
    const sociedades = await this.sociedadesRepository.listarDelUsuario(usuarioId);
    return sociedades.map((sociedad) => ({
      ...this.mapearSociedad(sociedad, usuarioId),
      participantesRegistrados: sociedad._count.participantes,
      ciclosRegistrados: sociedad._count.ciclos,
    }));
  }

  async obtenerPorId(usuarioId: string, sociedadId: string) {
    const sociedad = await this.sociedadesRepository.buscarAccesible(usuarioId, sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad o no tienes acceso.');
    }

    return {
      ...this.mapearSociedad(sociedad, usuarioId),
      organizador: sociedad.organizador,
      participantes: sociedad.participantes.map((participante) => ({
        id: participante.id,
        turno: participante.turno,
        estadoParticipante: participante.estadoParticipante,
        usuario: participante.usuario,
      })),
      cicloActual: sociedad.ciclos[0] ?? null,
      ciclos: sociedad.ciclos,
    };
  }

  async actualizar(usuarioId: string, sociedadId: string, dto: ActualizarSociedadDto) {
    const sociedad = await this.validarOrganizador(usuarioId, sociedadId);

    if (sociedad.estado !== EstadoSociedad.CONFIGURACION) {
      throw new BadRequestException('La sociedad ya fue iniciada y no puede modificarse.');
    }

    const actualizada = await this.sociedadesRepository.actualizar(sociedadId, {
      nombre: dto.nombre?.trim(),
      descripcion: dto.descripcion?.trim(),
      montoCuota: dto.montoCuota ? new Prisma.Decimal(dto.montoCuota) : undefined,
      moneda: dto.moneda,
      frecuencia: dto.frecuencia,
      modalidadTurnos: dto.modalidadTurnos,
      tipoPago: dto.tipoPago,
      cantidadParticipantes: dto.cantidadParticipantes,
      fechaInicio: dto.fechaInicio,
      fechaFinEstimada: dto.fechaFinEstimada,
    });

    return this.mapearSociedad(actualizada, usuarioId);
  }

  async cerrar(usuarioId: string, sociedadId: string) {
    const sociedad = await this.validarOrganizador(usuarioId, sociedadId);

    if (sociedad.estado === EstadoSociedad.CANCELADA || sociedad.estado === EstadoSociedad.FINALIZADA) {
      throw new BadRequestException('La sociedad ya esta cerrada.');
    }

    const cerrada = await this.sociedadesRepository.cerrar(sociedadId, usuarioId);
    return this.mapearSociedad(cerrada, usuarioId);
  }

  private async validarOrganizador(usuarioId: string, sociedadId: string) {
    const sociedad = await this.sociedadesRepository.buscarPorId(sociedadId);

    if (!sociedad) {
      throw new NotFoundException('No encontramos esa sociedad.');
    }

    if (sociedad.organizadorId !== usuarioId) {
      throw new ForbiddenException('No tienes permiso para realizar esta accion.');
    }

    return sociedad;
  }

  private mapearSociedad(
    sociedad: {
      id: string;
      nombre: string;
      descripcion: string | null;
      organizadorId: string;
      montoCuota: Prisma.Decimal;
      moneda: string;
      frecuencia: string;
      modalidadTurnos: string;
      tipoPago: string;
      cantidadParticipantes: number;
      fechaInicio: Date;
      fechaFinEstimada: Date | null;
      estado: string;
      createdAt: Date;
      updatedAt: Date;
    },
    usuarioId: string,
  ) {
    return {
      id: sociedad.id,
      nombre: sociedad.nombre,
      descripcion: sociedad.descripcion,
      rol: sociedad.organizadorId === usuarioId ? 'ORGANIZADOR' : 'PARTICIPANTE',
      montoCuota: Number(sociedad.montoCuota),
      moneda: sociedad.moneda,
      frecuencia: sociedad.frecuencia,
      modalidadTurnos: sociedad.modalidadTurnos,
      tipoPago: sociedad.tipoPago,
      cantidadParticipantes: sociedad.cantidadParticipantes,
      fechaInicio: sociedad.fechaInicio,
      fechaFinEstimada: sociedad.fechaFinEstimada,
      estado: sociedad.estado,
      createdAt: sociedad.createdAt,
      updatedAt: sociedad.updatedAt,
    };
  }
}
