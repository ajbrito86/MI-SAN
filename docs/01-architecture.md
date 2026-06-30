# Arquitectura - Mi-San

## Stack Tecnológico Oficial

### Frontend Mobile

- React Native
- Expo
- TypeScript
- Expo Router
- NativeWind (Tailwind para React Native)

### Gestión de Estado

- TanStack Query para estado remoto.
- Zustand para estado global local.

### Formularios

- React Hook Form
- Zod

### Backend

- NestJS
- Prisma ORM
- PostgreSQL

## Autenticación

La aplicación utilizará autenticación basada en JWT.

Flujo:

1. Usuario inicia sesión.
2. API genera Access Token y Refresh Token.
3. El Access Token se enviará en cada request.
4. El Refresh Token permitirá renovar la sesión.

## Notificaciones Push

Se utilizará:

- Expo Notifications.

Casos:

- Recordatorio de pago.
- Confirmación de pago.
- Pago rechazado.
- Próximo beneficiario.
- Invitaciones a sociedades.

## Almacenamiento de Archivos

Se utilizará Cloudflare R2 para almacenar:

- Fotos de perfil.
- Comprobantes de depósito.
- Evidencias.

## Infraestructura

Despliegue inicial:

- VPS Hetzner.
- Docker.
- Docker Compose.
- Nginx Proxy Manager.

## Arquitectura General

React Native App
↓
API NestJS
↓
Prisma ORM
↓
PostgreSQL

Servicios complementarios:

Cloudflare R2
Expo Push Service

## Estructura del Backend

/src

- auth
- users
- societies
- cycles
- participants
- payments
- notifications
- uploads
- reports
- common

Cada módulo deberá seguir arquitectura limpia:

- controller
- service
- dto
- entity/model
- repository
- mapper
- tests

## Principios Arquitectónicos

- Mobile First.
- Escalable.
- Modular.
- Mantenible.
- API REST.
- Código fuertemente tipado.
- Validación en frontend y backend.
