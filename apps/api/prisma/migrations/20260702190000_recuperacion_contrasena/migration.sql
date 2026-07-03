CREATE TABLE "RecuperacionContrasena" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "usado" BOOLEAN NOT NULL DEFAULT false,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecuperacionContrasena_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecuperacionContrasena_usuarioId_usado_expiraEn_idx" ON "RecuperacionContrasena"("usuarioId", "usado", "expiraEn");

ALTER TABLE "RecuperacionContrasena" ADD CONSTRAINT "RecuperacionContrasena_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
