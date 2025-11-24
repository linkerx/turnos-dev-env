# Endpoints de Grupos de Gestores

## Índice
- [Descripción General](#descripción-general)
- [POST /grupos](#post-grupos)
- [GET /grupos](#get-grupos)
- [GET /grupos/:id](#get-gruposid)
- [PUT /grupos/:id](#put-gruposid)
- [DELETE /grupos/:id](#delete-gruposid)
- [POST /grupos/:id/gestores](#post-gruposidgestores)
- [DELETE /grupos/:id/gestores](#delete-gruposidgestores)

## Descripción General

Los **Grupos** permiten agrupar gestores para crear espacios compartidos donde ningún gestor del grupo puede tener solapamientos de horarios.

**Base URL**: `/api/grupos`

**Autenticación**: KeycloakAuthGuard (JWT de Keycloak)

**Permisos**:
- `manage_grupos`: Crear, editar, eliminar grupos (solo Administrador)
- `view_grupos`: Ver grupos (Administrador y Gestor)

**Casos de Uso:**
- Equipos de guardia rotativos
- Grupos de especialistas que comparten agenda
- Departamentos médicos con horarios coordinados

---

## POST /grupos

Crea un nuevo grupo de gestores.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| POST | `/api/grupos` | `manage_grupos` | Solo Administrador |

### Request

**Headers:**
```
Authorization: Bearer ADMIN_KEYCLOAK_TOKEN
Content-Type: application/json
```

**Body (CreateGrupoDto):**
```typescript
{
  nombre: string;              // Nombre del grupo (obligatorio)
  descripcion?: string;        // Descripción opcional
  activo?: boolean;            // true por defecto
  gestorIds: string[];         // Array de UUIDs de gestores (obligatorio, mínimo 1)
}
```

**Ejemplo de Request:**
```bash
curl -X POST http://localhost:3000/api/grupos \
  -H "Authorization: Bearer ADMIN_KEYCLOAK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Guardia Nocturna",
    "descripcion": "Equipo de guardia 20:00-08:00",
    "activo": true,
    "gestorIds": [
      "uuid-gestor-1",
      "uuid-gestor-2",
      "uuid-gestor-3"
    ]
  }'
```

### Response

**Status Code**: `201 Created`

**Body:**
```json
{
  "id": "uuid-grupo-123",
  "nombre": "Guardia Nocturna",
  "descripcion": "Equipo de guardia 20:00-08:00",
  "activo": true,
  "gestores": [
    {
      "id": "uuid-gestor-1",
      "nombre": "Dr. Juan Pérez",
      "email": "doctor1@hospital.com"
    },
    {
      "id": "uuid-gestor-2",
      "nombre": "Dra. María González",
      "email": "doctor2@hospital.com"
    },
    {
      "id": "uuid-gestor-3",
      "nombre": "Dr. Carlos Rodríguez",
      "email": "doctor3@hospital.com"
    }
  ],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

### Validaciones

1. **Nombre único**: No puede haber dos grupos con el mismo nombre
2. **Mínimo 1 gestor**: Requiere al menos un gestor
3. **Gestores válidos**: Todos los `gestorIds` deben existir

**Error de nombre duplicado** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "Ya existe un grupo con ese nombre",
  "error": "Conflict"
}
```

**Error de gestores insuficientes** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "El grupo debe tener al menos un gestor",
  "error": "Bad Request"
}
```

---

## GET /grupos

Lista todos los grupos activos (o incluyendo inactivos).

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/grupos` | `view_grupos` | Administrador, Gestor |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
```

**Query Parameters (opcionales):**
- `includeInactive` (boolean): Si es `true`, incluye grupos inactivos. Default: `false`

**Ejemplo sin inactivos:**
```bash
curl http://localhost:3000/api/grupos \
  -H "Authorization: Bearer KEYCLOAK_TOKEN"
```

**Ejemplo con inactivos:**
```bash
curl "http://localhost:3000/api/grupos?includeInactive=true" \
  -H "Authorization: Bearer KEYCLOAK_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
[
  {
    "id": "uuid-grupo-1",
    "nombre": "Guardia Nocturna",
    "descripcion": "Equipo de guardia 20:00-08:00",
    "activo": true,
    "gestores": [
      {
        "id": "uuid-gestor-1",
        "nombre": "Dr. Juan Pérez",
        "email": "doctor1@hospital.com"
      },
      {
        "id": "uuid-gestor-2",
        "nombre": "Dra. María González",
        "email": "doctor2@hospital.com"
      }
    ],
    "createdAt": "2025-01-15T10:00:00Z"
  },
  {
    "id": "uuid-grupo-2",
    "nombre": "Equipo Pediatría",
    "descripcion": "Pediatras del hospital",
    "activo": true,
    "gestores": [...],
    "createdAt": "2025-01-14T09:00:00Z"
  }
]
```

**Ordenamiento**: Por `nombre` ascendente (alfabético)

---

## GET /grupos/:id

Obtiene un grupo específico por ID.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| GET | `/api/grupos/:id` | `view_grupos` | Administrador, Gestor |

### Request

**Headers:**
```
Authorization: Bearer KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del grupo

**Ejemplo:**
```bash
curl http://localhost:3000/api/grupos/uuid-grupo-123 \
  -H "Authorization: Bearer KEYCLOAK_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-grupo-123",
  "nombre": "Guardia Nocturna",
  "descripcion": "Equipo de guardia 20:00-08:00",
  "activo": true,
  "gestores": [
    {
      "id": "uuid-gestor-1",
      "nombre": "Dr. Juan Pérez",
      "email": "doctor1@hospital.com",
      "telefono": "+54 11 1234-5678"
    },
    {
      "id": "uuid-gestor-2",
      "nombre": "Dra. María González",
      "email": "doctor2@hospital.com",
      "telefono": "+54 11 8765-4321"
    }
  ],
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

## PUT /grupos/:id

Actualiza un grupo existente.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| PUT | `/api/grupos/:id` | `manage_grupos` | Solo Administrador |

### Request

**Headers:**
```
Authorization: Bearer ADMIN_KEYCLOAK_TOKEN
Content-Type: application/json
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del grupo

**Body (UpdateGrupoDto - todos opcionales):**
```typescript
{
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
  gestorIds?: string[];       // Reemplaza completamente los gestores
}
```

**Ejemplo de Request:**
```bash
curl -X PUT http://localhost:3000/api/grupos/uuid-grupo-123 \
  -H "Authorization: Bearer ADMIN_KEYCLOAK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Equipo de guardia nocturna actualizado",
    "activo": true
  }'
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-grupo-123",
  "nombre": "Guardia Nocturna",
  "descripcion": "Equipo de guardia nocturna actualizado",
  "activo": true,
  "gestores": [...],
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

### Validaciones

1. **Nombre único** (si se cambia)
2. **Mínimo 1 gestor** (si se proporciona `gestorIds`)

---

## DELETE /grupos/:id

Elimina (desactiva) un grupo.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| DELETE | `/api/grupos/:id` | `manage_grupos` | Solo Administrador |

### Request

**Headers:**
```
Authorization: Bearer ADMIN_KEYCLOAK_TOKEN
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del grupo

**Sin body**

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/grupos/uuid-grupo-123 \
  -H "Authorization: Bearer ADMIN_KEYCLOAK_TOKEN"
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-grupo-123",
  "nombre": "Guardia Nocturna",
  "activo": false,
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

### Tipo de Eliminación

**Soft Delete**: El grupo no se elimina físicamente, solo se marca como inactivo:
```
activo: true  →  activo: false
```

Los espacios creados con este grupo seguirán existiendo y funcionando normalmente.

---

## POST /grupos/:id/gestores

Agrega gestores a un grupo existente.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| POST | `/api/grupos/:id/gestores` | `manage_grupos` | Solo Administrador |

### Request

**Headers:**
```
Authorization: Bearer ADMIN_KEYCLOAK_TOKEN
Content-Type: application/json
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del grupo

**Body:**
```json
{
  "gestorIds": [
    "uuid-gestor-4",
    "uuid-gestor-5"
  ]
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/grupos/uuid-grupo-123/gestores \
  -H "Authorization: Bearer ADMIN_KEYCLOAK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gestorIds": ["uuid-gestor-4", "uuid-gestor-5"]
  }'
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-grupo-123",
  "nombre": "Guardia Nocturna",
  "gestores": [
    { "id": "uuid-gestor-1", "nombre": "Dr. Juan Pérez" },
    { "id": "uuid-gestor-2", "nombre": "Dra. María González" },
    { "id": "uuid-gestor-3", "nombre": "Dr. Carlos Rodríguez" },
    { "id": "uuid-gestor-4", "nombre": "Dra. Ana López" },
    { "id": "uuid-gestor-5", "nombre": "Dr. Pedro Martínez" }
  ],
  "updatedAt": "2025-01-15T11:30:00Z"
}
```

### Validaciones

1. **Gestores válidos**: Todos deben existir
2. **Prevención de duplicados**: No agrega gestores ya presentes

---

## DELETE /grupos/:id/gestores

Remueve gestores de un grupo.

### Información del Endpoint

| Método | Ruta | Permisos | Roles |
|--------|------|----------|-------|
| DELETE | `/api/grupos/:id/gestores` | `manage_grupos` | Solo Administrador |

### Request

**Headers:**
```
Authorization: Bearer ADMIN_KEYCLOAK_TOKEN
Content-Type: application/json
```

**Parámetros de Ruta:**
- `id` (string, UUID): ID del grupo

**Body:**
```json
{
  "gestorIds": [
    "uuid-gestor-4"
  ]
}
```

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/grupos/uuid-grupo-123/gestores \
  -H "Authorization: Bearer ADMIN_KEYCLOAK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gestorIds": ["uuid-gestor-4"]
  }'
```

### Response

**Status Code**: `200 OK`

**Body:**
```json
{
  "id": "uuid-grupo-123",
  "nombre": "Guardia Nocturna",
  "gestores": [
    { "id": "uuid-gestor-1", "nombre": "Dr. Juan Pérez" },
    { "id": "uuid-gestor-2", "nombre": "Dra. María González" },
    { "id": "uuid-gestor-3", "nombre": "Dr. Carlos Rodríguez" }
  ],
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

### Restricciones

⚠️ **Regla de Negocio**: El grupo debe tener al menos 1 gestor después de la remoción.

**Error si se intenta eliminar el último gestor** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "El grupo debe tener al menos un gestor",
  "error": "Bad Request"
}
```

---

## Flujos Completos

### Flujo 1: Administrador Crea Equipo de Guardia

```bash
ADMIN_TOKEN="..."

# 1. Crear grupo
GRUPO_ID=$(curl -s -X POST http://localhost:3000/api/grupos \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Guardia Nocturna Enero",
    "descripcion": "Equipo de guardia para enero 2025",
    "gestorIds": [
      "gestor-1-uuid",
      "gestor-2-uuid",
      "gestor-3-uuid"
    ]
  }' | jq -r '.id')

# 2. Verificar grupo creado
curl http://localhost:3000/api/grupos/$GRUPO_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Ahora cualquier gestor del grupo puede crear espacios grupales
# (Ver endpoints de Espacios con grupoId)
```

### Flujo 2: Administrador Gestiona Miembros del Grupo

```bash
ADMIN_TOKEN="..."
GRUPO_ID="uuid-grupo-123"

# 1. Agregar nuevos gestores al equipo
curl -X POST http://localhost:3000/api/grupos/$GRUPO_ID/gestores \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gestorIds": ["nuevo-gestor-uuid"]
  }'

# 2. Ver grupo actualizado
curl http://localhost:3000/api/grupos/$GRUPO_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 3. Remover gestor que ya no está en el equipo
curl -X DELETE http://localhost:3000/api/grupos/$GRUPO_ID/gestores \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gestorIds": ["gestor-saliente-uuid"]
  }'
```

### Flujo 3: Gestor Consulta Grupos Disponibles

```bash
GESTOR_TOKEN="..."

# 1. Ver todos los grupos activos
curl http://localhost:3000/api/grupos \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# 2. Ver detalles de un grupo específico
curl http://localhost:3000/api/grupos/uuid-grupo-123 \
  -H "Authorization: Bearer $GESTOR_TOKEN"

# 3. Si pertenezco al grupo, puedo crear espacios grupales
curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "agendaId": "mi-agenda-uuid",
    "grupoId": "uuid-grupo-123",
    "startTime": "2025-01-20T20:00:00Z",
    "endTime": "2025-01-21T08:00:00Z",
    "slotDuration": 60
  }'
```

---

## Relación con Espacios

Los grupos se usan al crear espacios compartidos:

**Sin grupo (espacio individual):**
```json
{
  "agendaId": "agenda-uuid",
  "startTime": "...",
  "endTime": "...",
  "slotDuration": 30
}
```

**Con grupo (espacio compartido):**
```json
{
  "agendaId": "agenda-uuid",
  "grupoId": "grupo-uuid",  // ← Todos los gestores del grupo
  "startTime": "...",
  "endTime": "...",
  "slotDuration": 30
}
```

**Validación de solapamientos**: Cuando se crea un espacio grupal, el sistema verifica que NINGÚN gestor del grupo tenga solapamientos en ese horario.

Ver [Endpoints de Espacios](./06-endpoints-espacios.md) para más detalles.

---

## Notas Importantes

### Casos de Uso Comunes

1. **Guardias rotativas**: Equipos que se turnan en horarios nocturnos
2. **Departamentos médicos**: Grupos de especialistas que comparten agenda
3. **Consultorios compartidos**: Varios médicos que atienden en el mismo lugar
4. **Emergencias**: Equipos que deben estar coordinados sin solapamientos

### Gestión de Grupos vs Agendas

| Concepto | Grupos | Agendas |
|----------|--------|---------|
| **Propósito** | Coordinar horarios de gestores | Contenedor de espacios |
| **Miembros** | Gestores | Gestores |
| **Restricción** | Previene solapamientos | No tiene restricciones propias |
| **Se usa en** | Creación de espacios grupales | Creación de cualquier espacio |

### Soft Delete

- Grupos eliminados: `activo: false`
- Espacios creados con el grupo: siguen funcionando
- No afecta turnos existentes
- Se pueden reactivar cambiando `activo: true` mediante PUT

---

[← Anterior: Endpoints de Turnos](./07-endpoints-turnos.md) | [Volver al índice](./README.md) | [Siguiente: Ejemplos de Uso →](./09-ejemplos-uso.md)
