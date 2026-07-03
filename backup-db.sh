#!/usr/bin/env sh
set -eu

COMPOSE_FILE="compose.production.yml"
ENV_FILE="apps/api/.env.production"
BACKUP_DIR="manual-backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="$BACKUP_DIR/mi-san-backup-$TIMESTAMP.sql.gz"

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

mkdir -p "$BACKUP_DIR"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER_VALUE" -d "$POSTGRES_DB_VALUE" --no-owner --no-privileges |
  gzip > "$BACKUP_FILE"

echo "Backup creado: $BACKUP_FILE"
