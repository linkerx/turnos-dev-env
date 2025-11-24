# Endpoints de Turnos (Reservas/Citas)

## Índice
- [Descripción General](#descripción-general)
- [POST /turnos](#post-turnos)
- [GET /turnos/my-turnos](#get-turnosmy-turnos)
- [GET /turnos/gestor/my-turnos](#get-turnosgestormy-turnos)
- [GET /turnos/overlapping](#get-turnosoverlapping)
- [GET /turnos/:id](#get-turnosid)
- [PATCH /turnos/:id/confirm](#patch-turnosidconfirm)
- [PATCH /turnos/:id/cancel](#patch-turnosidcancel)
- [PATCH /turnos/:id/complete](#patch-turnosidcomplete)

## Descripción General

Los **Turnos** son reservas de citas que los usuarios hacen en los espacios disponibles. Representan appointments/bookings con un gestor en un horario específico.

**Base URL**: `/api/turnos`

**Autenticación**: JwtAuthGuard (JWT local, no Keycloak)

⚠️ **IMPORTANTE**: Los endpoints de turnos usan JWT local (de `/auth/login`), NO tokens de Keycloak.

**Estados de un Turno:**
```
PENDING (creado)
   ↓
CONFIRMED (confirmado por gestor)
   ↓
COMPLETED (atención completada)

Desde cualquier estado (excepto COMPLETED):
   ↓
CANCELLED (cancelado)
```

**Roles:**
- **Usuario**: Crear, ver propios, cancelar propios
- **Gestor**: Ver turnos en sus espacios, confirmar, cancelar, completar

---

## POST /turnos

Crea un nuevo turno (reserva de cita).

### Información del Endpoint

| Método | Ruta | Autenticación | Rol |
|--------|------|---------------|-----|
| POST | `/api/turnos` | JWT Local | Solo Usuario |

### Request

**Headers:**
```
Authorization: Bearer JWT_LOCAL_TOKEN
Content-Type: application/json
```

**Body (CreateTurnoDto):**
```typescript
{
  espacioId: string;        // UUID del espacio (obligatorio)
  startTime: string;        // ISO 8601 datetime (obligatorio)
  notas?: string;           // Notas/motivo de consulta (opcional)
}
```

**Ejemplo de Request:**
```bash
curl -X POST http://localhost:3000/api/turnos \
  -H "Authorization: Bearer JWT_LOCAL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "espacioId": "uuid-espacio-123",
    "startTime": "2025-01-20T09:30:00.000Z",
    "notas": "Control de rutina"
  }'
```

### Response

**Status Code**: `201 Created`

**Body:**
```json
{
  "id": "uuid-turno-456",
  "espacioId": "uuid-espacio-123",
  "userId": "uuid-user-789",
  "startTime": "2025-01-20T09:30:00.000Z",
  "endTime": "2025-01-20T10:00:00.000Z",
  "status": "pending",
  "notas": "Control de rutina",
  "espacio": {
    "id": "uuid-espacio-123",
    "slotDuration": 30,
    "agenda": {
      "nombre": "Consultorio Cardiología"
    },
    "gestor": {
      "nombre": "Dr. Juan Pérez"
    }
  },
  "user": {
    "id": "uuid-user-789",
    "nombre": "María García",
    "email": "maria@example.com"
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Validaciones

1. **Espacio debe existir y estar activo**
2. **startTime debe estar dentro del rango del espacio:**
   ```
   espacio.startTime <= turno.startTime < espacio.endTime
   ```
3. **No puede haber turno confirmado en el mismo horario:**
   - Puede haber múltiples PENDING, pero solo uno CONFIRMED

**Cálculo de endTime:**
```
endTime = startTime + espacio.slotDuration (en minutos)
```

### Errores

**400 Bad Request** (startTime fuera de rango):
```json
{
  "statusCode": 400,
  "message": "El horario solicitado está fuera del rango del espacio",
  "error": "Bad Request"
}
```

**409 Conflict** (ya hay turno confirmado):
```json
{
  "statusCode": 409,
  "message": "Ya existe un turno confirmado en este horario",
  "error": "Conflict"
}
```

---

## GET /turnos/my-turnos

Obtiene todos los turnos del usuario autenticado.

### Información del Endpoint

| Método | Ruta | Autenticación | Rol |
|--------|------|---------------|-----|
| GET | `/api/turnos/my-turnos` | JWT Local | Solo Usuario |

### Request

**Headers:**
```
Authorization: Bearer JWT_LOCAL_TOKEN
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/turnos/my-turnos \
  -H "Authorization: Bearer JWT_LOCAL_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
[
  {
    "id": "uuid-turno-1",
    "startTime": "2025-01-20T09:30:00.000Z",
    "endTime": "2025-01-20T10:00:00.000Z",
    "status": "confirmed",
    "notas": "Control de rutina",
    "espacio": {
      "agenda": {
        "nombre": "Consultorio Cardiología"
      },
      "gestor": {
        "nombre": "Dr. Juan Pérez",
        "email": "doctor@hospital.com"
      }
    },
    "createdAt": "2025-01-15T10:00:00Z"
  },
  {
    "id": "uuid-turno-2",
    "startTime": "2025-01-25T14:00:00.000Z",
    "endTime": "2025-01-25T14:30:00.000Z",
    "status": "pending",
    "notas": "Consulta por dolor",
    "espacio": {
      "agenda": {
        "nombre": "Consultorio Pediatría"
      },
      "gestor": {
        "nombre": "Dra. María González"
      }
    },
    "createdAt": "2025-01-16T08:00:00Z"
  }
]
```

**Ordenamiento**: Por `startTime` ascendente

---

## GET /turnos/gestor/my-turnos

Obtiene todos los turnos en los espacios del gestor autenticado.

### Información del Endpoint

| Método | Ruta | Autenticación | Rol |
|--------|------|---------------|-----|
| GET | `/api/turnos/gestor/my-turnos` | JWT Local | Solo Gestor |

### Request

**Headers:**
```
Authorization: Bearer JWT_LOCAL_GESTOR_TOKEN
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/turnos/gestor/my-turnos \
  -H "Authorization: Bearer JWT_LOCAL_GESTOR_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
[
  {
    "id": "uuid-turno-1",
    "startTime": "2025-01-20T09:30:00.000Z",
    "endTime": "2025-01-20T10:00:00.000Z",
    "status": "confirmed",
    "notas": "Control de rutina",
    "user": {
      "nombre": "María García",
      "email": "maria@example.com",
      "telefono": "+54 11 1234-5678"
    },
    "espacio": {
      "agenda": {
        "nombre": "Mi Consultorio"
      }
    }
  },
  {
    "id": "uuid-turno-2",
    "startTime": "2025-01-20T10:00:00.000Z",
    "endTime": "2025-01-20T10:30:00.000Z",
    "status": "pending",
    "notas": "Primera consulta",
    "user": {
      "nombre": "Carlos Rodríguez",
      "email": "carlos@example.com"
    }
  }
]
```

**Incluye**: Turnos en todos los espacios del gestor (individuales y grupales)

---

## GET /turnos/overlapping

Busca espacios que contengan un horario específico (helper para verificar disponibilidad).

### Información del Endpoint

| Método | Ruta | Autenticación | Rol |
|--------|------|---------------|-----|
| GET | `/api/turnos/overlapping` | JWT Local | Todos |

### Request

**Headers:**
```
Authorization: Bearer JWT_LOCAL_TOKEN
```

**Query Parameters:**
- `agendaId` (string, UUID): ID de la agenda
- `startTime` (string, ISO 8601): Horario a verificar

**Ejemplo:**
```bash
curl "http://localhost:3000/api/turnos/overlapping?agendaId=uuid-agenda-123&startTime=2025-01-20T10:30:00.000Z" \
  -H "Authorization: Bearer JWT_LOCAL_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
[
  {
    "id": "uuid-espacio-1",
    "startTime": "2025-01-20T09:00:00.000Z",
    "endTime": "2025-01-20T13:00:00.000Z",
    "slotDuration": 30,
    "gestor": {
      "nombre": "Dr. Juan Pérez"
    }
  }
]
```

**Uso**: Frontend puede usarlo para mostrar gestores disponibles en un horario específico.

---

## GET /turnos/:id

Obtiene un turno específico por ID.

### Información del Endpoint

| Método | Ruta | Autenticación | Rol |
|--------|------|---------------|-----|
| GET | `/api/turnos/:id` | JWT Local | Todos |

### Request

**Headers:**
```
Authorization: Bearer JWT_LOCAL_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del turno

**Ejemplo:**
```bash
curl http://localhost:3000/api/turnos/uuid-turno-456 \
  -H "Authorization: Bearer JWT_LOCAL_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-turno-456",
  "espacioId": "uuid-espacio-123",
  "userId": "uuid-user-789",
  "startTime": "2025-01-20T09:30:00.000Z",
  "endTime": "2025-01-20T10:00:00.000Z",
  "status": "confirmed",
  "notas": "Control de rutina",
  "espacio": {
    "agenda": {
      "nombre": "Consultorio Cardiología"
    },
    "gestor": {
      "nombre": "Dr. Juan Pérez",
      "email": "doctor@hospital.com"
    }
  },
  "user": {
    "nombre": "María García",
    "email": "maria@example.com",
    "telefono": "+54 11 1234-5678"
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:05:00Z"
}
```

---

## PATCH /turnos/:id/confirm

Confirma un turno pendiente (solo gestor del espacio).

### Información del Endpoint

| Método | Ruta | Autenticación | Rol |
|--------|------|---------------|-----|
| PATCH | `/api/turnos/:id/confirm` | JWT Local | Solo Gestor |

### Request

**Headers:**
```
Authorization: Bearer JWT_LOCAL_GESTOR_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del turno

**Sin body**

**Ejemplo:**
```bash
curl -X PATCH http://localhost:3000/api/turnos/uuid-turno-456/confirm \
  -H "Authorization: Bearer JWT_LOCAL_GESTOR_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-turno-456",
  "status": "confirmed",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

### Restricciones

1. **Solo el gestor dueño del espacio** puede confirmar
2. **No se puede confirmar si está cancelado**

**Error si no es el gestor del espacio** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "No tienes permiso para confirmar este turno",
  "error": "Forbidden"
}
```

---

## PATCH /turnos/:id/cancel

Cancela un turno.

### Información del Endpoint

| Método | Ruta | Autenticación | Rol |
|--------|------|---------------|-----|
| PATCH | `/api/turnos/:id/cancel` | JWT Local | Usuario o Gestor |

### Request

**Headers:**
```
Authorization: Bearer JWT_LOCAL_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del turno

**Sin body**

**Ejemplo:**
```bash
curl -X PATCH http://localhost:3000/api/turnos/uuid-turno-456/cancel \
  -H "Authorization: Bearer JWT_LOCAL_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-turno-456",
  "status": "cancelled",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

### Permisos

- **Usuarios**: Pueden cancelar sus propios turnos
- **Gestores**: Pueden cancelar turnos en sus espacios

### Restricciones

- **No se puede cancelar un turno completado**

**Error si ya está completado** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "No se puede cancelar un turno completado",
  "error": "Bad Request"
}
```

---

## PATCH /turnos/:id/complete

Marca un turno como completado (solo gestor del espacio).

### Información del Endpoint

| Método | Ruta | Autenticación | Rol |
|--------|------|---------------|-----|
| PATCH | `/api/turnos/:id/complete` | JWT Local | Solo Gestor |

### Request

**Headers:**
```
Authorization: Bearer JWT_LOCAL_GESTOR_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del turno

**Sin body**

**Ejemplo:**
```bash
curl -X PATCH http://localhost:3000/api/turnos/uuid-turno-456/complete \
  -H "Authorization: Bearer JWT_LOCAL_GESTOR_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-turno-456",
  "status": "completed",
  "updatedAt": "2025-01-20T10:30:00Z"
}
```

### Restricciones

1. **Solo el gestor dueño del espacio** puede completar
2. **Solo turnos confirmados** pueden marcarse como completados

**Error si no está confirmado** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Solo se pueden completar turnos confirmados",
  "error": "Bad Request"
}
```

---

## Flujos Completos

### Flujo 1: Usuario Reserva un Turno

```bash
# 1. Login como usuario
USER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@example.com","password":"pass123"}' | jq -r '.accessToken')

# 2. Buscar espacios disponibles
curl "http://localhost:3000/api/espacios/available/uuid-agenda-123?date=2025-01-20" \
  -H "Authorization: Bearer KEYCLOAK_TOKEN"

# 3. Reservar turno
curl -X POST http://localhost:3000/api/turnos \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "espacioId": "uuid-espacio-123",
    "startTime": "2025-01-20T09:30:00Z",
    "notas": "Control anual"
  }'

# 4. Verificar mis turnos
curl http://localhost:3000/api/turnos/my-turnos \
  -H "Authorization: Bearer $USER_TOKEN"
```

### Flujo 2: Gestor Gestiona Turnos

```bash
# 1. Login como gestor
GESTOR_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@hospital.com","password":"pass123"}' | jq -r '.accessToken')

# 2. Ver turnos pendientes y confirmados
curl http://localhost:3000/api/turnos/gestor/my-turnos \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# 3. Confirmar turno pendiente
curl -X PATCH http://localhost:3000/api/turnos/uuid-turno-456/confirm \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# 4. Completar turno después de la atención
curl -X PATCH http://localhost:3000/api/turnos/uuid-turno-456/complete \
  -H "Authorization: Bearer $GESTOR_TOKEN"
```

### Flujo 3: Usuario Cancela un Turno

```bash
USER_TOKEN="..."

# 1. Ver mis turnos
curl http://localhost:3000/api/turnos/my-turnos \
  -H "Authorization: Bearer $USER_TOKEN"

# 2. Cancelar turno que no puedo asistir
curl -X PATCH http://localhost:3000/api/turnos/uuid-turno-456/cancel \
  -H "Authorization: Bearer $USER_TOKEN"

# 3. Verificar cancelación
curl http://localhost:3000/api/turnos/uuid-turno-456 \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

## Estados del Turno

### Diagrama de Estados

```
     ┌─────────┐
     │ PENDING │ ◄─── Creado por usuario
     └────┬────┘
          │
          ├──► CANCELLED (usuario o gestor cancela)
          │
          ▼
    ┌───────────┐
    │ CONFIRMED │ ◄─── Gestor confirma
    └─────┬─────┘
          │
          ├──► CANCELLED (gestor cancela)
          │
          ▼
    ┌───────────┐
    │ COMPLETED │ ◄─── Gestor marca como completado
    └───────────┘      (ESTADO FINAL - no se puede modificar)
```

### Transiciones Permitidas

| Estado Actual | Puede ir a | Quién lo hace |
|---------------|------------|---------------|
| PENDING | CONFIRMED | Gestor (confirm) |
| PENDING | CANCELLED | Usuario o Gestor (cancel) |
| CONFIRMED | COMPLETED | Gestor (complete) |
| CONFIRMED | CANCELLED | Gestor (cancel) |
| CANCELLED | - | No hay transiciones |
| COMPLETED | - | No hay transiciones |

---

## Notas Importantes

### Diferencia de Autenticación

⚠️ **CRÍTICO**: Los endpoints de Turnos usan **JWT local** (de `/auth/login`), NO Keycloak.

```bash
# INCORRECTO (no funcionará)
curl -H "Authorization: Bearer KEYCLOAK_TOKEN" ...

# CORRECTO
curl -H "Authorization: Bearer JWT_LOCAL_TOKEN" ...
```

### Múltiples Turnos Pending

- Pueden existir múltiples turnos PENDING en el mismo horario
- Solo puede haber UN turno CONFIRMED en un horario específico
- Esto permite "lista de espera" implícita

### Relación con Espacios

Un turno siempre pertenece a un espacio:
```
Espacio: 09:00-13:00 (slotDuration: 30min)
  ├── Turno 1: 09:00-09:30 [CONFIRMED]
  ├── Turno 2: 09:30-10:00 [PENDING]
  ├── Turno 3: 10:00-10:30 [CONFIRMED]
  └── ... hasta 12:30-13:00
```

---

[← Anterior: Endpoints de Espacios](./06-endpoints-espacios.md) | [Volver al índice](./README.md) | [Siguiente: Endpoints de Grupos →](./08-endpoints-grupos.md)
