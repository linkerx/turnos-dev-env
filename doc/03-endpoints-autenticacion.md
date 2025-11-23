# Endpoints de Autenticación

## Índice
- [Descripción General](#descripción-general)
- [POST /auth/register](#post-authregister)
- [POST /auth/login](#post-authlogin)
- [Autenticación con Keycloak](#autenticación-con-keycloak)

## Descripción General

Los endpoints de autenticación permiten registrar nuevos usuarios y gestores, así como autenticarse para obtener tokens de acceso.

**Base URL**: `/api/auth`

**Características:**
- ✅ Endpoints públicos (no requieren autenticación)
- ✅ Soporta registro de usuarios y gestores
- ✅ Contraseñas hasheadas con bcrypt
- ✅ Retorna JWT token para autenticación local

**Nota**: En producción, se recomienda usar Keycloak para autenticación en lugar de estos endpoints locales.

## POST /auth/register

Registra un nuevo usuario o gestor en el sistema.

### Información del Endpoint

| Método | Ruta | Autenticación | Permisos |
|--------|------|---------------|----------|
| POST | `/api/auth/register` | No requerida | Público |

### Request

**Headers:**
```
Content-Type: application/json
```

**Body (RegisterDto):**

```typescript
{
  email: string;         // Email único (obligatorio)
  password: string;      // Contraseña (mínimo 6 caracteres)
  nombre: string;        // Nombre completo (obligatorio)
  telefono?: string;     // Teléfono (opcional)
  role: 'user' | 'gestor'; // Tipo de cuenta (obligatorio)
}
```

**Validaciones:**
- `email`: Debe ser un email válido y único en el sistema
- `password`: Mínimo 6 caracteres
- `nombre`: No puede estar vacío
- `role`: Solo puede ser `'user'` o `'gestor'`
- `telefono`: Opcional

**Ejemplo de Request:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "securePassword123",
    "nombre": "Dr. Juan Pérez",
    "telefono": "+54 11 1234-5678",
    "role": "gestor"
  }'
```

### Response

**Status Code**: `201 Created`

**Body:**

```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "email": "doctor@hospital.com",
  "nombre": "Dr. Juan Pérez",
  "role": "gestor"
}
```

**Campos del Response:**
- `id`: UUID único del usuario/gestor
- `email`: Email registrado
- `nombre`: Nombre completo
- `role`: Tipo de cuenta ('user' o 'gestor')

### Errores

#### Email Duplicado (409 Conflict)

```json
{
  "statusCode": 409,
  "message": "Email ya está registrado",
  "error": "Conflict"
}
```

#### Validación de Campos (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters",
    "role must be one of the following values: user, gestor"
  ],
  "error": "Bad Request"
}
```

### Lógica de Negocio

1. **Validación de datos**: Verifica que el email sea válido y la contraseña tenga mínimo 6 caracteres
2. **Verificación de unicidad**: Comprueba que el email no esté registrado
3. **Hash de contraseña**: Usa bcrypt con 10 salt rounds
4. **Creación según rol**:
   - Si `role === 'user'`: crea en tabla `users`
   - Si `role === 'gestor'`: crea en tabla `gestores`
5. **Retorno de datos**: Retorna el usuario sin la contraseña

### Notas Importantes

- ⚠️ **La contraseña nunca se retorna** en ninguna respuesta
- ⚠️ **No asigna rol de RBAC automáticamente**: El usuario se crea sin role_id. Un administrador debe asignar el rol posteriormente usando `/api/rbac/users/:id/role` o `/api/rbac/gestores/:id/role`
- ✅ **Contraseña segura**: Se hashea con bcrypt (no se almacena en texto plano)
- ✅ **Email único**: Se valida a nivel de base de datos y aplicación

### Ejemplo Completo

```bash
# 1. Registrar gestor
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "medico1@hospital.com",
    "password": "password123",
    "nombre": "Dr. Carlos Gómez",
    "telefono": "+54 11 5555-1234",
    "role": "gestor"
  }'

# Response:
# {
#   "id": "uuid-gestor-123",
#   "email": "medico1@hospital.com",
#   "nombre": "Dr. Carlos Gómez",
#   "role": "gestor"
# }

# 2. Ahora un admin debe asignar el rol RBAC
# (Ver documentación de RBAC)
```

---

## POST /auth/login

Autentica un usuario o gestor con email y contraseña, retornando un JWT token.

### Información del Endpoint

| Método | Ruta | Autenticación | Permisos |
|--------|------|---------------|----------|
| POST | `/api/auth/login` | No requerida | Público |

### Request

**Headers:**
```
Content-Type: application/json
```

**Body (LoginDto):**

```typescript
{
  email: string;         // Email del usuario (obligatorio)
  password: string;      // Contraseña (obligatorio)
}
```

**Ejemplo de Request:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "securePassword123"
  }'
```

### Response

**Status Code**: `200 OK`

**Body:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMWIyYzNkNC01Njc4LTkwYWItY2RlZi0xMjM0NTY3ODkwYWIiLCJlbWFpbCI6ImRvY3RvckBob3NwaXRhbC5jb20iLCJyb2xlIjoiZ2VzdG9yIiwiaWF0IjoxNjk5OTk2NDAwLCJleHAiOjE3MDA2MDEyMDB9.signature",
  "user": {
    "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    "email": "doctor@hospital.com",
    "nombre": "Dr. Juan Pérez",
    "role": "gestor"
  }
}
```

**Campos del Response:**
- `accessToken`: JWT token para autenticación (expira en 7 días por defecto)
- `user.id`: UUID del usuario/gestor
- `user.email`: Email
- `user.nombre`: Nombre completo
- `user.role`: Tipo de cuenta ('user' o 'gestor')

### Uso del Token

Una vez obtenido el token, debe incluirse en todas las peticiones que requieran autenticación:

```bash
curl http://localhost:3000/api/turnos/my-turnos \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Errores

#### Credenciales Inválidas (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

**Causas posibles:**
- Email no existe en el sistema
- Contraseña incorrecta
- Usuario no encontrado en la tabla correspondiente

#### Validación de Campos (400 Bad Request)

```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password should not be empty"
  ],
  "error": "Bad Request"
}
```

### Lógica de Negocio

1. **Búsqueda de usuario**:
   - Primero busca en tabla `users` por email
   - Si no encuentra, busca en tabla `gestores` por email
2. **Verificación de contraseña**: Usa bcrypt para comparar
3. **Generación de JWT**: Si es válido, genera token con payload:
   ```javascript
   {
     sub: user.id,           // ID del usuario/gestor
     email: user.email,      // Email
     role: 'user' | 'gestor' // Tipo de cuenta
   }
   ```
4. **Retorno**: Token + datos del usuario

### Configuración del Token

**Variables de entorno:**
- `JWT_SECRET`: Secreto para firmar tokens (cambiar en producción)
- `JWT_EXPIRES_IN`: Tiempo de expiración (default: '7d')

**Algoritmo**: HS256 (HMAC SHA-256)

### Ejemplo Completo

```bash
# 1. Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hospital.com",
    "password": "securePassword123"
  }')

echo $LOGIN_RESPONSE
# {
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": "uuid-123", "email": "doctor@hospital.com", ... }
# }

# 2. Extraer token
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken')

# 3. Usar en requests
curl http://localhost:3000/api/espacios/gestor/my-calendar \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Diferencia con Keycloak

| Aspecto | JWT Local | Keycloak |
|---------|-----------|----------|
| **Algoritmo** | HS256 (simétrico) | RS256 (asimétrico) |
| **Emisor** | La API misma | Servidor Keycloak |
| **Validación** | Secret local | JWKS (claves públicas) |
| **SSO** | ❌ No soportado | ✅ Soportado |
| **Federación** | ❌ No soportado | ✅ LDAP, AD, OAuth |
| **Producción** | ❌ No recomendado | ✅ Recomendado |
| **Desarrollo** | ✅ Conveniente | ⚠️ Requiere setup |

---

## Autenticación con Keycloak

### Flujo Completo

```bash
# 1. Obtener token de Keycloak
curl -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_KEYCLOAK_CLIENT_SECRET" \
  -d "username=doctor@hospital.com" \
  -d "password=securePassword123" \
  -d "grant_type=password"

# Response:
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expires_in": 300,
#   "refresh_expires_in": 1800,
#   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "Bearer",
#   "not-before-policy": 0,
#   "session_state": "uuid-session",
#   "scope": "profile email"
# }

# 2. Usar el access_token en la API
curl http://localhost:3000/api/agendas \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Renovar Token (Refresh)

```bash
curl -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_KEYCLOAK_CLIENT_SECRET" \
  -d "refresh_token=YOUR_REFRESH_TOKEN" \
  -d "grant_type=refresh_token"
```

### Logout de Keycloak

```bash
curl -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/logout \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_KEYCLOAK_CLIENT_SECRET" \
  -d "refresh_token=YOUR_REFRESH_TOKEN"
```

### Vinculación con Usuario Local

**Primera autenticación con Keycloak:**

1. Usuario se autentica en Keycloak
2. Frontend envía access_token a la API
3. API valida token con JWKS de Keycloak
4. API busca usuario por email en BD local
5. API guarda `keycloakId` del usuario
6. Futuras autenticaciones usan `keycloakId`

**Pre-requisito**: El usuario debe existir en la BD local con el mismo email que en Keycloak.

---

## Recomendaciones

### Para Desarrollo

✅ Usar `/auth/register` y `/auth/login` por conveniencia

```bash
# Setup rápido
npm run seed:rbac
# Registrar usuario de prueba
curl -X POST http://localhost:3000/api/auth/register -d '...'
# Login
curl -X POST http://localhost:3000/api/auth/login -d '...'
```

### Para Producción

✅ Usar Keycloak para autenticación

**Beneficios:**
- Single Sign-On (SSO)
- Integración con LDAP/Active Directory
- MFA (Multi-Factor Authentication)
- Auditoría centralizada
- Gestión de usuarios más robusta

**Setup:**
1. Desplegar Keycloak
2. Configurar realm y client
3. Crear usuarios en Keycloak
4. Registrar usuarios localmente (o sincronizar)
5. Usuarios se autentican en Keycloak
6. API valida tokens de Keycloak

---

## Seguridad

### Contraseñas

- ✅ Hasheadas con bcrypt (10 salt rounds)
- ✅ Nunca se retornan en responses
- ✅ Validación de longitud mínima

### Tokens JWT

- ✅ Firmados con secret seguro (cambiar en producción)
- ✅ Expiran después de 7 días (configurable)
- ✅ Solo se envían en headers (no en query params)

### Mejores Prácticas

1. **Cambiar JWT_SECRET en producción**: Usar secreto largo y aleatorio
2. **Usar HTTPS**: Para proteger tokens en tránsito
3. **Implementar rate limiting**: Prevenir ataques de fuerza bruta
4. **No almacenar tokens en localStorage**: Usar httpOnly cookies
5. **Rotar tokens regularmente**: Implementar refresh tokens
6. **Logging de intentos fallidos**: Detectar intentos de acceso no autorizados

---

[← Anterior: Roles y Permisos](./02-roles-permisos.md) | [Volver al índice](./README.md) | [Siguiente: Endpoints RBAC →](./04-endpoints-rbac.md)
