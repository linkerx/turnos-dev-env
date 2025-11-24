# Endpoints de RBAC (Control de Acceso Basado en Roles)

## Índice
- [Descripción General](#descripción-general)
- [Endpoints de Permisos](#endpoints-de-permisos)
- [Endpoints de Roles](#endpoints-de-roles)
- [Gestión de Permisos de Roles](#gestión-de-permisos-de-roles)
- [Asignación de Roles](#asignación-de-roles)

## Descripción General

Los endpoints de RBAC permiten la gestión completa del sistema de roles y permisos.

**Base URL**: `/api/rbac`

**Autenticación**: KeycloakAuthGuard (JWT de Keycloak)

**Autorización**: Solo **Administradores** (permisos `manage_roles`, `manage_permissions`, `view_roles`, `view_permissions`)

⚠️ **IMPORTANTE**: Todos estos endpoints requieren autenticación con Keycloak y permisos de administrador.

---

## Endpoints de Permisos

### POST /rbac/permissions

Crea un nuevo permiso en el sistema.

**Permisos requeridos**: `manage_permissions`

**Request:**
```json
{
  "name": "export_reports",
  "description": "Permite exportar reportes del sistema",
  "resource": "report",
  "action": "export"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-permission-123",
  "name": "export_reports",
  "description": "Permite exportar reportes del sistema",
  "resource": "report",
  "action": "export",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "export_reports",
    "description": "Permite exportar reportes del sistema",
    "resource": "report",
    "action": "export"
  }'
```

---

### GET /rbac/permissions

Lista todos los permisos del sistema.

**Permisos requeridos**: `manage_permissions` O `view_permissions`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-1",
    "name": "manage_roles",
    "description": "Crear, editar y eliminar roles",
    "resource": "role",
    "action": "manage",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  {
    "id": "uuid-2",
    "name": "view_agendas",
    "description": "Ver agendas del sistema",
    "resource": "agenda",
    "action": "read",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### GET /rbac/permissions/:id

Obtiene un permiso específico por ID.

**Permisos requeridos**: `manage_permissions` O `view_permissions`

**Response:** `200 OK`
```json
{
  "id": "uuid-permission-123",
  "name": "create_agenda",
  "description": "Crear nuevas agendas",
  "resource": "agenda",
  "action": "create",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/rbac/permissions/uuid-permission-123 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### DELETE /rbac/permissions/:id

Elimina un permiso del sistema.

**Permisos requeridos**: `manage_permissions`

⚠️ **Precaución**: Esto eliminará el permiso de todos los roles que lo tengan asignado.

**Response:** `200 OK`

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/rbac/permissions/uuid-permission-123 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Endpoints de Roles

### POST /rbac/roles

Crea un nuevo rol con permisos opcionales.

**Permisos requeridos**: `manage_roles`

**Request:**
```json
{
  "name": "recepcionista",
  "description": "Personal de recepción que gestiona turnos",
  "active": true,
  "permissionIds": [
    "uuid-perm-1",  // view_agendas
    "uuid-perm-2",  // view_espacios
    "uuid-perm-3",  // create_turno
    "uuid-perm-4",  // view_turnos
    "uuid-perm-5"   // cancel_turno
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid-role-123",
  "name": "recepcionista",
  "description": "Personal de recepción que gestiona turnos",
  "active": true,
  "permissions": [
    {
      "id": "uuid-perm-1",
      "name": "view_agendas",
      "description": "Ver agendas del sistema"
    },
    {
      "id": "uuid-perm-2",
      "name": "view_espacios",
      "description": "Ver espacios disponibles"
    }
  ],
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "recepcionista",
    "description": "Personal de recepción que gestiona turnos",
    "active": true,
    "permissionIds": ["uuid-1", "uuid-2", "uuid-3"]
  }'
```

---

### GET /rbac/roles

Lista todos los roles con sus permisos.

**Permisos requeridos**: `manage_roles` O `view_roles`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid-role-admin",
    "name": "administrator",
    "description": "Administrador con control total del sistema",
    "active": true,
    "permissions": [
      {
        "id": "uuid-perm-1",
        "name": "manage_roles",
        "description": "Crear, editar y eliminar roles"
      },
      {
        "id": "uuid-perm-2",
        "name": "manage_permissions",
        "description": "Crear, editar y eliminar permisos"
      }
    ],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  },
  {
    "id": "uuid-role-gestor",
    "name": "gestor",
    "description": "Gestor que administra agendas y espacios",
    "active": true,
    "permissions": [
      {
        "id": "uuid-perm-3",
        "name": "create_agenda",
        "description": "Crear nuevas agendas"
      }
    ],
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### GET /rbac/roles/:id

Obtiene un rol específico con sus permisos.

**Permisos requeridos**: `manage_roles` O `view_roles`

**Response:** `200 OK`
```json
{
  "id": "uuid-role-gestor",
  "name": "gestor",
  "description": "Gestor que administra agendas y espacios",
  "active": true,
  "permissions": [
    {
      "id": "uuid-1",
      "name": "create_agenda",
      "description": "Crear nuevas agendas",
      "resource": "agenda",
      "action": "create"
    },
    {
      "id": "uuid-2",
      "name": "view_agendas",
      "description": "Ver agendas propias",
      "resource": "agenda",
      "action": "read"
    }
  ],
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/rbac/roles/uuid-role-gestor \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

### PUT /rbac/roles/:id

Actualiza un rol existente.

**Permisos requeridos**: `manage_roles`

**Request** (todos los campos opcionales):
```json
{
  "name": "gestor_especialista",
  "description": "Gestor médico especialista",
  "active": true,
  "permissionIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-role-123",
  "name": "gestor_especialista",
  "description": "Gestor médico especialista",
  "active": true,
  "permissions": [...],
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

**Ejemplo:**
```bash
curl -X PUT http://localhost:3000/api/rbac/roles/uuid-role-123 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Gestor médico especialista actualizado",
    "active": true
  }'
```

---

### DELETE /rbac/roles/:id

Elimina un rol del sistema.

**Permisos requeridos**: `manage_roles`

⚠️ **Restricción**: No se puede eliminar un rol que esté asignado a usuarios o gestores.

**Response:** `200 OK`

**Error si está asignado** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "No se puede eliminar el rol porque está asignado a usuarios/gestores",
  "error": "Bad Request"
}
```

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/rbac/roles/uuid-role-123 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Gestión de Permisos de Roles

### POST /rbac/roles/:roleId/permissions

Agrega permisos a un rol existente.

**Permisos requeridos**: `manage_roles`

**Request:**
```json
{
  "permissionIds": [
    "uuid-perm-6",
    "uuid-perm-7"
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-role-123",
  "name": "recepcionista",
  "permissions": [
    {
      "id": "uuid-perm-1",
      "name": "view_agendas"
    },
    {
      "id": "uuid-perm-6",
      "name": "manage_grupos"
    },
    {
      "id": "uuid-perm-7",
      "name": "view_grupos"
    }
  ]
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/rbac/roles/uuid-role-123/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": ["uuid-perm-6", "uuid-perm-7"]
  }'
```

---

### DELETE /rbac/roles/:roleId/permissions

Remueve permisos de un rol.

**Permisos requeridos**: `manage_roles`

**Request:**
```json
{
  "permissionIds": [
    "uuid-perm-3"
  ]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-role-123",
  "name": "recepcionista",
  "permissions": [
    {
      "id": "uuid-perm-1",
      "name": "view_agendas"
    },
    {
      "id": "uuid-perm-2",
      "name": "view_espacios"
    }
  ]
}
```

**Ejemplo:**
```bash
curl -X DELETE http://localhost:3000/api/rbac/roles/uuid-role-123/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": ["uuid-perm-3"]
  }'
```

---

## Asignación de Roles

### POST /rbac/users/:userId/role

Asigna un rol a un usuario.

**Permisos requeridos**: `manage_roles`

**Request:**
```json
{
  "roleId": "uuid-role-user"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-user-123",
  "email": "paciente@example.com",
  "nombre": "María García",
  "role": {
    "id": "uuid-role-user",
    "name": "user",
    "description": "Usuario que reserva turnos"
  }
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/rbac/users/uuid-user-123/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "uuid-role-user"
  }'
```

---

### POST /rbac/gestores/:gestorId/role

Asigna un rol a un gestor.

**Permisos requeridos**: `manage_roles`

**Request:**
```json
{
  "roleId": "uuid-role-gestor"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid-gestor-123",
  "email": "doctor@hospital.com",
  "nombre": "Dr. Juan Pérez",
  "role": {
    "id": "uuid-role-gestor",
    "name": "gestor",
    "description": "Gestor que administra agendas"
  }
}
```

**Ejemplo:**
```bash
curl -X POST http://localhost:3000/api/rbac/gestores/uuid-gestor-123/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "uuid-role-gestor"
  }'
```

---

## Flujos Completos

### Flujo 1: Crear Rol Personalizado

```bash
# 1. Listar permisos disponibles
curl http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. Crear rol con permisos seleccionados
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "supervisor",
    "description": "Supervisor con permisos ampliados",
    "active": true,
    "permissionIds": [
      "view_all_agendas-uuid",
      "view_all_calendars-uuid",
      "view_turnos-uuid",
      "manage_grupos-uuid"
    ]
  }'

# 3. Asignar rol a gestor
curl -X POST http://localhost:3000/api/rbac/gestores/GESTOR_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "NUEVO_ROL_ID"
  }'
```

### Flujo 2: Modificar Permisos de un Rol

```bash
# 1. Ver rol actual
curl http://localhost:3000/api/rbac/roles/ROL_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. Agregar nuevos permisos
curl -X POST http://localhost:3000/api/rbac/roles/ROL_ID/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": ["nuevo-permiso-uuid-1", "nuevo-permiso-uuid-2"]
  }'

# 3. Remover permisos innecesarios
curl -X DELETE http://localhost:3000/api/rbac/roles/ROL_ID/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": ["permiso-viejo-uuid"]
  }'

# 4. Verificar cambios
curl http://localhost:3000/api/rbac/roles/ROL_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Errores Comunes

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Acceso denegado: permisos insuficientes",
  "error": "Forbidden"
}
```
**Causa**: Usuario no tiene permisos de administrador.

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Rol no encontrado",
  "error": "Not Found"
}
```
**Causa**: El ID del rol/permiso/usuario no existe.

### 400 Bad Request (Rol asignado)
```json
{
  "statusCode": 400,
  "message": "No se puede eliminar el rol porque está asignado a usuarios/gestores",
  "error": "Bad Request"
}
```
**Causa**: Intentar eliminar rol que tiene usuarios asignados.

### 409 Conflict (Nombre duplicado)
```json
{
  "statusCode": 409,
  "message": "Ya existe un rol con ese nombre",
  "error": "Conflict"
}
```
**Causa**: Intentar crear rol/permiso con nombre que ya existe.

---

[← Anterior: Endpoints de Autenticación](./03-endpoints-autenticacion.md) | [Volver al índice](./README.md) | [Siguiente: Endpoints de Agendas →](./05-endpoints-agendas.md)
