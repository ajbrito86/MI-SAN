CREATE TYPE "MotivoReporteChat" AS ENUM ('LENGUAJE_OFENSIVO', 'ACOSO_O_AMENAZA', 'CONTENIDO_SEXUAL_O_INAPROPIADO', 'ESTAFA_O_FRAUDE', 'SPAM', 'OTRO');
CREATE TYPE "EstadoReporteChat" AS ENUM ('PENDIENTE', 'EN_REVISION', 'RESUELTO', 'DESCARTADO');

ALTER TABLE "Usuario" ADD COLUMN "notificacionesHabilitadas" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "ReporteChat" (
  "id" TEXT NOT NULL,
  "reportanteUsuarioId" TEXT NOT NULL,
  "usuarioReportadoId" TEXT NOT NULL,
  "sociedadId" TEXT NOT NULL,
  "conversacionId" TEXT NOT NULL,
  "mensajeId" TEXT,
  "motivo" "MotivoReporteChat" NOT NULL,
  "descripcion" TEXT,
  "estado" "EstadoReporteChat" NOT NULL DEFAULT 'PENDIENTE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReporteChat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReporteChat_reportanteUsuarioId_mensajeId_key" ON "ReporteChat"("reportanteUsuarioId", "mensajeId");
CREATE INDEX "ReporteChat_estado_createdAt_idx" ON "ReporteChat"("estado", "createdAt");
CREATE INDEX "ReporteChat_conversacionId_createdAt_idx" ON "ReporteChat"("conversacionId", "createdAt");
CREATE INDEX "ReporteChat_usuarioReportadoId_createdAt_idx" ON "ReporteChat"("usuarioReportadoId", "createdAt");
ALTER TABLE "ReporteChat" ADD CONSTRAINT "ReporteChat_reportanteUsuarioId_fkey" FOREIGN KEY ("reportanteUsuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReporteChat" ADD CONSTRAINT "ReporteChat_usuarioReportadoId_fkey" FOREIGN KEY ("usuarioReportadoId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReporteChat" ADD CONSTRAINT "ReporteChat_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "ConversacionSociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReporteChat" ADD CONSTRAINT "ReporteChat_mensajeId_fkey" FOREIGN KEY ("mensajeId") REFERENCES "MensajeChat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
