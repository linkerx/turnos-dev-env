# Endpoints de Espacios (Time Slots)

## Índice
- [Descripción General](#descripción-general)
- [POST /espacios](#post-espacios)
- [GET /espacios/agenda/:agendaId](#get-espaciosagendaagendaid)
- [GET /espacios/gestor/my-calendar](#get-espaciosgestormy-calendar)
- [GET /espacios/gestor/:gestorId/calendar](#get-espaciosgestorgestoridcalendar)
- [GET /espacios/available/:agendaId](#get-espaciosavailableagendaid)
- [GET /espacios/:id](#get-espaciosid)
- [DELETE /espacios/:id](#delete-espaciosid)

## Descripción General

Los **Espacios** (antes llamados TimeSlots) son bloques de tiempo dentro de una agenda donde los usuarios pueden reservar turnos. Un espacio define:

- **Cuándo**: Fecha y hora de inicio y fin
- **Dónde**: En qué agenda
- **Quién**: Qué gestor(es) lo atienden
- **Duración de turnos**: Cuánto dura cada cita (ej: 30 minutos)

**Base URL**: `/api/espacios`

**Tipos de Espacios:**
1. **Individual**: Creado por un solo gestor
2. **Grupal**: Compartido por todos los gestores de un grupo

**Autenticación**: KeycloakAuthGuard (JWT de Keycloak)

**Roles que usan este módulo:**
- **Administrador**: Todas las operaciones
- **Gestor**: Crear, ver propios, eliminar propios
- **Usuario**: Ver espacios disponibles

---

## POST /espacios

Crea un nuevo espacio de tiempo (individual o grupal).

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| POST | `/api/espacios` | `create_espacio` | Administrador, Gestor |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
Content-Type: application/json
```

**Body (CreateEspacioDto):**
```typescript
{
  agendaId: string;           // UUID de la agenda (obligatorio)
  grupoId?: string;           // UUID del grupo (opcional, para espacios grupales)
  startTime: string;          // ISO 8601 datetime (obligatorio)
  endTime: string;            // ISO 8601 datetime (obligatorio)
  slotDuration: number;       // Duración de cada turno en minutos (obligatorio)
}
```

**Ejemplo de Request (Espacio Individual):**
```bash
curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agendaId": "uuid-agenda-123",
    "startTime": "2025-01-20T09:00:00.000Z",
    "endTime": "2025-01-20T13:00:00.000Z",
    "slotDuration": 30
  }'
```

**Ejemplo de Request (Espacio Grupal):**
```bash
curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agendaId": "uuid-agenda-guardia",
    "grupoId": "uuid-grupo-emergencias",
    "startTime": "2025-01-20T20:00:00.000Z",
    "endTime": "2025-01-21T08:00:00.000Z",
    "slotDuration": 60
  }'
```

### Response

**Status Code**: `201 Created`

**Body:**
```json
{
  "id": "uuid-espacio-789",
  "agendaId": "uuid-agenda-123",
  "gestorId": "uuid-gestor-456",
  "grupoId": null,
  "startTime": "2025-01-20T09:00:00.000Z",
  "endTime": "2025-01-20T13:00:00.000Z",
  "slotDuration": 30,
  "activo": true,
  "agenda": {
    "id": "uuid-agenda-123",
    "nombre": "Consultorio Cardiología"
  },
  "gestor": {
    "id": "uuid-gestor-456",
    "nombre": "Dr. Juan Pérez",
    "email": "doctor@hospital.com"
  },
  "grupo": null,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Validaciones y Lógica de Negocio

#### 1. Validación de Tiempos

- `endTime` debe ser posterior a `startTime`
- `slotDuration` debe ser positivo (> 0)
- Fechas deben ser válidas ISO 8601

#### 2. Validación de Agenda

- El gestor debe estar asignado a la agenda
- La agenda debe existir y estar activa

#### 3. Validación de Grupo (si grupoId está presente)

- El grupo debe existir y estar activo
- El gestor creador debe pertenecer al grupo
- Todos los gestores del grupo deben estar en la agenda

#### 4. Prevención de Solapamientos

**Regla Crítica**: Un gestor no puede tener espacios solapados en diferentes agendas.

**Espacio Individual:**
```
El gestor X no puede tener:
- Espacio en Agenda A: 09:00-13:00
- Espacio en Agenda B: 11:00-15:00  ❌ SOLAPAMIENTO
```

**Espacio Grupal:**
```
Si el grupo tiene gestores [A, B, C]:
Ninguno de ellos puede tener espacios solapados:
- Gestor A tiene espacio: 09:00-13:00
- Espacio grupal 10:00-14:00  ❌ SOLAPAMIENTO (A ya tiene espacio en ese horario)
```

**Error de solapamiento** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "El gestor Juan Pérez ya tiene un espacio que se solapa con este horario en otra agenda",
  "error": "Conflict"
}
```

**Error de solapamiento grupal** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "El gestor María González del grupo ya tiene un espacio que se solapa con este horario",
  "error": "Conflict"
}
```

### Casos de Uso

**Caso 1: Médico define su horario de atención semanal**
```bash
# Lunes 9:00-13:00
POST /api/espacios
{
  "agendaId": "consultorio-dr-perez",
  "startTime": "2025-01-20T09:00:00Z",
  "endTime": "2025-01-20T13:00:00Z",
  "slotDuration": 30  # Turnos de 30 minutos
}

# Lunes 14:00-18:00
POST /api/espacios
{
  "agendaId": "consultorio-dr-perez",
  "startTime": "2025-01-20T14:00:00Z",
  "endTime": "2025-01-20T18:00:00Z",
  "slotDuration": 30
}
```

**Caso 2: Grupo de guardia nocturna**
```bash
# Grupo de 3 médicos comparten guardia 20:00-08:00
POST /api/espacios
{
  "agendaId": "sala-emergencias",
  "grupoId": "grupo-guardia-nocturna",
  "startTime": "2025-01-20T20:00:00Z",
  "endTime": "2025-01-21T08:00:00Z",
  "slotDuration": 60  # Emergencias cada hora
}
```

---

## GET /espacios/agenda/:agendaId

Obtiene todos los espacios activos de una agenda.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/espacios/agenda/:agendaId` | `view_espacios` | Todos |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `agendaId` (string, UUID): ID de la agenda

**Ejemplo de Request:**
```bash
curl http://localhost:3000/api/espacios/agenda/uuid-agenda-123 \
  -H "Authorization: Bearer TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
[
  {
    "id": "uuid-espacio-1",
    "agendaId": "uuid-agenda-123",
    "gestorId": "uuid-gestor-456",
    "grupoId": null,
    "startTime": "2025-01-20T09:00:00.000Z",
    "endTime": "2025-01-20T13:00:00.000Z",
    "slotDuration": 30,
    "activo": true,
    "gestor": {
      "id": "uuid-gestor-456",
      "nombre": "Dr. Juan Pérez"
    },
    "grupo": null
  },
  {
    "id": "uuid-espacio-2",
    "agendaId": "uuid-agenda-123",
    "gestorId": "uuid-gestor-789",
    "grupoId": "uuid-grupo-1",
    "startTime": "2025-01-20T14:00:00.000Z",
    "endTime": "2025-01-20T18:00:00.000Z",
    "slotDuration": 45,
    "activo": true,
    "gestor": {
      "id": "uuid-gestor-789",
      "nombre": "Dra. María González"
    },
    "grupo": {
      "id": "uuid-grupo-1",
      "nombre": "Equipo Pediatría"
    }
  }
]
```

**Ordenamiento**: Por `startTime` ascendente (más próximos primero)

---

## GET /espacios/gestor/my-calendar

Obtiene el calendario completo del gestor autenticado (todos sus espacios en todas las agendas).

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/espacios/gestor/my-calendar` | `view_own_calendar` | Gestor, Administrador |

### Request

**Headers:**
```
Authorization: Bearer GESTOR_KEYCLOAK_TOKEN
```

**Sin parámetros**

**Ejemplo de Request:**
```bash
curl http://localhost:3000/api/espacios/gestor/my-calendar \
  -H "Authorization: Bearer GESTOR_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
[
  {
    "id": "uuid-espacio-1",
    "agendaId": "uuid-agenda-cardiologia",
    "gestorId": "mi-uuid",
    "startTime": "2025-01-20T09:00:00.000Z",
    "endTime": "2025-01-20T13:00:00.000Z",
    "slotDuration": 30,
    "agenda": {
      "id": "uuid-agenda-cardiologia",
      "nombre": "Consultorio Cardiología"
    }
  },
  {
    "id": "uuid-espacio-2",
    "agendaId": "uuid-agenda-emergencias",
    "gestorId": "mi-uuid",
    "grupoId": "uuid-grupo-guardia",
    "startTime": "2025-01-21T20:00:00.000Z",
    "endTime": "2025-01-22T08:00:00.000Z",
    "slotDuration": 60,
    "agenda": {
      "id": "uuid-agenda-emergencias",
      "nombre": "Sala de Emergencias"
    },
    "grupo": {
      "id": "uuid-grupo-guardia",
      "nombre": "Guardia Nocturna"
    }
  }
]
```

**Incluye**:
- Espacios individuales del gestor
- Espacios de grupos donde el gestor pertenece
- Espacios en todas las agendas donde está asignado

**Ordenamiento**: Por `startTime` ascendente

---

## GET /espacios/gestor/:gestorId/calendar

Obtiene el calendario de un gestor específico (solo administrador).

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/espacios/gestor/:gestorId/calendar` | `view_all_calendars` | Solo Administrador |

### Request

**Headers:**
```
Authorization: Bearer ADMIN_KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `gestorId` (string, UUID): ID del gestor

**Ejemplo de Request:**
```bash
curl http://localhost:3000/api/espacios/gestor/uuid-gestor-789/calendar \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Response

Igual que `/espacios/gestor/my-calendar` pero para cualquier gestor.

---

## GET /espacios/available/:agendaId

Obtiene los espacios disponibles (futuros) de una agenda, opcionalmente filtrados por fecha.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/espacios/available/:agendaId` | `view_espacios` | Todos |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `agendaId` (string, UUID): ID de la agenda

**Query Parameters (opcionales):**
- `date` (string): Fecha en formato `YYYY-MM-DD` para filtrar por día específico

**Ejemplo de Request (sin filtro):**
```bash
curl "http://localhost:3000/api/espacios/available/uuid-agenda-123" \
  -H "Authorization: Bearer TOKEN"
```

**Ejemplo de Request (con filtro de fecha):**
```bash
curl "http://localhost:3000/api/espacios/available/uuid-agenda-123?date=2025-01-25" \
  -H "Authorization: Bearer TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
[
  {
    "id": "uuid-espacio-1",
    "agendaId": "uuid-agenda-123",
    "gestorId": "uuid-gestor-456",
    "startTime": "2025-01-25T09:00:00.000Z",
    "endTime": "2025-01-25T13:00:00.000Z",
    "slotDuration": 30,
    "activo": true,
    "gestor": {
      "nombre": "Dr. Juan Pérez"
    }
  },
  {
    "id": "uuid-espacio-2",
    "agendaId": "uuid-agenda-123",
    "gestorId": "uuid-gestor-789",
    "startTime": "2025-01-25T14:00:00.000Z",
    "endTime": "2025-01-25T18:00:00.000Z",
    "slotDuration": 45,
    "activo": true,
    "gestor": {
      "nombre": "Dra. María González"
    }
  }
]
```

**Filtrado**:
- Solo espacios con `startTime` en el futuro
- Solo espacios activos (`activo: true`)
- Si `date` está presente: solo espacios en esa fecha

**Caso de Uso**: Usuarios buscando cuándo pueden reservar un turno.

---

## GET /espacios/:id

Obtiene un espacio específico por ID.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/espacios/:id` | `view_espacios` | Todos |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del espacio

**Ejemplo de Request:**
```bash
curl http://localhost:3000/api/espacios/uuid-espacio-789 \
  -H "Authorization: Bearer TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-espacio-789",
  "agendaId": "uuid-agenda-123",
  "gestorId": "uuid-gestor-456",
  "grupoId": null,
  "startTime": "2025-01-20T09:00:00.000Z",
  "endTime": "2025-01-20T13:00:00.000Z",
  "slotDuration": 30,
  "activo": true,
  "agenda": {
    "id": "uuid-agenda-123",
    "nombre": "Consultorio Cardiología",
    "descripcion": "Consultas cardiológicas"
  },
  "gestor": {
    "id": "uuid-gestor-456",
    "nombre": "Dr. Juan Pérez",
    "email": "doctor@hospital.com"
  },
  "grupo": null,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

## DELETE /espacios/:id

Elimina (desactiva) un espacio.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| DELETE | `/api/espacios/:id` | `delete_espacio` | Gestor (propio), Administrador |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del espacio

**Sin body**

**Ejemplo de Request:**
```bash
curl -X DELETE http://localhost:3000/api/espacios/uuid-espacio-789 \
  -H "Authorization: Bearer GESTOR_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-espacio-789",
  "activo": false,
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

### Restricciones

#### 1. Permisos de Eliminación

**Gestores**: Solo pueden eliminar sus propios espacios
**Administradores**: Pueden eliminar cualquier espacio (con permiso `view_all_calendars`)

**Error si gestor intenta eliminar espacio de otro** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "No tienes permiso para eliminar este espacio",
  "error": "Forbidden"
}
```

#### 2. Prevención de Eliminación con Turnos

No se puede eliminar un espacio que tiene turnos **confirmados** o **pendientes**.

**Error si tiene turnos activos** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "No se puede eliminar el espacio porque tiene turnos confirmados o pendientes",
  "error": "Bad Request"
}
```

**Se puede eliminar si**:
- No tiene turnos
- Solo tiene turnos cancelados
- Solo tiene turnos completados

### Tipo de Eliminación

**Soft Delete**: El espacio no se elimina físicamente, solo se marca como inactivo:
```
activo: true  →  activo: false
```

Esto preserva el historial y las relaciones con turnos existentes.

---

## Flujos Completos

### Flujo 1: Gestor Define Horarios de Atención

```bash
# Autenticarse
GESTOR_TOKEN="..."

# Obtener ID de mi agenda
AGENDA_ID=$(curl http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $GESTOR_TOKEN" | jq -r '.[0].id')

# Crear espacios para la semana
# Lunes
curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agendaId\": \"$AGENDA_ID\",
    \"startTime\": \"2025-01-20T09:00:00Z\",
    \"endTime\": \"2025-01-20T13:00:00Z\",
    \"slotDuration\": 30
  }"

# Martes
curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agendaId\": \"$AGENDA_ID\",
    \"startTime\": \"2025-01-21T09:00:00Z\",
    \"endTime\": \"2025-01-21T13:00:00Z\",
    \"slotDuration\": 30
  }"

# Ver mi calendario completo
curl http://localhost:3000/api/espacios/gestor/my-calendar \
  -H "Authorization: Bearer $GESTOR_TOKEN"
```

### Flujo 2: Usuario Busca Horarios Disponibles

```bash
# Autenticarse como usuario
USER_TOKEN="..."

# Listar agendas disponibles
curl http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $USER_TOKEN"

# Ver espacios disponibles en agenda específica
curl "http://localhost:3000/api/espacios/available/uuid-agenda-123" \
  -H "Authorization: Bearer $USER_TOKEN"

# Filtrar por fecha específica
curl "http://localhost:3000/api/espacios/available/uuid-agenda-123?date=2025-01-25" \
  -H "Authorization: Bearer $USER_TOKEN"
```

### Flujo 3: Gestor Modifica su Disponibilidad

```bash
GESTOR_TOKEN="..."

# 1. Ver mi calendario
curl http://localhost:3000/api/espacios/gestor/my-calendar \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# 2. Cancelar espacio del 25 de enero (emergencia personal)
curl -X DELETE http://localhost:3000/api/espacios/uuid-espacio-25-enero \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# 3. Agregar espacio de reemplazo el 26 de enero
curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agendaId": "mi-agenda-uuid",
    "startTime": "2025-01-26T09:00:00Z",
    "endTime": "2025-01-26T13:00:00Z",
    "slotDuration": 30
  }'
```

---

## Notas Importantes

### Relación con Turnos

Los espacios son los contenedores de turnos:

```
Espacio: 09:00-13:00 (slotDuration: 30min)
├── Turno 1: 09:00-09:30
├── Turno 2: 09:30-10:00
├── Turno 3: 10:00-10:30
└── ... hasta 12:30-13:00
```

Ver [Endpoints de Turnos](./07-endpoints-turnos.md) para reservar turnos en espacios.

### Espacios Individuales vs Grupales

| Característica | Individual | Grupal |
|----------------|-----------|--------|
| **grupoId** | `null` | UUID del grupo |
| **Pertenece a** | Un solo gestor | Todos los gestores del grupo |
| **Solapamiento** | Solo verifica ese gestor | Verifica TODOS los gestores del grupo |
| **Quién crea** | Cualquier gestor | Gestor que pertenece al grupo |
| **Casos de uso** | Consultas normales | Guardias compartidas |

### Prevención de Solapamientos

El sistema garantiza que:
1. Un gestor no puede estar en dos lugares al mismo tiempo
2. Los espacios grupales respetan la disponibilidad de TODOS los miembros
3. La validación ocurre al crear el espacio (no al reservar turno)

---

[← Anterior: Endpoints de Agendas](./05-endpoints-agendas.md) | [Volver al índice](./README.md) | [Siguiente: Endpoints de Turnos →](./07-endpoints-turnos.md)
