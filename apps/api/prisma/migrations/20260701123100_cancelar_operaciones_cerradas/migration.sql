UPDATE "CicloSociedad"
SET "estado" = 'CANCELADO', "fechaFin" = COALESCE("fechaFin", NOW())
WHERE "estado" IN ('CONFIGURACION', 'ACTIVO')
  AND "sociedadId" IN (
    SELECT "id" FROM "Sociedad" WHERE "estado" IN ('CANCELADA', 'FINALIZADA')
  );

UPDATE "CuotaPago"
SET "estado" = 'CANCELADO', "observacion" = COALESCE("observacion", 'Cancelado por cierre de sociedad.')
WHERE "estado" NOT IN ('CONFIRMADO', 'CANCELADO')
  AND "cicloId" IN (
    SELECT "id" FROM "CicloSociedad"
    WHERE "sociedadId" IN (
      SELECT "id" FROM "Sociedad" WHERE "estado" IN ('CANCELADA', 'FINALIZADA')
    )
  );

UPDATE "TurnoCobro"
SET "estado" = 'CANCELADO'
WHERE "estado" NOT IN ('PAGADO', 'CANCELADO')
  AND "cicloId" IN (
    SELECT "id" FROM "CicloSociedad"
    WHERE "sociedadId" IN (
      SELECT "id" FROM "Sociedad" WHERE "estado" IN ('CANCELADA', 'FINALIZADA')
    )
  );
