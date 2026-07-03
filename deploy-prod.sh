#!/usr/bin/env sh
set -eu

COMPOSE_FILE="compose.production.yml"
ENV_FILE="apps/api/.env.production"
HEALTH_URL="${HEALTH_URL:-http://localhost:3000/health}"

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

require_file() {
  [ -f "$1" ] || fail "Falta $1"
}

validate_env() {
  require_file "$ENV_FILE"

  grep -q '^DATABASE_URL=' "$ENV_FILE" || fail "DATABASE_URL no esta configurado en $ENV_FILE"
  grep -q '^JWT_ACCESS_SECRET=' "$ENV_FILE" || fail "JWT_ACCESS_SECRET no esta configurado en $ENV_FILE"
  grep -q '^JWT_REFRESH_SECRET=' "$ENV_FILE" || fail "JWT_REFRESH_SECRET no esta configurado en $ENV_FILE"
  grep -q '^POSTGRES_PASSWORD=' "$ENV_FILE" || fail "POSTGRES_PASSWORD no esta configurado en $ENV_FILE"

  if grep -E 'replace_with|change_me|password_here|secret_here' "$ENV_FILE" >/dev/null; then
    fail "$ENV_FILE contiene placeholders. Edita variables reales antes de desplegar."
  fi
}

wait_for_health() {
  attempts=30
  while [ "$attempts" -gt 0 ]; do
    if command -v curl >/dev/null 2>&1; then
      if curl -fsS "$HEALTH_URL" >/dev/null; then
        echo "Health OK: $HEALTH_URL"
        return 0
      fi
    elif command -v wget >/dev/null 2>&1; then
      if wget -qO- "$HEALTH_URL" >/dev/null; then
        echo "Health OK: $HEALTH_URL"
        return 0
      fi
    else
      fail "Instala curl o wget para validar /health"
    fi

    attempts=$((attempts - 1))
    sleep 3
  done

  fail "La API no respondio en $HEALTH_URL"
}

require_file "$COMPOSE_FILE"
validate_env

git pull origin develop

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api npm run prisma:migrate:deploy

if grep -q '^RUN_SEED=true$' "$ENV_FILE"; then
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T api npm run prisma:seed
else
  echo "Seed omitido. Define RUN_SEED=true en $ENV_FILE si aplica."
fi

wait_for_health

echo "Deploy production MI-SAN completado."

