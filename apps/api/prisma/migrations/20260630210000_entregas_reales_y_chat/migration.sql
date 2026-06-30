-- AlterTable
ALTER TABLE "TurnoCobro" ADD COLUMN "montoEntregado" DECIMAL(12,2);
ALTER TABLE "TurnoCobro" ADD COLUMN "entregaIncompleta" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ConversacionSociedad" (
    "id" TEXT NOT NULL,
    "sociedadId" TEXT NOT NULL,
    "participanteId" TEXT NOT NULL,
    "organizadorId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversacionSociedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensajeChat" (
    "id" TEXT NOT NULL,
    "conversacionId" TEXT NOT NULL,
    "remitenteId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensajeChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversacionSociedad_sociedadId_participanteId_key" ON "ConversacionSociedad"("sociedadId", "participanteId");

-- AddForeignKey
ALTER TABLE "ConversacionSociedad" ADD CONSTRAINT "ConversacionSociedad_sociedadId_fkey" FOREIGN KEY ("sociedadId") REFERENCES "Sociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversacionSociedad" ADD CONSTRAINT "ConversacionSociedad_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "ParticipanteSociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversacionSociedad" ADD CONSTRAINT "ConversacionSociedad_organizadorId_fkey" FOREIGN KEY ("organizadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_conversacionId_fkey" FOREIGN KEY ("conversacionId") REFERENCES "ConversacionSociedad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensajeChat" ADD CONSTRAINT "MensajeChat_remitenteId_fkey" FOREIGN KEY ("remitenteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
