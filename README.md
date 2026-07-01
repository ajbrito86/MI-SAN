# Mi-San

Aplicacion movil para administrar sociedades de ahorro tradicionales. El MVP no custodia dinero ni procesa pagos digitales: solo registra sociedades, participantes, turnos, cuotas, comprobantes, entregas, historial, chat privado y avisos.

## Estructura

- `apps/api`: API NestJS con Prisma y PostgreSQL.
- `apps/mobile`: app Expo React Native.
- `packages/shared`: paquete compartido del monorepo.
- `docs`: reglas, fases y notas de release.

## Requisitos

- Node.js 22.
- Docker Desktop.
- Android Studio/emulador o Expo Go.

## Backend con Docker

```bash
npm install
docker compose up -d --build
```

El contenedor del API ejecuta `prisma migrate deploy` al iniciar. No hace falta aplicar migraciones manualmente para el flujo normal con Docker.

Verificar API:

```bash
Invoke-RestMethod -Uri http://localhost:3000/api/salud
```

Puertos:

- API: `http://localhost:3000/api`
- Postgres: `localhost:5432`

## Datos Demo

Para regenerar Prisma Client:

```bash
npm run api:prisma:generate
```

Para cargar usuarios demo:

```bash
npm run api:seed
```

Usuarios de prueba:

- Ana organizadora: `ana.prueba@misan.local` / `ClaveDemo123`
- Luis participante: `luis.demo@misan.local` / `ClaveDemo123`

## Mobile

```bash
npm run mobile:start
```

En Android emulator, la app usa `http://10.0.2.2:3000/api`. En web/iOS local usa `http://localhost:3000/api`.

## Flujo Principal

1. Ana crea un SAN.
2. Ana invita participantes.
3. Luis acepta invitacion.
4. Ana crea ciclo, asigna turnos y lo inicia.
5. Luis reporta cuotas.
6. Si paga en efectivo, no requiere comprobante.
7. Si paga por deposito o transferencia, adjunta comprobante.
8. Ana confirma o rechaza pagos.
9. Ana registra entregas.
10. Al cerrar un SAN, pagos/turnos/ciclos no completados quedan cancelados y solo consultables.

## Comandos Utiles

```bash
npm run api:build
npx tsc -p apps\mobile\tsconfig.json --noEmit
docker compose up -d --build api
docker compose ps
```

## Version

Release objetivo: `v0.1.0`.
