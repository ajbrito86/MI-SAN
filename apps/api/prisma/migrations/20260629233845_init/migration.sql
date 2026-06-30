-- CreateEnum
CREATE TYPE "FrecuenciaSociedad" AS ENUM ('SEMANAL', 'QUINCENAL', 'MENSUAL');

-- CreateEnum
CREATE TYPE "ModalidadTurno" AS ENUM ('MANUAL', 'ALEATORIA');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('EFECTIVO', 'DEPOSITO_BANCARIO', 'TRANSFERENCIA', 'MIXTO');

-- CreateEnum
CREATE TYPE "EstadoSociedad" AS ENUM ('CONFIGURACION', 'ACTIVA', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoParticipante" AS ENUM ('INVITADO', 'ACTIVO', 'RETIRADO', 'EXPULSADO');

-- CreateEnum
CREATE TYPE "EstadoInvitacion" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "EstadoCiclo" AS ENUM ('CONFIGURACION', 'ACTIVO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('PENDIENTE', 'PAGADO', 'REPROGRAMADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'REPORTADO', 'CONFIRMADO', 'RECHAZADO', 'ATRASADO', 'INCUMPLIDO');

-- CreateEnum
CREATE TYPE "TipoNotificacion" AS ENUM ('RECORDATORIO_PAGO', 'PAGO_CONFIRMADO', 'PAGO_RECHAZADO', 'INVITACION_RECIBIDA', 'INVITACION_ACEPTADA', 'NUEVO_CICLO', 'PROXIMO_COBRO', 'PROXIMO_VENCIMIENTO', 'PARTICIPANTE_EXPULSADO');

-- CreateEnum
CREATE TYPE "TipoMovimientoHistorial" AS ENUM ('SOCIEDAD_CREADA', 'SOCIEDAD_EDITADA', 'SOCIEDAD_CERRADA', 'PARTICIPANTE_AGREGADO', 'PARTICIPANTE_EXPULSADO', 'INVITACION_ENVIADA', 'INVITACION_ACEPTADA', 'CICLO_CREADO', 'CICLO_INICIADO', 'CICLO_FINALIZADO', 'TURNO_GENERADO', 'PAGO_REPORTADO', 'PAGO_CONFIRMADO', 'PAGO_RECHAZADO', 'EVIDENCIA_CARGADA');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fotoPerfilUrl" TEXT,
    "pushToken" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sociedad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "organizadorId" TEXT NOT NULL,
    "montoCuota" DECIMAL(12,2) NOT NULL,
    "frecuencia" "FrecuenciaSociedad" NOT NULL,
    "modalidadTurnos" "ModalidadTurno" NOT NULL,
    "tipoPago" "TipoPago" NOT NULL,
    "cantidadParticipantes" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFinEstimada" TIMESTAMP(3),
    "estado" "EstadoSociedad" NOT NULL DEFAULT 'CONFIGURACION',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sociedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteSociedad" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "turno" INTEGER,
    "fechaIngreso" TIMESTAMP(3),
    "estadoParticipante" "EstadoParticipante" NOT NULL DEFAULT 'INVITADO',
    "observacion" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParticipanteSociedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvitacionSociedad" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "telefonoInvitado" TEXT,
    "emailInvitado" TEXT,
    "enviadaPor" TEXT NOT NULL,
    "estado" "EstadoInvitacion" NOT NULL DEFAULT 'PENDIENTE',
    "fechaRespuesta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvitacionSociedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CicloSociedad" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "numeroCiclo" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoCiclo" NOT NULL DEFAULT 'CONFIGURACION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CicloSociedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TurnoCobro" (
    "id" TEXT NOT NULL,
    "cicloId" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "numeroTurno" INTEGER NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "montoCobro" DECIMAL(12,2) NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurnoCobro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CuotaPago" (
    "id" TEXT NOT NULL,
    "cicloId" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaPago" TIMESTAMP(3),
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "confirmadoPor" TEXT,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CuotaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenciaPago" (
    "id" TEXT NOT NULL,
    "cuotaPagoId" TEXT NOT NULL,
    "urlArchivo" TEXT NOT NULL,
    "nombreArchivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "cargadoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenciaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" "TipoNotificacion" NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialMovimiento" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" "TipoMovimientoHistorial" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "realizadoPor" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialMovimiento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_telefono_key" ON "Usuario"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipanteSociedad_usuarioId_sociedadId_key" ON "ParticipanteSociedad"("usuarioId", "sociedadId");

-- CreateIndex
CREATE UNIQUE INDEX "CicloSociedad_sociedadId_numeroCiclo_key" ON "CicloSociedad"("sociedadId", "numeroCiclo");

-- CreateIndex
CREATE UNIQUE INDEX "TurnoCobro_cicloId_participanteId_key" ON "TurnoCobro"("cicloId", "participanteId");

-- CreateIndex
CREATE UNIQUE INDEX "TurnoCobro_cicloId_numeroTurno_key" ON "TurnoCobro"("cicloId", "numeroTurno");

-- CreateIndex
CREATE UNIQUE INDEX "CuotaPago_cicloId_participanteId_numeroCuota_key" ON "CuotaPago"("cicloId", "participanteId", "numeroCuota");

-- AddForeignKey
ALTER TABLE "Sociedad" ADD CONSTRAINT "Sociedad_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteSociedad" ADD CONSTRAINT "ParticipanteSociedad_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "Sociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteSociedad" ADD CONSTRAINT "ParticipanteSociedad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitacionSociedad" ADD CONSTRAINT "InvitacionSociedad_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "Sociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvitacionSociedad" ADD CONSTRAINT "InvitacionSociedad_enviadaPor_fkey" FOREIGN KEY ("enviadaPor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CicloSociedad" ADD CONSTRAINT "CicloSociedad_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "Sociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoCobro" ADD CONSTRAINT "TurnoCobro_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloSociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurnoCobro" ADD CONSTRAINT "TurnoCobro_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "ParticipanteSociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaPago" ADD CONSTRAINT "CuotaPago_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloSociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaPago" ADD CONSTRAINT "CuotaPago_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "ParticipanteSociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CuotaPago" ADD CONSTRAINT "CuotaPago_confirmadoPor_fkey" FOREIGN KEY ("confirmadoPor") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaPago" ADD CONSTRAINT "EvidenciaPago_cuotaPagoId_fkey" FOREIGN KEY ("cuotaPagoId") REFERENCES "CuotaPago"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaPago" ADD CONSTRAINT "EvidenciaPago_cargadoPor_fkey" FOREIGN KEY ("cargadoPor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialMovimiento" ADD CONSTRAINT "HistorialMovimiento_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "Sociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialMovimiento" ADD CONSTRAINT "HistorialMovimiento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialMovimiento" ADD CONSTRAINT "HistorialMovimiento_realizadoPor_fkey" FOREIGN KEY ("realizadoPor") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
