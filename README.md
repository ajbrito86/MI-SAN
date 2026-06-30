# Mi-San

Aplicacion movil para administrar sociedades de ahorro tradicionales.

## Estructura

- `apps/api`: API NestJS con Prisma y PostgreSQL.
- `apps/mobile`: app Expo React Native.
- `packages/shared`: enums y contratos compartidos.
- `docs`: reglas del producto y fases de implementacion.

## Desarrollo

```bash
npm install
npm run api:prisma:generate
docker compose up --build
```

Para cargar datos demo:

```bash
npm run api:seed
```

Usuarios de prueba:

- `ana.prueba@misan.local` / `ClaveDemo123`
- `luis.demo@misan.local` / `ClaveDemo123`

## Roles y flujo de pagos

El rol es contextual a cada sociedad:

- Organizador: crea la sociedad, invita participantes, administra ciclos, revisa pagos y ve resumenes.
- Participante: ve sus sociedades, sus turnos y sus cuotas.

Flujo de pago esperado:

1. El participante entra a `Pagos`.
2. Pulsa `Hacer pago` sobre una cuota pendiente, atrasada o rechazada.
3. Elige metodo: efectivo, deposito o transferencia.
4. Si elige efectivo, no se exige comprobante.
5. Si elige deposito o transferencia, debe adjuntar comprobante antes de enviar.
6. El pago queda `REPORTADO` y el organizador recibe una notificacion.
7. El organizador revisa el pago en la sociedad.
8. Si el pago fue en efectivo, puede confirmarlo sin comprobante.
9. Si fue deposito o transferencia, debe existir comprobante para confirmar.
10. El pago pasa a `CONFIRMADO` o `RECHAZADO`, y el participante recibe notificacion.

Para la app movil:

```bash
npm run mobile:start
```

## Puertos

- API: `http://localhost:3000`
- Postgres: `localhost:5432`
