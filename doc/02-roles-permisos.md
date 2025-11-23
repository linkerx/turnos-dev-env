# Roles y Permisos

## Índice
- [Introducción](#introducción)
- [Permisos del Sistema](#permisos-del-sistema)
- [Roles del Sistema](#roles-del-sistema)
- [Matriz de Permisos por Rol](#matriz-de-permisos-por-rol)
- [Gestión de Roles y Permisos](#gestión-de-roles-y-permisos)
- [Casos de Uso](#casos-de-uso)

## Introducción

El sistema utiliza un modelo **RBAC (Role-Based Access Control)** local almacenado en la base de datos PostgreSQL. Este modelo permite:

- **Granularidad**: Control fino sobre qué acciones puede realizar cada rol
- **Flexibilidad**: Crear roles personalizados con combinaciones de permisos
- **Auditoría**: Rastrear quién tiene qué permisos y cuándo se asignaron
- **Escalabilidad**: Agregar nuevos permisos sin modificar código

### Conceptos Clave

| Concepto | Descripción | Ejemplo |
|----------|-------------|---------|
| **Permiso** | Acción específica sobre un recurso | `create_agenda` |
| **Rol** | Conjunto de permisos agrupados | `gestor` |
| **Usuario/Gestor** | Entidad que tiene asignado un rol | Juan (rol: gestor) |
| **Recurso** | Entidad del sistema | agenda, espacio, turno |
| **Acción** | Operación sobre recurso | create, read, update, delete |

### Modelo de Datos

```
┌──────────────┐         ┌──────────────┐         ┌───────────────┐
│   Usuario    │────M:1──│     Rol      │────M:M──│   Permiso     │
│              │         │              │         │               │
│ - id         │         │ - id         │         │ - id          │
│ - email      │         │ - name       │         │ - name        │
│ - nombre     │   ┌────>│ - desc       │<────┐   │ - description │
│ - role_id ───┘   │     │ - active     │     │   │ - resource    │
└──────────────┘   │     └──────────────┘     │   │ - action      │
                   │            │              │   └───────────────┘
┌──────────────┐   │            │              │
│   Gestor     │───┘            │              │
│              │                │              │
│ - id         │         role_permissions      │
│ - email      │         (tabla junction)      │
│ - nombre     │         ───────────────────────┘
│ - role_id    │
└──────────────┘
```

## Permisos del Sistema

### Lista Completa de Permisos (20+)

#### Gestión de RBAC

| Permiso | Descripción | Recurso | Acción |
|---------|-------------|---------|--------|
| `manage_roles` | Crear, editar y eliminar roles | role | manage |
| `view_roles` | Ver roles del sistema | role | read |
| `manage_permissions` | Crear, editar y eliminar permisos | permission | manage |
| `view_permissions` | Ver permisos del sistema | permission | read |

#### Gestión de Agendas

| Permiso | Descripción | Recurso | Acción |
|---------|-------------|---------|--------|
| `create_agenda` | Crear nuevas agendas | agenda | create |
| `view_agendas` | Ver agendas propias (gestor) | agenda | read |
| `view_all_agendas` | Ver todas las agendas del sistema (admin) | agenda | read_all |
| `assign_gestores_to_agendas` | Asignar/remover gestores de agendas | agenda | assign_gestores |

#### Gestión de Grupos

| Permiso | Descripción | Recurso | Acción |
|---------|-------------|---------|--------|
| `manage_grupos` | Crear, editar y eliminar grupos de gestores | grupo | manage |
| `view_grupos` | Ver grupos del sistema | grupo | read |

#### Gestión de Espacios

| Permiso | Descripción | Recurso | Acción |
|---------|-------------|---------|--------|
| `create_espacio` | Crear espacios (time slots) | espacio | create |
| `view_espacios` | Ver espacios disponibles | espacio | read |
| `view_own_calendar` | Ver calendario propio (gestor) | calendar | read_own |
| `view_all_calendars` | Ver calendarios de todos los gestores (admin) | calendar | read_all |
| `delete_espacio` | Eliminar espacios | espacio | delete |

#### Gestión de Turnos

| Permiso | Descripción | Recurso | Acción |
|---------|-------------|---------|--------|
| `create_turno` | Crear/reservar turnos | turno | create |
| `view_turnos` | Ver turnos | turno | read |
| `cancel_turno` | Cancelar turnos | turno | cancel |
| `manage_turnos` | Gestionar todos los turnos (admin) | turno | manage |

#### Gestión de Usuarios

| Permiso | Descripción | Recurso | Acción |
|---------|-------------|---------|--------|
| `view_users` | Ver lista de usuarios | user | read |
| `manage_users` | Crear, editar y eliminar usuarios | user | manage |

### Detalle de Permisos por Recurso

#### Permisos de Agendas

```javascript
// Ver agendas propias (gestor ve solo agendas donde está asignado)
view_agendas → GET /api/agendas (filtrado)
              GET /api/agendas/:id (si es propia)

// Ver todas las agendas (admin ve todas)
view_all_agendas → GET /api/agendas (todas)
                   GET /api/agendas/:id (cualquiera)

// Crear agenda
create_agenda → POST /api/agendas

// Asignar gestores
assign_gestores_to_agendas → POST /api/agendas/:id/gestores/:gestorId
                              DELETE /api/agendas/:id/gestores/:gestorId
```

#### Permisos de Espacios

```javascript
// Ver calendario propio
view_own_calendar → GET /api/espacios/gestor/my-calendar

// Ver todos los calendarios
view_all_calendars → GET /api/espacios/gestor/:gestorId/calendar (cualquier gestor)

// Crear espacio
create_espacio → POST /api/espacios

// Ver espacios
view_espacios → GET /api/espacios/agenda/:agendaId
                GET /api/espacios/available/:agendaId
                GET /api/espacios/:id

// Eliminar espacio
delete_espacio → DELETE /api/espacios/:id
```

#### Permisos de Turnos

```javascript
// Crear turno
create_turno → POST /api/turnos

// Ver turnos
view_turnos → GET /api/turnos/my-turnos (propios)
              GET /api/turnos/gestor/my-turnos (de mis espacios)
              GET /api/turnos/:id

// Cancelar turno
cancel_turno → PATCH /api/turnos/:id/cancel

// Gestionar turnos (admin)
manage_turnos → Acceso completo a todos los turnos
```

## Roles del Sistema

### 1. Administrador (administrator)

**Descripción**: Control total del sistema. Puede gestionar roles, permisos, usuarios, agendas, grupos y ver toda la información.

**Permisos asignados (todos)**:
```
✓ manage_roles
✓ manage_permissions
✓ view_roles
✓ view_permissions
✓ create_agenda
✓ view_agendas
✓ view_all_agendas
✓ assign_gestores_to_agendas
✓ manage_grupos
✓ view_grupos
✓ create_espacio
✓ view_espacios
✓ view_own_calendar
✓ view_all_calendars
✓ delete_espacio
✓ create_turno
✓ view_turnos
✓ cancel_turno
✓ manage_turnos
✓ view_users
✓ manage_users
```

**Casos de uso**:
- Configurar el sistema (crear roles, permisos)
- Crear grupos de gestores
- Asignar gestores a agendas
- Ver todos los calendarios y turnos
- Gestionar usuarios del sistema

**Ejemplo de usuario**:
```json
{
  "email": "admin@hospital.com",
  "nombre": "Administrador del Sistema",
  "role": {
    "name": "administrator",
    "permissions": [
      { "name": "manage_roles" },
      { "name": "manage_permissions" },
      { "name": "view_all_agendas" },
      // ... todos los demás
    ]
  }
}
```

### 2. Gestor (gestor)

**Descripción**: Gestiona agendas y espacios de tiempo. Puede crear agendas, definir disponibilidad y confirmar turnos.

**Permisos asignados (8)**:
```
✓ view_agendas          - Ver agendas donde está asignado
✓ create_agenda         - Crear nuevas agendas
✓ view_grupos           - Ver grupos de gestores
✓ create_espacio        - Crear espacios en sus agendas
✓ view_espacios         - Ver espacios disponibles
✓ view_own_calendar     - Ver su propio calendario
✓ delete_espacio        - Eliminar espacios propios
✓ view_turnos           - Ver turnos en sus espacios
```

**Limitaciones**:
- ✗ No puede ver agendas de otros gestores (a menos que sea admin)
- ✗ No puede ver calendarios de otros gestores
- ✗ No puede asignar gestores a agendas (solo admin)
- ✗ No puede gestionar roles ni permisos
- ✗ No puede crear grupos (solo admin)

**Casos de uso**:
- Crear agenda para sus servicios
- Definir horarios de atención (espacios)
- Ver turnos reservados en sus espacios
- Confirmar o cancelar turnos
- Ver su calendario completo

**Ejemplo de usuario**:
```json
{
  "email": "doctor@hospital.com",
  "nombre": "Dr. Juan Pérez",
  "role": {
    "name": "gestor",
    "permissions": [
      { "name": "create_agenda" },
      { "name": "view_agendas" },
      { "name": "create_espacio" },
      { "name": "view_own_calendar" },
      { "name": "view_turnos" }
    ]
  }
}
```

### 3. Usuario (user)

**Descripción**: Usuario final que reserva turnos. Puede ver agendas disponibles y gestionar sus propias reservas.

**Permisos asignados (5)**:
```
✓ view_agendas          - Ver agendas disponibles
✓ view_espacios         - Ver espacios disponibles
✓ create_turno          - Reservar turnos
✓ view_turnos           - Ver sus propios turnos
✓ cancel_turno          - Cancelar sus turnos
```

**Limitaciones**:
- ✗ No puede crear agendas ni espacios
- ✗ No puede ver turnos de otros usuarios
- ✗ No puede confirmar turnos (solo gestor)
- ✗ No puede gestionar roles, permisos, ni usuarios

**Casos de uso**:
- Buscar agendas disponibles
- Ver espacios libres en una agenda
- Reservar un turno
- Ver historial de turnos
- Cancelar un turno

**Ejemplo de usuario**:
```json
{
  "email": "paciente@example.com",
  "nombre": "María García",
  "role": {
    "name": "user",
    "permissions": [
      { "name": "view_agendas" },
      { "name": "view_espacios" },
      { "name": "create_turno" },
      { "name": "view_turnos" },
      { "name": "cancel_turno" }
    ]
  }
}
```

## Matriz de Permisos por Rol

### Vista Completa

| Permiso | Admin | Gestor | Usuario |
|---------|:-----:|:------:|:-------:|
| **RBAC** |
| manage_roles | ✅ | ❌ | ❌ |
| view_roles | ✅ | ❌ | ❌ |
| manage_permissions | ✅ | ❌ | ❌ |
| view_permissions | ✅ | ❌ | ❌ |
| **Agendas** |
| create_agenda | ✅ | ✅ | ❌ |
| view_agendas | ✅ | ✅ (propias) | ✅ |
| view_all_agendas | ✅ | ❌ | ❌ |
| assign_gestores_to_agendas | ✅ | ❌ | ❌ |
| **Grupos** |
| manage_grupos | ✅ | ❌ | ❌ |
| view_grupos | ✅ | ✅ | ❌ |
| **Espacios** |
| create_espacio | ✅ | ✅ | ❌ |
| view_espacios | ✅ | ✅ | ✅ |
| view_own_calendar | ✅ | ✅ | ❌ |
| view_all_calendars | ✅ | ❌ | ❌ |
| delete_espacio | ✅ | ✅ (propios) | ❌ |
| **Turnos** |
| create_turno | ✅ | ❌ | ✅ |
| view_turnos | ✅ | ✅ (propios) | ✅ (propios) |
| cancel_turno | ✅ | ✅ | ✅ |
| manage_turnos | ✅ | ❌ | ❌ |
| **Usuarios** |
| view_users | ✅ | ❌ | ❌ |
| manage_users | ✅ | ❌ | ❌ |

### Por Funcionalidad

#### Gestión de Agendas

| Acción | Admin | Gestor | Usuario |
|--------|:-----:|:------:|:-------:|
| Ver todas las agendas | ✅ | ❌ | ❌ |
| Ver agendas propias/disponibles | ✅ | ✅ | ✅ |
| Crear agenda | ✅ | ✅ | ❌ |
| Asignar gestores a agenda | ✅ | ❌ | ❌ |
| Eliminar agenda | ❌ | ❌ | ❌ |

#### Gestión de Espacios

| Acción | Admin | Gestor | Usuario |
|--------|:-----:|:------:|:-------:|
| Ver todos los calendarios | ✅ | ❌ | ❌ |
| Ver calendario propio | ✅ | ✅ | ❌ |
| Ver espacios disponibles | ✅ | ✅ | ✅ |
| Crear espacio | ✅ | ✅ | ❌ |
| Eliminar espacio propio | ✅ | ✅ | ❌ |
| Eliminar espacio de otro | ✅ | ❌ | ❌ |

#### Gestión de Turnos

| Acción | Admin | Gestor | Usuario |
|--------|:-----:|:------:|:-------:|
| Ver todos los turnos | ✅ | ❌ | ❌ |
| Ver turnos propios | ✅ | ✅ | ✅ |
| Crear turno | ✅ | ❌ | ✅ |
| Confirmar turno | ✅ | ✅ | ❌ |
| Cancelar turno | ✅ | ✅ | ✅ |
| Completar turno | ✅ | ✅ | ❌ |

#### Gestión de Sistema

| Acción | Admin | Gestor | Usuario |
|--------|:-----:|:------:|:-------:|
| Gestionar roles | ✅ | ❌ | ❌ |
| Gestionar permisos | ✅ | ❌ | ❌ |
| Gestionar grupos | ✅ | ❌ | ❌ |
| Ver grupos | ✅ | ✅ | ❌ |
| Gestionar usuarios | ✅ | ❌ | ❌ |

## Gestión de Roles y Permisos

### Crear Rol Personalizado

```bash
# 1. Listar permisos disponibles
curl http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. Crear rol
curl -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "recepcionista",
    "description": "Recepcionista que gestiona turnos",
    "active": true,
    "permissionIds": [
      "permission-uuid-1",  // view_agendas
      "permission-uuid-2",  // view_espacios
      "permission-uuid-3",  // create_turno
      "permission-uuid-4",  // view_turnos
      "permission-uuid-5"   // cancel_turno
    ]
  }'
```

### Asignar Rol a Usuario

```bash
# Asignar rol a usuario
curl -X POST http://localhost:3000/api/rbac/users/USER_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "ROLE_ID"
  }'

# Asignar rol a gestor
curl -X POST http://localhost:3000/api/rbac/gestores/GESTOR_ID/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "ROLE_ID"
  }'
```

### Modificar Permisos de un Rol

```bash
# Agregar permisos
curl -X POST http://localhost:3000/api/rbac/roles/ROLE_ID/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": ["permission-uuid-6", "permission-uuid-7"]
  }'

# Remover permisos
curl -X DELETE http://localhost:3000/api/rbac/roles/ROLE_ID/permissions \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissionIds": ["permission-uuid-3"]
  }'
```

### Crear Permiso Personalizado

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

## Casos de Uso

### Caso 1: Hospital con Múltiples Especialidades

**Roles necesarios:**
- `administrator`: Director del hospital
- `gestor_especialista`: Médicos especialistas
- `recepcionista`: Personal de recepción
- `paciente`: Pacientes

**Configuración:**

```javascript
// Rol: gestor_especialista
{
  permissions: [
    'create_agenda',
    'view_agendas',
    'create_espacio',
    'view_espacios',
    'view_own_calendar',
    'delete_espacio',
    'view_turnos',
  ]
}

// Rol: recepcionista
{
  permissions: [
    'view_all_agendas',    // Ver todas las agendas
    'view_espacios',       // Ver espacios
    'create_turno',        // Reservar para pacientes
    'view_turnos',         // Ver turnos
    'cancel_turno',        // Cancelar turnos
  ]
}

// Rol: paciente
{
  permissions: [
    'view_agendas',        // Ver agendas disponibles
    'view_espacios',       // Ver horarios
    'create_turno',        // Reservar turno
    'view_turnos',         // Ver mis turnos
    'cancel_turno',        // Cancelar mi turno
  ]
}
```

### Caso 2: Consultorio Privado

**Roles necesarios:**
- `administrator`: Dueño del consultorio
- `medico`: Médicos del consultorio
- `paciente`: Pacientes

**Configuración:**

```javascript
// Rol: medico (puede gestionar todo su calendario)
{
  permissions: [
    'create_agenda',
    'view_agendas',
    'create_espacio',
    'view_espacios',
    'view_own_calendar',
    'delete_espacio',
    'view_turnos',
  ]
}

// El resto igual que caso anterior
```

### Caso 3: Centro de Atención con Grupos

**Escenario**: Múltiples médicos que comparten guardias

**Roles necesarios:**
- `administrator`: Coordinador
- `gestor_grupo`: Médicos que trabajan en equipo
- `paciente`: Pacientes

**Configuración:**

```javascript
// Rol: gestor_grupo
{
  permissions: [
    'create_agenda',
    'view_agendas',
    'view_grupos',         // Ver grupos
    'create_espacio',      // Crear espacios grupales
    'view_espacios',
    'view_own_calendar',
    'delete_espacio',
    'view_turnos',
  ]
}

// Uso:
// 1. Admin crea grupo "Guardia Nocturna"
// 2. Admin asigna 3 médicos al grupo
// 3. Cualquier médico del grupo puede crear espacio para el grupo
// 4. Ningún médico del grupo puede tener solapamientos
```

## Inicialización del Sistema

### Seed de RBAC

El sistema incluye un seed que inicializa roles y permisos:

```bash
npm run seed:rbac
```

**Archivo**: `/src/rbac/seeds/rbac.seed.ts`

**Qué crea:**
1. 20+ permisos del sistema
2. 3 roles predefinidos (administrator, gestor, user)
3. Asignación de permisos a roles

### Primer Administrador

```bash
# 1. Registrar gestor
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securePassword123",
    "nombre": "Admin Principal",
    "role": "gestor"
  }'

# 2. Obtener ID del rol administrator
curl http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer TEMP_TOKEN"

# 3. Asignar rol administrator al gestor
# (Esto requiere acceso directo a BD o un super-admin inicial)
```

**Opción alternativa**: Crear directamente en la BD

```sql
-- Buscar ID del rol administrator
SELECT id FROM roles WHERE name = 'administrator';

-- Asignar rol al gestor
UPDATE gestores
SET role_id = 'administrator-role-id'
WHERE email = 'admin@example.com';
```

## Seguridad

### Prevención de Escalada de Privilegios

1. **Solo admins pueden gestionar roles**: Permiso `manage_roles`
2. **Validación de permisos en cada request**: `PermissionsGuard`
3. **No se puede eliminar rol si está asignado**: Previene orphan users
4. **Roles tienen flag `active`**: Permite desactivar sin eliminar

### Auditoría

Todas las entidades tienen timestamps:

```typescript
{
  createdAt: Date,  // Cuándo se creó
  updatedAt: Date,  // Última modificación
}
```

**Futuras mejoras**:
- Tabla de auditoría de cambios de roles
- Logging de accesos por permiso
- Historial de asignación de roles

### Mejores Prácticas

1. **Principio de mínimo privilegio**: Asignar solo permisos necesarios
2. **Revisar permisos regularmente**: Auditar roles cada mes
3. **No modificar roles predefinidos**: Crear roles personalizados
4. **Usar roles específicos**: Evitar dar rol `administrator` innecesariamente
5. **Documentar roles personalizados**: Mantener documentación actualizada

---

[← Anterior: Autenticación](./01-autenticacion.md) | [Volver al índice](./README.md) | [Siguiente: Endpoints de Autenticación →](./03-endpoints-autenticacion.md)
