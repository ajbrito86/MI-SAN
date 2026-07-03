#!/usr/bin/env sh
set -eu

COMPOSE_FILE="compose.production.yml"
ENV_FILE="apps/api/.env.production"
BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: ./restore-db.sh manual-backups/mi-san-backup-YYYYMMDD-HHMMSS.sql.gz" >&2
  exit 1
fi

[ -f "$ENV_FILE" ] || {
  echo "ERROR: Falta $ENV_FILE" >&2
  exit 1
}

[ -f "$BACKUP_FILE" ] || {
  echo "ERROR: No existe el backup $BACKUP_FILE" >&2
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

echo "Restaurando $BACKUP_FILE sobre $POSTGRES_DB_VALUE..."
echo "Esta accion reemplaza datos existentes. Escribe RESTAURAR para continuar:"
read -r CONFIRMACION

[ "$CONFIRMACION" = "RESTAURAR" ] || {
  echo "Restore cancelado."
  exit 0
}

gunzip -c "$BACKUP_FILE" |
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
    psql -U "$POSTGRES_USER_VALUE" -d "$POSTGRES_DB_VALUE"

echo "Restore completado."
