CREATE TYPE "TipoAuditoriaMonetizacion" AS ENUM ('TRIAL_INICIADO', 'TRIAL_EXPIRADO', 'PREMIUM_COMPRADO', 'PREMIUM_RESTAURADO', 'PLAN_CAMBIADO', 'REEMBOLSO_REGISTRADO');

CREATE TABLE "ConfiguracionGlobal" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valorJson" JSONB NOT NULL,
    "descripcion" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionGlobal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditoriaMonetizacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" "TipoAuditoriaMonetizacion" NOT NULL,
    "planAnterior" TEXT,
    "planNuevo" TEXT,
    "plataforma" "PlataformaCompra",
    "transaccionExternaId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaMonetizacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ConfiguracionGlobal_clave_key" ON "ConfiguracionGlobal"("clave");
CREATE INDEX "AuditoriaMonetizacion_usuarioId_createdAt_idx" ON "AuditoriaMonetizacion"("usuarioId", "createdAt");
CREATE INDEX "AuditoriaMonetizacion_tipo_createdAt_idx" ON "AuditoriaMonetizacion"("tipo", "createdAt");

ALTER TABLE "AuditoriaMonetizacion" ADD CONSTRAINT "AuditoriaMonetizacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
