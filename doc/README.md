# Documentación API de Turnos

Bienvenido a la documentación completa del sistema de gestión de turnos.

## Índice de Documentación

### 1. Introducción al Sistema
- [Autenticación y Autorización](./01-autenticacion.md) - Sistema de autenticación con Keycloak y RBAC local
- [Roles y Permisos](./02-roles-permisos.md) - Explicación detallada de los 3 roles y 20+ permisos

### 2. Endpoints por Módulo

- [Endpoints de Autenticación](./03-endpoints-autenticacion.md) - Registro y login (Público)
- [Endpoints de RBAC](./04-endpoints-rbac.md) - Gestión de roles y permisos (Solo Administrador)
- [Endpoints de Agendas](./05-endpoints-agendas.md) - Gestión de agendas compartidas (Administrador y Gestor)
- [Endpoints de Espacios](./06-endpoints-espacios.md) - Gestión de slots de tiempo (Administrador y Gestor)
- [Endpoints de Turnos](./07-endpoints-turnos.md) - Reserva y gestión de citas (Usuario y Gestor)
- [Endpoints de Grupos](./08-endpoints-grupos.md) - Gestión de grupos de gestores (Solo Administrador)

### 3. Guías de Uso

- [Ejemplos de Uso](./09-ejemplos-uso.md) - Flujos completos de casos de uso comunes

## Resumen del Sistema

**Turnos API** es un sistema de gestión de citas/turnos que permite:

- 🔐 **Autenticación Enterprise**: Integración con Keycloak para SSO y gestión centralizada de usuarios
- 👥 **Control de Acceso Granular**: Sistema RBAC local con 3 roles (Administrador, Gestor, Usuario) y 20+ permisos
- 📅 **Gestión de Agendas**: Agendas compartidas donde múltiples gestores pueden crear espacios de tiempo
- ⏰ **Espacios Individuales y Grupales**: Slots de tiempo con prevención de solapamientos
- 📝 **Reserva de Turnos**: Los usuarios pueden reservar citas en los espacios disponibles
- 👨‍💼 **Grupos de Gestores**: Agrupación de gestores para espacios compartidos
- 📊 **Auditoría Completa**: Todos los cambios son rastreados con timestamps

## Arquitectura Técnica

- **Framework**: NestJS con TypeScript
- **Base de Datos**: PostgreSQL con TypeORM
- **Autenticación**: Keycloak (JWT con RS256 y JWKS)
- **Autorización**: RBAC local almacenado en BD
- **API Docs**: Swagger disponible en `/api/docs`

## Roles Principales

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| **Administrador** | Control total del sistema | Todos (20+ permisos) |
| **Gestor** | Gestiona agendas y espacios | 8 permisos |
| **Usuario** | Reserva turnos | 5 permisos |

## Quick Start

### 1. Acceso a la API

```
Base URL: http://localhost:3000/api
Swagger Docs: http://localhost:3000/api/docs
```

### 2. Autenticación

La API soporta dos métodos de autenticación:

**a) Keycloak (Recomendado para producción)**
```bash
# 1. Autenticar en Keycloak
curl -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_SECRET" \
  -d "username=user@example.com" \
  -d "password=password" \
  -d "grant_type=password"

# 2. Usar el access_token en las peticiones
curl http://localhost:3000/api/agendas \
  -H "Authorization: Bearer YOUR_KEYCLOAK_TOKEN"
```

**b) JWT Local (Desarrollo)**
```bash
# 1. Login local
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 2. Usar el accessToken
curl http://localhost:3000/api/turnos/my-turnos \
  -H "Authorization: Bearer YOUR_LOCAL_JWT"
```

### 3. Endpoints Principales por Rol

**Usuario**
- `GET /api/agendas` - Ver agendas disponibles
- `GET /api/espacios/available/:agendaId` - Ver espacios disponibles
- `POST /api/turnos` - Reservar un turno
- `GET /api/turnos/my-turnos` - Ver mis turnos

**Gestor**
- `POST /api/agendas` - Crear agenda
- `POST /api/espacios` - Crear espacios de tiempo
- `GET /api/espacios/gestor/my-calendar` - Ver mi calendario
- `GET /api/turnos/gestor/my-turnos` - Ver turnos en mis espacios
- `PATCH /api/turnos/:id/confirm` - Confirmar turno

**Administrador**
- Todos los endpoints de Usuario y Gestor
- `POST /api/rbac/roles` - Crear roles
- `POST /api/rbac/permissions` - Crear permisos
- `POST /api/grupos` - Crear grupos de gestores
- `POST /api/agendas/:id/gestores/:gestorId` - Asignar gestores a agendas

## Flujo Típico de Uso

### Como Usuario (Reservar un turno)
1. Login → Obtener token
2. `GET /api/agendas` → Ver agendas disponibles
3. `GET /api/espacios/available/:agendaId` → Ver espacios disponibles
4. `POST /api/turnos` → Reservar turno
5. `GET /api/turnos/my-turnos` → Verificar reserva

### Como Gestor (Crear disponibilidad)
1. Login → Obtener token
2. `POST /api/agendas` → Crear agenda
3. `POST /api/espacios` → Crear espacios de tiempo
4. `GET /api/turnos/gestor/my-turnos` → Ver turnos reservados
5. `PATCH /api/turnos/:id/confirm` → Confirmar turnos

### Como Administrador (Configurar el sistema)
1. Login → Obtener token
2. `POST /api/rbac/roles` → Crear roles personalizados
3. `POST /api/grupos` → Crear grupos de gestores
4. `POST /api/agendas` → Crear agendas
5. `POST /api/agendas/:id/gestores/:gestorId` → Asignar gestores

## Variables de Entorno

```bash
# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=turnos-realm
KEYCLOAK_CLIENT_ID=turnos-api
KEYCLOAK_CLIENT_SECRET=your-secret

# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=turnos_db
DB_SYNC=true
DB_LOGGING=false

# JWT Local
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# API
API_PORT=3000
```

## Inicialización del Sistema

### 1. Ejecutar Seed de RBAC

```bash
npm run seed:rbac
```

Esto creará:
- 3 roles predefinidos (administrator, gestor, user)
- 20+ permisos del sistema
- Asignación de permisos a roles

### 2. Crear Usuario Administrador

```bash
# Opción A: Registro local
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securePassword123",
    "nombre": "Administrador del Sistema",
    "telefono": "+1234567890",
    "role": "gestor"
  }'

# Opción B: Crear en Keycloak (recomendado)
# Usar la consola de Keycloak para crear el usuario y asignar roles
```

### 3. Asignar Rol de Administrador

```bash
# Primero obtener el ID del rol "administrator"
curl http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Asignar rol al gestor
curl -X POST http://localhost:3000/api/rbac/gestores/GESTOR_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roleId": "ADMINISTRATOR_ROLE_ID"}'
```

## Códigos de Estado HTTP

La API utiliza códigos de estado HTTP estándar:

- `200 OK` - Solicitud exitosa
- `201 Created` - Recurso creado exitosamente
- `400 Bad Request` - Error de validación en los datos enviados
- `401 Unauthorized` - Token no válido o ausente
- `403 Forbidden` - Sin permisos para realizar la acción
- `404 Not Found` - Recurso no encontrado
- `409 Conflict` - Conflicto (ej: solapamiento de espacios)
- `500 Internal Server Error` - Error del servidor

## Formato de Errores

```json
{
  "statusCode": 400,
  "message": "Mensaje de error descriptivo",
  "error": "Bad Request"
}
```

Para validación de campos:
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than 6 characters"
  ],
  "error": "Bad Request"
}
```

## Soporte y Contribución

Para reportar problemas o solicitar nuevas funcionalidades, por favor abrir un issue en el repositorio del proyecto.

---

**Última actualización**: 2025-11-23
