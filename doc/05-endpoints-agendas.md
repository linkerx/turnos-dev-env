# Endpoints de Agendas

## Índice
- [Descripción General](#descripción-general)
- [POST /agendas](#post-agendas)
- [GET /agendas](#get-agendas)
- [GET /agendas/:id](#get-agendasid)
- [POST /agendas/:id/gestores/:gestorId](#post-agendasidgestoresgestorid)
- [DELETE /agendas/:id/gestores/:gestorId](#delete-agendasidgestoresgestorid)

## Descripción General

Las agendas son contenedores compartidos donde múltiples gestores pueden crear espacios de tiempo (time slots). Representan calendarios compartidos como "Consultorio A", "Sala de Emergencias", etc.

**Base URL**: `/api/agendas`

**Autenticación**: KeycloakAuthGuard (JWT de Keycloak)

**Roles que usan este módulo**:
- **Administrador**: Todas las operaciones
- **Gestor**: Crear agendas, ver agendas propias, crear espacios
- **Usuario**: Ver agendas disponibles

---

## POST /agendas

Crea una nueva agenda con gestores asignados.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| POST | `/api/agendas` | `create_agenda` | Administrador, Gestor |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
Content-Type: application/json
```

**Body (CreateAgendaDto):**
```typescript
{
  nombre: string;           // Nombre de la agenda (obligatorio)
  descripcion?: string;     // Descripción opcional
  gestorIds: string[];      // Array de UUIDs de gestores (obligatorio, mínimo 1)
}
```

**Ejemplo de Request:**
```bash
curl -X POST http://localhost:3000/api/agendas \
  -H "Authorization: Bearer KEYCLOAK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Consultorio Cardiología",
    "descripcion": "Agenda para consultas cardiológicas",
    "gestorIds": [
      "uuid-gestor-1",
      "uuid-gestor-2"
    ]
  }'
```

### Response

**Status Code**: `201 Created`

**Body:**
```json
{
  "id": "uuid-agenda-123",
  "nombre": "Consultorio Cardiología",
  "descripcion": "Agenda para consultas cardiológicas",
  "activa": true,
  "gestores": [
    {
      "id": "uuid-gestor-1",
      "email": "doctor1@hospital.com",
      "nombre": "Dr. Juan Pérez"
    },
    {
      "id": "uuid-gestor-2",
      "email": "doctor2@hospital.com",
      "nombre": "Dra. María González"
    }
  ],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Lógica de Negocio

1. **Validación de gestores**: Verifica que todos los `gestorIds` existan en la base de datos
2. **Verificación de mínimos**: Requiere al menos 1 gestor
3. **Relación many-to-many**: Los gestores se vinculan mediante tabla `agenda_gestores`
4. **Estado inicial**: La agenda se crea con `activa: true`

### Casos de Uso

**Gestor creando su propia agenda:**
```bash
# Un médico crea su agenda personal
{
  "nombre": "Consultorio Dr. Pérez",
  "descripcion": "Consultas generales",
  "gestorIds": ["mi-propio-uuid"]
}
```

**Administrador creando agenda compartida:**
```bash
# Admin crea agenda para equipo de emergencias
{
  "nombre": "Guardia de Emergencias",
  "descripcion": "Turnos de guardia rotativos",
  "gestorIds": [
    "uuid-doctor-1",
    "uuid-doctor-2",
    "uuid-doctor-3"
  ]
}
```

---

## GET /agendas

Lista todas las agendas disponibles (filtrado por permisos).

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/agendas` | `view_agendas` O `view_all_agendas` | Todos |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
```

**Sin parámetros**

**Ejemplo de Request:**
```bash
curl http://localhost:3000/api/agendas \
  -H "Authorization: Bearer KEYCLOAK_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
[
  {
    "id": "uuid-agenda-1",
    "nombre": "Consultorio Cardiología",
    "descripcion": "Agenda para consultas cardiológicas",
    "activa": true,
    "gestores": [
      {
        "id": "uuid-gestor-1",
        "email": "doctor1@hospital.com",
        "nombre": "Dr. Juan Pérez"
      }
    ],
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  },
  {
    "id": "uuid-agenda-2",
    "nombre": "Consultorio Pediatría",
    "descripcion": "Consultas pediátricas",
    "activa": true,
    "gestores": [...],
    "createdAt": "2025-01-14T09:00:00Z",
    "updatedAt": "2025-01-14T09:00:00Z"
  }
]
```

### Filtrado por Permisos

**El filtrado depende del rol:**

| Rol | Permiso | Resultado |
|-----|---------|-----------|
| **Administrador** | `view_all_agendas` | Ve TODAS las agendas activas |
| **Gestor** | `view_agendas` | Ve SOLO agendas donde está asignado |
| **Usuario** | `view_agendas` | Ve TODAS las agendas activas (para reservar turnos) |

**Ejemplo como Gestor:**
```json
[
  {
    "id": "agenda-1",
    "nombre": "Mi Consultorio",
    "gestores": [
      { "id": "mi-uuid", "nombre": "Dr. Pérez" }
    ]
  }
]
```

**Ejemplo como Administrador:**
```json
[
  {
    "id": "agenda-1",
    "nombre": "Consultorio Cardiología",
    "gestores": [...]
  },
  {
    "id": "agenda-2",
    "nombre": "Consultorio Pediatría",
    "gestores": [...]
  },
  {
    "id": "agenda-3",
    "nombre": "Guardia de Emergencias",
    "gestores": [...]
  }
]
```

---

## GET /agendas/:id

Obtiene una agenda específica por ID (filtrado por permisos).

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/agendas/:id` | `view_agendas` O `view_all_agendas` | Todos |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID de la agenda

**Ejemplo de Request:**
```bash
curl http://localhost:3000/api/agendas/uuid-agenda-123 \
  -H "Authorization: Bearer KEYCLOAK_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-agenda-123",
  "nombre": "Consultorio Cardiología",
  "descripcion": "Agenda para consultas cardiológicas",
  "activa": true,
  "gestores": [
    {
      "id": "uuid-gestor-1",
      "email": "doctor1@hospital.com",
      "nombre": "Dr. Juan Pérez",
      "telefono": "+54 11 1234-5678"
    },
    {
      "id": "uuid-gestor-2",
      "email": "doctor2@hospital.com",
      "nombre": "Dra. María González",
      "telefono": "+54 11 8765-4321"
    }
  ],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Errores

**403 Forbidden** (Gestor intentando ver agenda de otro):
```json
{
  "statusCode": 403,
  "message": "No tienes permiso para ver esta agenda",
  "error": "Forbidden"
}
```

**404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "Agenda no encontrada",
  "error": "Not Found"
}
```

---

## POST /agendas/:id/gestores/:gestorId

Agrega un gestor a una agenda existente.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| POST | `/api/agendas/:id/gestores/:gestorId` | `assign_gestores_to_agendas` | Solo Administrador |

### Request

**Headers:**
```
Authorization: Bearer ADMIN_KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID de la agenda
- `gestorId` (string, UUID): ID del gestor a agregar

**Sin body**

**Ejemplo de Request:**
```bash
curl -X POST http://localhost:3000/api/agendas/uuid-agenda-123/gestores/uuid-gestor-456 \
  -H "Authorization: Bearer ADMIN_KEYCLOAK_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-agenda-123",
  "nombre": "Consultorio Cardiología",
  "descripcion": "Agenda para consultas cardiológicas",
  "activa": true,
  "gestores": [
    {
      "id": "uuid-gestor-1",
      "email": "doctor1@hospital.com",
      "nombre": "Dr. Juan Pérez"
    },
    {
      "id": "uuid-gestor-2",
      "email": "doctor2@hospital.com",
      "nombre": "Dra. María González"
    },
    {
      "id": "uuid-gestor-456",
      "email": "doctor3@hospital.com",
      "nombre": "Dr. Carlos Rodríguez"
    }
  ],
  "updatedAt": "2025-01-15T11:30:00Z"
}
```

### Lógica de Negocio

1. **Verificación de existencia**: Comprueba que agenda y gestor existan
2. **Prevención de duplicados**: Si el gestor ya está asignado, no hace nada (idempotente)
3. **Actualización de relación**: Agrega entrada en tabla `agenda_gestores`

### Casos de Uso

**Expandir equipo médico:**
```bash
# Admin agrega nuevo médico al equipo de cardiología
POST /api/agendas/agenda-cardiologia/gestores/nuevo-cardiologo-uuid
```

---

## DELETE /agendas/:id/gestores/:gestorId

Remueve un gestor de una agenda.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| DELETE | `/api/agendas/:id/gestores/:gestorId` | `assign_gestores_to_agendas` | Solo Administrador |

### Request

**Headers:**
```
Authorization: Bearer ADMIN_KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID de la agenda
- `gestorId` (string, UUID): ID del gestor a remover

**Sin body**

**Ejemplo de Request:**
```bash
curl -X DELETE http://localhost:3000/api/agendas/uuid-agenda-123/gestores/uuid-gestor-456 \
  -H "Authorization: Bearer ADMIN_KEYCLOAK_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-agenda-123",
  "nombre": "Consultorio Cardiología",
  "gestores": [
    {
      "id": "uuid-gestor-1",
      "email": "doctor1@hospital.com",
      "nombre": "Dr. Juan Pérez"
    }
  ],
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

### Restricciones

⚠️ **Regla de Negocio Crítica**: No se puede remover el último gestor de una agenda.

**Error si es el último gestor** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "No se puede eliminar el último gestor de la agenda. La agenda debe tener al menos un gestor.",
  "error": "Bad Request"
}
```

### Lógica de Negocio

1. **Verificación de existencia**: Comprueba que agenda y gestor existan
2. **Verificación de asignación**: Comprueba que el gestor esté asignado
3. **Prevención de agenda sin gestores**: Al menos 1 gestor debe permanecer
4. **Eliminación de relación**: Remueve entrada de tabla `agenda_gestores`

---

## Flujos Completos

### Flujo 1: Gestor Crea su Agenda Personal

```bash
# 1. Login del gestor
GESTOR_TOKEN=$(curl -s -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -d "client_id=turnos-api" \
  -d "client_secret=SECRET" \
  -d "username=doctor@hospital.com" \
  -d "password=pass123" \
  -d "grant_type=password" | jq -r '.access_token')

# 2. Crear agenda
curl -X POST http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Consultorio Dr. Pérez",
    "descripcion": "Consultas de medicina general",
    "gestorIds": ["mi-uuid-gestor"]
  }'
```

### Flujo 2: Administrador Gestiona Equipo Médico

```bash
# 1. Crear agenda para equipo
AGENDA_ID=$(curl -s -X POST http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Guardia Nocturna",
    "descripcion": "Equipo de guardia 20:00-08:00",
    "gestorIds": ["gestor-1-uuid", "gestor-2-uuid"]
  }' | jq -r '.id')

# 2. Agregar gestor adicional
curl -X POST http://localhost:3000/api/agendas/$AGENDA_ID/gestores/gestor-3-uuid \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Verificar equipo
curl http://localhost:3000/api/agendas/$AGENDA_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Flujo 3: Usuario Busca Agendas Disponibles

```bash
# 1. Login del usuario
USER_TOKEN=$(curl -s -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -d "client_id=turnos-api" \
  -d "client_secret=SECRET" \
  -d "username=paciente@example.com" \
  -d "password=pass123" \
  -d "grant_type=password" | jq -r '.access_token')

# 2. Listar agendas disponibles
curl http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $USER_TOKEN"

# 3. Ver detalles de agenda específica
curl http://localhost:3000/api/agendas/uuid-agenda-123 \
  -H "Authorization: Bearer $USER_TOKEN"
```

---

## Notas Importantes

### Relación con Espacios

Las agendas son contenedores de espacios (time slots). El flujo típico es:

1. **Crear agenda** (este endpoint)
2. **Crear espacios** en la agenda (ver [Endpoints de Espacios](./06-endpoints-espacios.md))
3. **Usuarios reservan turnos** en los espacios (ver [Endpoints de Turnos](./07-endpoints-turnos.md))

### Gestores y Agendas

- **Un gestor puede estar en múltiples agendas**
- **Una agenda puede tener múltiples gestores**
- **Relación many-to-many** a través de tabla `agenda_gestores`
- **Cada gestor puede crear espacios** en las agendas donde está asignado

### Soft Delete

Las agendas tienen un campo `activa` (boolean):
- `activa: true` → Agenda visible y operativa
- `activa: false` → Agenda "eliminada" (soft delete)

⚠️ **Nota**: Actualmente no hay endpoint para eliminar agendas. Se implementará en futuras versiones.

---

[← Anterior: Endpoints RBAC](./04-endpoints-rbac.md) | [Volver al índice](./README.md) | [Siguiente: Endpoints de Espacios →](./06-endpoints-espacios.md)
