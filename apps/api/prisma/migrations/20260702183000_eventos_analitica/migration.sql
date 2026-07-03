CREATE TYPE "TipoEventoAnalitica" AS ENUM ('NEGOCIO', 'ADS', 'ERROR', 'SISTEMA');

CREATE TABLE "EventoAnalitica" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoEventoAnalitica" NOT NULL DEFAULT 'NEGOCIO',
    "plataforma" TEXT,
    "versionApp" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoAnalitica_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventoAnalitica_nombre_createdAt_idx" ON "EventoAnalitica"("nombre", "createdAt");
CREATE INDEX "EventoAnalitica_usuarioId_createdAt_idx" ON "EventoAnalitica"("usuarioId", "createdAt");

ALTER TABLE "EventoAnalitica" ADD CONSTRAINT "EventoAnalitica_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
