# Integración Keycloak + RBAC Local

## Descripción General

Este sistema integra **Keycloak** para autenticación (validación de tokens JWT) con un **sistema RBAC local** para gestión de roles y permisos. Los usuarios se autentican desde el frontend usando Keycloak, pero los permisos y autorizaciones se gestionan localmente en la API.

## Arquitectura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Frontend   │────────▶│   Keycloak   │         │   API       │
│             │  Login  │              │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
                               │                        │
                               │ JWT Token              │
                               ▼                        ▼
                        ┌──────────────┐         ┌─────────────┐
                        │ Validación   │────────▶│ RBAC Local  │
                        │ Token (JWKS) │         │ Permisos    │
                        └──────────────┘         └─────────────┘
```

## Características Principales

### 1. Autenticación con Keycloak
- Los usuarios se autentican en Keycloak desde el frontend
- El frontend recibe un JWT token de Keycloak
- La API valida el token usando JWKS (JSON Web Key Set)
- El token se vincula automáticamente con usuarios locales

### 2. Sistema RBAC Local
- **Roles**: Grupos de permisos (ej: administrator, gestor, user)
- **Permisos**: Acciones específicas (ej: view_all_calendars, manage_roles)
- **Gestión**: Solo administradores pueden crear/modificar roles y permisos

### 3. Control de Acceso

#### Administrador
- ✅ Ver todas las agendas y calendarios de todos los gestores
- ✅ Gestionar roles y permisos
- ✅ Habilitar/deshabilitar gestores en agendas
- ✅ Ver calendarios de cualquier gestor

#### Gestor
- ✅ Ver solo sus propias agendas
- ✅ Ver solo su propio calendario
- ✅ Crear time slots en sus agendas
- ❌ NO puede ver calendarios de otros gestores
- ❌ NO puede gestionar roles/permisos

#### Usuario
- ✅ Ver agendas disponibles
- ✅ Crear turnos
- ✅ Ver sus propios turnos
- ❌ NO puede acceder a calendarios

## Variables de Entorno

Agregar al archivo `.env`:

```bash
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=turnos-realm
KEYCLOAK_CLIENT_ID=turnos-api
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Database (ya existentes)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=turnos_db
DB_SYNC=true
DB_LOGGING=false

# JWT (mantener para compatibilidad)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Configuración de Keycloak

### 1. Crear Realm
```
- Nombre: turnos-realm
```

### 2. Crear Cliente
```
Client ID: turnos-api
Client Protocol: openid-connect
Access Type: confidential
Standard Flow Enabled: ON
Direct Access Grants Enabled: ON
Valid Redirect URIs: http://localhost:3000/*
Web Origins: http://localhost:3000
```

### 3. Configurar Usuarios
En Keycloak, crear usuarios que luego se vincularán automáticamente con la base de datos local.

## Instalación y Setup

### 1. Instalar dependencias
```bash
cd src/turnos-api
npm install
```

### 2. Configurar variables de entorno
Crear archivo `.env` con las variables mencionadas arriba.

### 3. Inicializar base de datos
```bash
# La sincronización automática creará las tablas
npm run start:dev
```

### 4. Seed de roles y permisos
```bash
npm run seed:rbac
```

Esto creará:
- **3 roles**: administrator, gestor, user
- **20+ permisos** para diferentes acciones

### 5. Asignar roles a usuarios/gestores

Usar los endpoints de RBAC (solo admin puede acceder):

```bash
POST /rbac/users/:userId/role
POST /rbac/gestores/:gestorId/role
Body: { "roleId": "uuid-del-rol" }
```

## Permisos del Sistema

### Gestión de Roles y Permisos
- `manage_roles` - Crear, editar y eliminar roles
- `manage_permissions` - Crear, editar y eliminar permisos
- `view_roles` - Ver roles del sistema
- `view_permissions` - Ver permisos del sistema

### Gestión de Agendas
- `create_agenda` - Crear agendas
- `view_agendas` - Ver agendas propias
- `view_all_agendas` - Ver todas las agendas (admin)
- `assign_gestores_to_agendas` - Asignar gestores a agendas (admin)

### Gestión de Calendarios
- `create_time_slot` - Crear espacios de tiempo
- `view_time_slots` - Ver espacios de tiempo
- `view_own_calendar` - Ver calendario propio
- `view_all_calendars` - Ver todos los calendarios (admin)
- `delete_time_slot` - Eliminar espacios de tiempo

### Gestión de Turnos
- `create_turno` - Crear turnos
- `view_turnos` - Ver turnos
- `cancel_turno` - Cancelar turnos
- `manage_turnos` - Gestionar todos los turnos (admin)

### Gestión de Usuarios
- `view_users` - Ver usuarios del sistema
- `manage_users` - Gestionar usuarios

## Endpoints de RBAC

### Permisos
```
POST   /rbac/permissions              # Crear permiso (admin)
GET    /rbac/permissions              # Listar permisos
GET    /rbac/permissions/:id          # Ver permiso
DELETE /rbac/permissions/:id          # Eliminar permiso (admin)
```

### Roles
```
POST   /rbac/roles                    # Crear rol (admin)
GET    /rbac/roles                    # Listar roles
GET    /rbac/roles/:id                # Ver rol
PUT    /rbac/roles/:id                # Actualizar rol (admin)
DELETE /rbac/roles/:id                # Eliminar rol (admin)
```

### Asignación de Permisos a Roles
```
POST   /rbac/roles/:roleId/permissions    # Agregar permisos a rol (admin)
DELETE /rbac/roles/:roleId/permissions    # Remover permisos de rol (admin)
```

### Asignación de Roles a Usuarios
```
POST /rbac/users/:userId/role          # Asignar rol a usuario (admin)
POST /rbac/gestores/:gestorId/role     # Asignar rol a gestor (admin)
```

## Endpoints Actualizados

### Agendas
```
POST   /agendas                       # Crear agenda (requiere: create_agenda)
GET    /agendas                       # Listar agendas (requiere: view_agendas o view_all_agendas)
GET    /agendas/:id                   # Ver agenda (requiere: view_agendas o view_all_agendas)
POST   /agendas/:id/gestores/:gestorId    # Asignar gestor (requiere: assign_gestores_to_agendas)
DELETE /agendas/:id/gestores/:gestorId    # Remover gestor (requiere: assign_gestores_to_agendas)
```

### Calendarios (Time Slots)
```
POST   /time-slots                           # Crear time slot (requiere: create_time_slot)
GET    /time-slots/agenda/:agendaId          # Ver time slots de agenda (requiere: view_time_slots)
GET    /time-slots/gestor/my-calendar        # Ver mi calendario (requiere: view_own_calendar)
GET    /time-slots/gestor/:gestorId/calendar # Ver calendario de gestor (requiere: view_all_calendars)
GET    /time-slots/available/:agendaId       # Ver slots disponibles (requiere: view_time_slots)
DELETE /time-slots/:id                       # Eliminar time slot (requiere: delete_time_slot)
```

## Flujo de Autenticación

### Frontend
```javascript
// 1. Login con Keycloak
const keycloak = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'turnos-realm',
  clientId: 'turnos-frontend'
});

await keycloak.init({ onLoad: 'login-required' });

// 2. Obtener token
const token = keycloak.token;

// 3. Hacer request a API
fetch('http://localhost:3000/agendas', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Backend
```typescript
// 1. El KeycloakAuthGuard valida el token
// 2. El KeycloakStrategy extrae info del usuario
// 3. Busca usuario en DB local por keycloakId o email
// 4. Carga rol y permisos del usuario
// 5. El PermissionsGuard verifica permisos requeridos
// 6. Permite o deniega acceso
```

## Migración de Usuarios Existentes

Si ya tienes usuarios en la base de datos:

1. **Crear usuarios en Keycloak** con los mismos emails
2. **Asignar roles** a los usuarios locales usando los endpoints de RBAC
3. **Al primer login**, el sistema vinculará automáticamente el `keycloakId`

## Testing

### 1. Crear usuario administrador
```bash
# En Keycloak, crear usuario: admin@example.com
# En la BD local, crear gestor con el mismo email
# Asignar rol administrator al gestor
```

### 2. Probar autenticación
```bash
# Login en frontend con Keycloak
# Copiar JWT token
curl -H "Authorization: Bearer <token>" http://localhost:3000/agendas
```

### 3. Probar permisos
```bash
# Como admin
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/time-slots/gestor/any-gestor-id/calendar

# Como gestor (debería fallar)
curl -H "Authorization: Bearer <gestor-token>" \
  http://localhost:3000/time-slots/gestor/another-gestor-id/calendar
```

## Troubleshooting

### Error: "User not found in local database"
**Solución**: Crear el usuario/gestor en la base de datos local con el mismo email que en Keycloak.

### Error: "User has no assigned role"
**Solución**: Asignar un rol al usuario usando los endpoints de RBAC.

### Error: "Insufficient permissions"
**Solución**: Verificar que el rol del usuario tiene los permisos necesarios.

### Error de validación de token
**Solución**: Verificar que las variables de entorno de Keycloak están correctas (URL, realm, client ID).

## Seguridad

### ✅ Implementado
- Validación de tokens JWT con JWKS
- Control de acceso basado en permisos
- Separación entre autenticación y autorización
- Gestión de roles y permisos solo para admin
- Validación de acceso a recursos propios

### 🔒 Recomendaciones
- Usar HTTPS en producción
- Configurar CORS correctamente
- Implementar rate limiting
- Agregar logging de accesos
- Implementar auditoría de cambios en roles/permisos

## Próximos Pasos

1. Configurar Keycloak en producción
2. Implementar refresh tokens
3. Agregar logs de auditoría
4. Implementar notificaciones de cambios de permisos
5. Agregar interfaz de administración de RBAC
