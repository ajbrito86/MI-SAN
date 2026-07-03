CREATE TYPE "EstadoUsuarioPlan" AS ENUM ('ACTIVO', 'EXPIRADO', 'CANCELADO', 'REEMBOLSADO');

CREATE TYPE "PlataformaCompra" AS ENUM ('GOOGLE_PLAY', 'APP_STORE', 'MANUAL');

CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "duracionDias" INTEGER,
    "permiteAds" BOOLEAN NOT NULL DEFAULT false,
    "isPagoUnico" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsuarioPlan" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoUsuarioPlan" NOT NULL DEFAULT 'ACTIVO',
    "plataformaCompra" "PlataformaCompra" NOT NULL DEFAULT 'MANUAL',
    "transaccionExternaId" TEXT,
    "esTrial" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioPlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Plan_codigo_key" ON "Plan"("codigo");
CREATE INDEX "UsuarioPlan_usuarioId_estado_isActive_idx" ON "UsuarioPlan"("usuarioId", "estado", "isActive");
CREATE INDEX "UsuarioPlan_planId_idx" ON "UsuarioPlan"("planId");
CREATE UNIQUE INDEX "UsuarioPlan_usuarioId_activo_unico" ON "UsuarioPlan"("usuarioId") WHERE "isActive" = true AND "estado" = 'ACTIVO';

ALTER TABLE "UsuarioPlan" ADD CONSTRAINT "UsuarioPlan_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UsuarioPlan" ADD CONSTRAINT "UsuarioPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
