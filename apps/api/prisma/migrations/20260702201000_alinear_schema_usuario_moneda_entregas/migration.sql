-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('DOP', 'USD');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ORGANIZADOR', 'PARTICIPANTE');

-- AlterEnum
ALTER TYPE "TipoMovimientoHistorial" ADD VALUE 'TURNO_ENTREGADO';

-- AlterTable
ALTER TABLE "CuotaPago" ADD COLUMN "metodoPagoReportado" "TipoPago";

-- AlterTable
ALTER TABLE "Sociedad" ADD COLUMN "moneda" "Moneda" NOT NULL DEFAULT 'DOP';

-- AlterTable
ALTER TABLE "TurnoCobro" ADD COLUMN "entregadoPor" TEXT,
ADD COLUMN "fechaEntrega" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "rolGlobal" "RolUsuario" NOT NULL DEFAULT 'PARTICIPANTE';

