#!/usr/bin/env sh
set -eu

COMPOSE_FILE="compose.production.yml"
ENV_FILE="apps/api/.env.production"

[ -f "$COMPOSE_FILE" ] || {
  echo "ERROR: Falta $COMPOSE_FILE" >&2
  exit 1
}

[ -f "$ENV_FILE" ] || {
  echo "ERROR: Falta $ENV_FILE" >&2
  exit 1
}

get_env() {
  key="$1"
  default="$2"
  value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d '=' -f 2- || true)"

  if [ -n "$value" ]; then
    printf '%s' "$value"
  else
    printf '%s' "$default"
  fi
}

POSTGRES_USER_VALUE="$(get_env POSTGRES_USER misan)"
POSTGRES_DB_VALUE="$(get_env POSTGRES_DB misan)"

echo ""
echo "============================================"
echo "        FACTORY RESET DE MI SAN"
echo "============================================"
echo ""
echo "Base de datos: $POSTGRES_DB_VALUE"
echo ""
echo "Este proceso eliminara la data operativa de la app:"
echo "- sociedades, ciclos, participantes e invitaciones"
echo "- turnos, cuotas, evidencias y pagos"
echo "- chats, notificaciones, historial y analitica"
echo ""
echo "Se conservara:"
echo "- Usuario"
echo "- Plan"
echo "- UsuarioPlan"
echo "- ConfiguracionGlobal"
echo "- AuditoriaMonetizacion"
echo "- _prisma_migrations"
echo ""
echo "RECOMENDADO: ejecuta ./backup-db.sh antes de continuar."
echo ""
echo "Escribe RESET-MI-SAN para continuar:"
read -r CONFIRMACION

if [ "$CONFIRMACION" != "RESET-MI-SAN" ]; then
  echo "Factory reset cancelado."
  exit 0
fi

docker compose \
  -f "$COMPOSE_FILE" \
  --env-file "$ENV_FILE" \
  exec -T postgres \
  psql \
    -v ON_ERROR_STOP=1 \
    -U "$POSTGRES_USER_VALUE" \
    -d "$POSTGRES_DB_VALUE" <<'SQL'

BEGIN;

DO $$
DECLARE
  tablas_a_vaciar text;
BEGIN
  SELECT string_agg(
           format('%I.%I', schemaname, tablename),
           ', ' ORDER BY tablename
         )
    INTO tablas_a_vaciar
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename NOT IN (
      'Usuario',
      'Plan',
      'UsuarioPlan',
      'ConfiguracionGlobal',
      'AuditoriaMonetizacion',
      '_prisma_migrations',
      'typeorm_metadata',
      'spatial_ref_sys'
    );

  IF tablas_a_vaciar IS NULL THEN
    RAISE NOTICE 'No existen tablas operativas para vaciar.';
  ELSE
    RAISE NOTICE 'Tablas que seran vaciadas: %', tablas_a_vaciar;

    EXECUTE
      'TRUNCATE TABLE ' ||
      tablas_a_vaciar ||
      ' RESTART IDENTITY';
  END IF;
END
$$;

COMMIT;

SQL

echo ""
echo "Factory reset completado correctamente."
echo "Usuarios, roles globales, planes, suscripciones y configuracion base se conservaron."
