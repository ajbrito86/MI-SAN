# Configuracion Global Operativa MI-SAN

## Endpoint Publico

```http
GET /api/configuracion/mobile
```

La app movil consume este endpoint al iniciar.

## Clave En Base De Datos

Tabla:

```text
ConfiguracionGlobal
```

Clave:

```text
mobile_config
```

## Estructura Base

```json
{
  "mantenimiento": {
    "activo": false,
    "mensaje": "MI-SAN esta en mantenimiento temporal. Intenta nuevamente en unos minutos."
  },
  "version": {
    "versionMinima": "1.0.0",
    "forzarActualizacion": false,
    "mensajeActualizacion": "Hay una nueva version de MI-SAN disponible."
  },
  "featureFlags": {
    "anunciosActivos": true,
    "premiumActivo": true,
    "trialActivo": true,
    "comprasActivas": true
  },
  "monetizacion": {
    "duracionTrialDias": 45,
    "precioPremiumUsd": 4.99,
    "frecuenciaInterstitialMinutos": 10
  },
  "mensajes": {
    "global": null
  }
}
```

## Casos De Uso

### Apagar Anuncios

```json
"featureFlags": {
  "anunciosActivos": false
}
```

### Apagar Compras Premium

```json
"featureFlags": {
  "premiumActivo": false,
  "comprasActivas": false
}
```

### Activar Mantenimiento

```json
"mantenimiento": {
  "activo": true,
  "mensaje": "Estamos actualizando MI-SAN. Volvemos en unos minutos."
}
```

### Forzar Actualizacion

```json
"version": {
  "versionMinima": "1.0.3",
  "forzarActualizacion": true,
  "mensajeActualizacion": "Actualiza MI-SAN para continuar usando la app."
}
```

## Nota

Hasta tener panel administrativo, estos cambios se pueden hacer directamente en la base de datos del VPS.
