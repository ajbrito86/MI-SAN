# 01 - Planes, Roles y Monetización - MI-SAN

## Objetivo

Definir la arquitectura de autorización y monetización que permitirá diferenciar usuarios gratuitos y premium.

La filosofía principal es:

**El backend siempre será la fuente de la verdad.**

La aplicación móvil únicamente consumirá permisos calculados por el backend.

---

# Roles del sistema

## ADMIN

Responsabilidades:

- Administración completa.
- Soporte.
- Gestión global.
- Acceso a panel administrativo.

Cantidad esperada:

Muy pocos usuarios.

---

## USUARIO

Responsabilidades:

- Crear y participar en SANes.
- Administrar sus propias SANes.
- Invitar miembros.
- Registrar pagos.

Todos los usuarios normales tendrán este rol.

---

# Tabla Rol

```sql
Role
-----
id UUID PK
nombre VARCHAR(50) UNIQUE
descripcion VARCHAR(255)
isActive BIT
createdAt DATETIME
updatedAt DATETIME
```

Valores iniciales:

- ADMIN
- USUARIO

---

# Tabla Plan

```sql
Plan
----
id UUID PK
codigo VARCHAR(50) UNIQUE
nombre VARCHAR(100)
descripcion VARCHAR(255)

precio DECIMAL(10,2)

duracionDias INT NULL

permiteAds BIT

isPagoUnico BIT

isActive BIT

createdAt DATETIME
updatedAt DATETIME
```

Planes iniciales:

## GRATIS_TRIAL

- Precio: 0
- Duración: 45 días
- Permite anuncios: NO

## GRATIS_ADS

- Precio: 0
- Sin vencimiento
- Permite anuncios: SÍ

## PREMIUM_SIN_ADS

- Precio: 0.99 USD
- Pago único
- Sin anuncios

---

# Tabla UsuarioPlan

```sql
UsuarioPlan
------------

id UUID PK

usuarioId UUID FK

planId UUID FK

fechaInicio DATETIME

fechaFin DATETIME NULL

estado VARCHAR(30)

plataformaCompra VARCHAR(30)

transaccionExternaId VARCHAR(255) NULL

esTrial BIT

isActive BIT

createdAt DATETIME
updatedAt DATETIME
```

Estados posibles:

- ACTIVO
- EXPIRADO
- CANCELADO
- REEMBOLSADO

Plataformas:

- GOOGLE_PLAY
- APP_STORE
- MANUAL

---

# Reglas de negocio

## Regla 1

Todo usuario nuevo recibe automáticamente:

GRATIS_TRIAL

Duración:

45 días.

---

## Regla 2

Cuando finalice el Trial:

El sistema automáticamente debe:

1. Expirar el Trial.
2. Crear GRATIS_ADS.
3. Activarlo.

---

## Regla 3

Si el usuario compra Premium:

1. Finalizar plan anterior.
2. Crear PREMIUM_SIN_ADS.
3. Activarlo.

---

## Regla 4

Un usuario solamente puede tener un plan activo simultáneamente.

---

# Servicio Backend sugerido

```typescript
SubscriptionService
```

Métodos sugeridos:

```typescript
asignarTrialInicial()

obtenerPlanActivo()

validarAccesoPremium()

mostrarAds()

expirarTrials()

comprarPremium()

restaurarCompras()
```

---

# Información enviada al Frontend

Endpoint:

```http
GET /usuarios/me
```

Respuesta sugerida:

```json
{
  "id": "...",
  "nombre": "Amado",

  "rol": "USUARIO",

  "suscripcion": {
    "plan": "GRATIS_TRIAL",
    "premium": true,
    "mostrarAds": false,
    "fechaFin": "2026-08-20",
    "diasRestantes": 23
  }
}
```

---

# Lógica Frontend

```typescript
if (usuario.suscripcion.mostrarAds) {
  renderizarAds();
}
```

```typescript
if (usuario.suscripcion.premium) {
  ocultarBotonUpgrade();
}
```

---

# Jobs automáticos

Crear cron diario:

```typescript
@Cron('0 0 * * *')
```

Responsabilidades:

- Buscar trials vencidos.
- Expirar trials.
- Activar GRATIS_ADS.

---

# Integración futura

Google Play Billing.

Apple In-App Purchases.

Toda compra debe validarse desde backend.

Nunca confiar únicamente en la respuesta del dispositivo.

---

# Decisiones arquitectónicas aprobadas

✅ Trial Premium de 45 días.

✅ Plan gratuito con anuncios.

✅ Premium de pago único US$0.99.

✅ Backend como fuente de verdad.

✅ Un solo plan activo por usuario.
