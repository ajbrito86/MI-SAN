# Backup/Restore Basico MI-SAN

## Objetivo

Tener un procedimiento minimo para respaldar y restaurar la base PostgreSQL antes del primer deploy.

## Backup Manual

Desde el VPS o una maquina con acceso a la base:

```bash
pg_dump "$DATABASE_URL" --format=custom --file="misan-$(date +%Y%m%d-%H%M%S).dump"
```

Si se usa Docker Compose:

```bash
docker exec mi-san-postgres pg_dump -U misan -d misan --format=custom --file=/tmp/misan.dump
docker cp mi-san-postgres:/tmp/misan.dump ./misan.dump
```

## Restore Manual

Restaurar sobre una base vacia:

```bash
pg_restore --dbname "$DATABASE_URL" --clean --if-exists ./misan.dump
```

Si se usa Docker Compose:

```bash
docker cp ./misan.dump mi-san-postgres:/tmp/misan.dump
docker exec mi-san-postgres pg_restore -U misan -d misan --clean --if-exists /tmp/misan.dump
```

## Reglas Operativas

- Generar backup antes de ejecutar migraciones en produccion.
- Guardar al menos una copia fuera del VPS.
- Probar restore en staging antes de usarlo en produccion.
- No guardar dumps con datos reales dentro del repositorio.

