# Release 0.1.0 - Mi-San

## Alcance

MVP simple y estable para administrar un SAN sin custodia de dinero.

Incluye:

- Registro/login.
- Roles globales organizador/participante.
- Creacion y edicion de sociedades antes de iniciar.
- Invitaciones.
- Ciclos.
- Turnos manuales y aleatorios.
- Cuotas por participante.
- Reporte de pagos efectivo/deposito/transferencia.
- Evidencias de pago.
- Confirmacion y rechazo con motivo.
- Entregas por turno con monto real.
- Cierre de sociedad con cancelacion de operaciones no completadas.
- Chat privado por SAN en modo lectura cuando el SAN esta cerrado.
- Notificaciones visibles.
- Resumen inicial y resumen por sociedad.
- Docker Compose con Postgres y API.

## Pendiente Para Validacion Manual

Quedan a cargo del usuario antes de marcar la version como lista:

- Flujo feliz completo.
- Casos borde.
- Seed/demo confiable con datos de prueba frescos.

## Checklist Tecnica Ejecutada

- `npm run api:build`
- `npx tsc -p apps\mobile\tsconfig.json --noEmit`
- `docker compose up -d --build api`
- `GET http://localhost:3000/api/salud`
- Migraciones Prisma aplicadas en la base local.

## Comportamientos Clave

- Un SAN cerrado queda solo consulta.
- Pagos no confirmados de un SAN cerrado pasan a `CANCELADO`.
- Turnos no entregados de un SAN cerrado pasan a `CANCELADO`.
- Ciclos con operaciones canceladas pasan a `CANCELADO`.
- El chat de un SAN cerrado permite ver historico, pero no enviar mensajes.
- Nuevos invitados no pueden entrar despues de iniciado/cerrado un SAN.

## Tag

Tag esperado al terminar esta corrida:

```bash
v0.1.0
```
