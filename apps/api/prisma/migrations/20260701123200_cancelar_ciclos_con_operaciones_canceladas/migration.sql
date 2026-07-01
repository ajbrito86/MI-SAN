UPDATE "CicloSociedad" c
SET "estado" = 'CANCELADO', "fechaFin" = COALESCE(c."fechaFin", NOW())
WHERE c."estado" <> 'CANCELADO'
  AND c."sociedadId" IN (
    SELECT "id" FROM "Sociedad" WHERE "estado" IN ('CANCELADA', 'FINALIZADA')
  )
  AND (
    EXISTS (
      SELECT 1 FROM "TurnoCobro" t
      WHERE t."cicloId" = c.id AND t."estado" = 'CANCELADO'
    )
    OR EXISTS (
      SELECT 1 FROM "CuotaPago" cp
      WHERE cp."cicloId" = c.id AND cp."estado" = 'CANCELADO'
    )
  );
