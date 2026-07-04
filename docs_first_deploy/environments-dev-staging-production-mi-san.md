# Entornos MI-SAN

## Desarrollo

Uso:

- Desarrollo local.
- Emulador Android.
- Expo local.
- Docker Compose local.

API movil por defecto:

```text
Android emulator: http://10.0.2.2:3000/api
iOS/Web local: http://localhost:3000/api
```

Permitido:

- HTTP local.
- AdMob test IDs.
- Codigo de recuperacion visible en respuesta.

## Staging

Uso:

- Pruebas internas.
- QA previo a tiendas.
- Validacion con dominio real.

Requerido:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.mi-san.kingdom-devs.net/api
NODE_ENV=production
CORS_ORIGIN=https://mi-san.kingdom-devs.net
```

Reglas:

- HTTPS obligatorio.
- Base de datos separada.
- Secrets JWT reales.
- Puede usar AdMob test IDs solo si no se publica en tiendas.

## Produccion

Uso:

- Builds enviados a Google Play / App Store.
- Usuarios reales.

Requerido:

```bash
EXPO_PUBLIC_API_BASE_URL=https://api.mi-san.kingdom-devs.net/api
NODE_ENV=production
CORS_ORIGIN=https://mi-san.kingdom-devs.net
```

Reglas:

- HTTPS obligatorio.
- No localhost.
- No IP privada.
- No `http://`.
- No AdMob test IDs.
- No placeholders en Unit IDs.
- Secrets JWT de al menos 32 caracteres.
- Migraciones aplicadas.
- Cuenta demo creada.

## Preflight

Normal:

```bash
npm run release:preflight
```

Estricto produccion:

```bash
$env:NODE_ENV='production'; npm run release:preflight
```

El preflight estricto debe quedar en 0 errores antes de generar builds comerciales.
