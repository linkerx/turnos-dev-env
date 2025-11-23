# Autenticación y Autorización

## Índice
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Keycloak (Autenticación)](#keycloak-autenticación)
- [RBAC Local (Autorización)](#rbac-local-autorización)
- [Flujo de Autenticación](#flujo-de-autenticación)
- [Guards (Protección de Rutas)](#guards-protección-de-rutas)
- [Estrategias de Autenticación](#estrategias-de-autenticación)
- [Configuración](#configuración)

## Arquitectura del Sistema

El sistema utiliza una **arquitectura dual** de autenticación y autorización:

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENTE / FRONTEND                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
        ┌──────────────────────────────────┐
        │         KEYCLOAK (SSO)           │
        │  - Autenticación centralizada    │
        │  - Gestión de usuarios           │
        │  - Emisión de JWT (RS256)        │
        └──────────────────────────────────┘
                           │
                           │ JWT Token
                           ▼
        ┌──────────────────────────────────┐
        │         TURNOS API (NestJS)      │
        │                                  │
        │  ┌────────────────────────────┐  │
        │  │  KeycloakStrategy          │  │
        │  │  - Valida JWT con JWKS     │  │
        │  │  - Extrae usuario          │  │
        │  └────────────────────────────┘  │
        │             │                    │
        │             ▼                    │
        │  ┌────────────────────────────┐  │
        │  │  Base de Datos Local       │  │
        │  │  - Busca usuario por email │  │
        │  │  - Carga rol y permisos    │  │
        │  └────────────────────────────┘  │
        │             │                    │
        │             ▼                    │
        │  ┌────────────────────────────┐  │
        │  │  PermissionsGuard          │  │
        │  │  - Verifica permisos       │  │
        │  │  - Permite/Deniega acceso  │  │
        │  └────────────────────────────┘  │
        └──────────────────────────────────┘
```

### Separación de Responsabilidades

| Componente | Responsabilidad | Dónde se almacena |
|------------|-----------------|-------------------|
| **Keycloak** | Autenticación (¿Quién eres?) | Servidor Keycloak |
| **RBAC Local** | Autorización (¿Qué puedes hacer?) | Base de datos PostgreSQL |

## Keycloak (Autenticación)

### ¿Qué es Keycloak?

Keycloak es un servidor de Identity and Access Management (IAM) open-source que proporciona:

- **Single Sign-On (SSO)**: Un usuario se autentica una vez y accede a múltiples aplicaciones
- **Gestión centralizada de usuarios**: Todos los usuarios en un solo lugar
- **Soporte para múltiples protocolos**: OpenID Connect, OAuth 2.0, SAML
- **Federación de identidades**: Integración con Active Directory, LDAP, redes sociales, etc.

### Configuración de Keycloak

**Variables de entorno requeridas:**

```bash
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=turnos-realm
KEYCLOAK_CLIENT_ID=turnos-api
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

### Flujo de Autenticación con Keycloak

```
1. Usuario → Keycloak
   POST /realms/turnos-realm/protocol/openid-connect/token
   Body: username, password, client_id, client_secret

   ↓

2. Keycloak valida credenciales

   ↓

3. Keycloak → Usuario
   Response: { access_token, refresh_token, expires_in }

   ↓

4. Usuario → Turnos API
   Header: Authorization: Bearer <access_token>

   ↓

5. KeycloakStrategy valida token
   - Descarga JWKS de Keycloak
   - Verifica firma RSA del token
   - Extrae payload (sub, email, name, roles)

   ↓

6. Busca usuario en BD local por email o keycloakId
   - Si existe: carga rol y permisos
   - Si no existe: error 401

   ↓

7. Request.user = { id, email, nombre, role, permissions, ... }
```

### Token JWT de Keycloak

**Estructura del token:**

```json
{
  "sub": "a1b2c3d4-5678-90ab-cdef-1234567890ab",  // Keycloak User ID
  "email": "usuario@example.com",
  "preferred_username": "usuario",
  "name": "Juan Pérez",
  "realm_access": {
    "roles": ["user", "offline_access"]
  },
  "resource_access": {
    "turnos-api": {
      "roles": ["user"]
    }
  },
  "exp": 1700000000,                               // Expiration timestamp
  "iat": 1699996400,                               // Issued at timestamp
  "iss": "http://localhost:8080/realms/turnos-realm"
}
```

**Algoritmo de firma:** RS256 (RSA Signature with SHA-256)

**Validación:**
- La API descarga las claves públicas (JWKS) de Keycloak
- Verifica la firma del token
- Valida la expiración
- Extrae el payload

### KeycloakStrategy (Implementación)

Ubicación: `/src/auth/strategies/keycloak.strategy.ts`

```typescript
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Gestor) private gestorRepo: Repository<Gestor>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,                    // Cache JWKS
        rateLimit: true,                // Limitar peticiones
        jwksRequestsPerMinute: 5,       // Máximo 5 requests/min
        jwksUri: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/certs`,
      }),
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      algorithms: ['RS256'],            // Solo RSA
      ignoreExpiration: false,          // Validar expiración
    });
  }

  async validate(payload: any) {
    // 1. Buscar usuario por keycloakId
    let user = await this.userRepo.findOne({
      where: { keycloakId: payload.sub },
      relations: ['role', 'role.permissions'],
    });

    // 2. Si no existe, buscar por email
    if (!user) {
      user = await this.userRepo.findOne({
        where: { email: payload.email },
        relations: ['role', 'role.permissions'],
      });

      // 3. Actualizar keycloakId en primer login
      if (user) {
        user.keycloakId = payload.sub;
        await this.userRepo.save(user);
      }
    }

    // 4. Si no es User, buscar en Gestores
    if (!user) {
      // Similar lógica para gestores...
    }

    // 5. Si no existe, error
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado en el sistema');
    }

    // 6. Retornar usuario con permisos
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      keycloakId: payload.sub,
      userType: 'user',  // o 'gestor'
      role: user.role,
      permissions: user.role?.permissions?.map(p => p.name) || [],
    };
  }
}
```

### Vinculación de Usuarios

**Primera autenticación:**
1. Usuario se registra/existe en Keycloak
2. Usuario se registra localmente en Turnos API (o admin lo crea)
3. Usuario hace login en Keycloak → obtiene token
4. Usuario hace request a la API con token
5. API busca usuario por email
6. API guarda `keycloakId` del usuario
7. Futuras autenticaciones usan `keycloakId` directamente

**Flujo de vinculación:**
```
Keycloak User (sub: abc-123, email: user@example.com)
          ↓
Primera petición a API
          ↓
Buscar en BD: WHERE keycloakId = 'abc-123' → No existe
          ↓
Buscar en BD: WHERE email = 'user@example.com' → Existe
          ↓
UPDATE users SET keycloakId = 'abc-123' WHERE email = 'user@example.com'
          ↓
Futuras peticiones: buscar por keycloakId (más rápido)
```

## RBAC Local (Autorización)

### ¿Por qué RBAC local?

Aunque Keycloak soporta roles, usamos RBAC local porque:

1. **Granularidad**: Necesitamos permisos específicos del negocio
2. **Flexibilidad**: Modificar permisos sin cambiar Keycloak
3. **Auditoría**: Control total sobre cambios de permisos
4. **Integración**: Permisos vinculados a entidades de negocio (agendas, espacios, etc.)

### Modelo de Datos RBAC

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│    User     │────M:1──│    Role     │────M:M──│  Permission  │
└─────────────┘         └─────────────┘         └──────────────┘
       │                      │
       │ role_id         role_permissions
       │                      │
┌─────────────┐               │
│   Gestor    │────M:1────────┘
└─────────────┘
```

**Entidades:**

- **User / Gestor**: Tiene un `role_id`
- **Role**: Tiene múltiples `permissions` (many-to-many)
- **Permission**: Define una acción sobre un recurso

### Permisos

Cada permiso tiene:

```typescript
{
  id: string,              // UUID
  name: string,            // Nombre único (ej: 'manage_roles')
  description: string,     // Descripción legible
  resource: string,        // Recurso (ej: 'agenda', 'turno')
  action: string,          // Acción (ej: 'create', 'read', 'delete')
}
```

**Ejemplo:**
```json
{
  "name": "create_agenda",
  "description": "Permite crear agendas",
  "resource": "agenda",
  "action": "create"
}
```

### Roles

Cada rol agrupa permisos:

```typescript
{
  id: string,              // UUID
  name: string,            // 'administrator', 'gestor', 'user'
  description: string,     // Descripción del rol
  active: boolean,         // Si el rol está activo
  permissions: Permission[], // Array de permisos
}
```

Ver [Roles y Permisos](./02-roles-permisos.md) para detalles completos.

## Flujo de Autenticación

### Opción 1: Keycloak (Producción)

```bash
# 1. Autenticar en Keycloak
curl -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_SECRET" \
  -d "username=gestor@example.com" \
  -d "password=password123" \
  -d "grant_type=password"

# Response:
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "expires_in": 300,
#   "refresh_expires_in": 1800,
#   "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "Bearer"
# }

# 2. Usar el access_token
curl http://localhost:3000/api/agendas \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Opción 2: JWT Local (Desarrollo)

```bash
# 1. Registro local
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gestor@example.com",
    "password": "password123",
    "nombre": "Juan Gestor",
    "telefono": "+123456789",
    "role": "gestor"
  }'

# Response:
# {
#   "id": "uuid-123",
#   "email": "gestor@example.com",
#   "nombre": "Juan Gestor",
#   "role": "gestor"
# }

# 2. Login local
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gestor@example.com",
    "password": "password123"
  }'

# Response:
# {
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": "uuid-123",
#     "email": "gestor@example.com",
#     "nombre": "Juan Gestor",
#     "role": "gestor"
#   }
# }

# 3. Usar el accessToken
curl http://localhost:3000/api/turnos/my-turnos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Guards (Protección de Rutas)

Los guards son filtros que protegen los endpoints verificando autenticación y permisos.

### KeycloakAuthGuard

**Ubicación**: `/src/auth/guards/keycloak-auth.guard.ts`

**Uso**: Endpoints que requieren autenticación con Keycloak

```typescript
@Controller('agendas')
@UseGuards(KeycloakAuthGuard)  // Requiere token de Keycloak
export class AgendasController {
  @Get()
  findAll(@CurrentUser() user) {
    // user ya está autenticado
  }
}
```

**Características:**
- Valida JWT token de Keycloak
- Soporta `@IsPublic()` decorator para endpoints públicos
- Ejecuta `KeycloakStrategy.validate()`

### PermissionsGuard

**Ubicación**: `/src/auth/guards/permissions.guard.ts`

**Uso**: Endpoints que requieren permisos específicos

```typescript
@Controller('agendas')
@UseGuards(KeycloakAuthGuard, PermissionsGuard)  // Orden importa
export class AgendasController {

  @Post()
  @RequirePermissions('create_agenda')  // Decorator de permisos
  create(@Body() dto: CreateAgendaDto, @CurrentUser() user) {
    // user tiene permiso 'create_agenda'
  }

  @Get()
  @RequirePermissions('view_agendas', 'view_all_agendas')  // OR lógico
  findAll(@CurrentUser() user) {
    // user tiene 'view_agendas' O 'view_all_agendas'
  }
}
```

**Características:**
- Verifica que el usuario tenga AL MENOS UNO de los permisos especificados (OR lógico)
- Lee permisos de `user.role.permissions`
- Retorna 403 Forbidden si no tiene permisos

### JwtAuthGuard (Legacy)

**Ubicación**: `/src/auth/guards/jwt-auth.guard.ts`

**Uso**: Endpoints que usan JWT local (principalmente Turnos)

```typescript
@Controller('turnos')
@UseGuards(JwtAuthGuard)  // JWT local
export class TurnosController {
  @Get('my-turnos')
  findMyTurnos(@CurrentUser() user) {
    // ...
  }
}
```

### RolesGuard (Legacy)

**Ubicación**: `/src/auth/guards/roles.guard.ts`

**Uso**: Endpoints que verifican roles simples

```typescript
@Controller('turnos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TurnosController {

  @Post()
  @Roles('user')  // Solo usuarios con rol 'user'
  create(@Body() dto: CreateTurnoDto) {
    // ...
  }

  @Patch(':id/confirm')
  @Roles('gestor')  // Solo gestores
  confirm(@Param('id') id: string) {
    // ...
  }
}
```

### Stack de Guards

**Orden de ejecución:**

```
Request → KeycloakAuthGuard → PermissionsGuard → Controller
             │                      │
             ▼                      ▼
   Valida JWT Token        Verifica Permisos
   Carga Usuario           Allow/Deny
```

**Importante:**
- KeycloakAuthGuard debe ir ANTES de PermissionsGuard
- JwtAuthGuard y KeycloakAuthGuard son mutuamente excluyentes
- Si falta el guard de autenticación, `@CurrentUser()` será undefined

## Estrategias de Autenticación

### KeycloakStrategy

Ver sección [KeycloakStrategy](#keycloakstrategy-implementación) arriba.

### JwtStrategy

**Ubicación**: `/src/auth/strategies/jwt.strategy.ts`

```typescript
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Gestor) private gestorRepo: Repository<Gestor>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,  // Secret local
    });
  }

  async validate(payload: any) {
    const { sub, email, role } = payload;

    // Buscar usuario según el rol
    if (role === 'user') {
      const user = await this.userRepo.findOne({ where: { id: sub } });
      return { id: user.id, email: user.email, role: 'user' };
    } else if (role === 'gestor') {
      const gestor = await this.gestorRepo.findOne({ where: { id: sub } });
      return { id: gestor.id, email: gestor.email, role: 'gestor' };
    }

    return null;
  }
}
```

**Diferencias con Keycloak:**
- Usa secreto simétrico (HS256) en lugar de RSA (RS256)
- Token emitido localmente por `/auth/login`
- No tiene integración con SSO
- Solo usado en endpoints de Turnos

## Configuración

### Variables de Entorno

```bash
# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=turnos-realm
KEYCLOAK_CLIENT_ID=turnos-api
KEYCLOAK_CLIENT_SECRET=your-client-secret-here

# JWT Local (para desarrollo)
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=turnos_db
```

### Configuración de Keycloak

1. **Crear Realm**: `turnos-realm`
2. **Crear Client**:
   - Client ID: `turnos-api`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3000/*`
3. **Habilitar Direct Access Grants**: Para login con username/password
4. **Copiar Client Secret**: Usar en `KEYCLOAK_CLIENT_SECRET`

### Inicializar RBAC

```bash
npm run seed:rbac
```

Esto crea:
- 3 roles (administrator, gestor, user)
- 20+ permisos
- Asignación de permisos a roles

## Decoradores Personalizados

### @CurrentUser()

Extrae el usuario autenticado del request.

```typescript
@Get('profile')
getProfile(@CurrentUser() user) {
  // user = { id, email, nombre, role, permissions, ... }
  return user;
}
```

### @RequirePermissions(...permissions)

Especifica permisos requeridos (OR lógico).

```typescript
@Post('agendas')
@RequirePermissions('create_agenda')
create() { }

@Get('agendas')
@RequirePermissions('view_agendas', 'view_all_agendas')  // OR
findAll() { }
```

### @Roles(...roles)

Especifica roles requeridos (OR lógico).

```typescript
@Post('turnos')
@Roles('user')
create() { }

@Patch(':id/confirm')
@Roles('gestor', 'administrator')  // OR
confirm() { }
```

### @IsPublic()

Marca un endpoint como público (sin autenticación).

```typescript
@Post('register')
@IsPublic()
register(@Body() dto: RegisterDto) { }
```

## Seguridad

### Mejores Prácticas

1. **Nunca almacenar tokens en localStorage**: Usar httpOnly cookies
2. **Rotar client secrets regularmente**: En Keycloak
3. **Validar tokens en cada request**: No confiar en tokens viejos
4. **Usar HTTPS en producción**: Para proteger tokens en tránsito
5. **Implementar refresh tokens**: Para sesiones de larga duración
6. **Logging de accesos**: Registrar intentos de acceso no autorizados

### Refresh Tokens

Keycloak retorna `refresh_token` junto con `access_token`:

```bash
# Renovar token
curl -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_SECRET" \
  -d "refresh_token=REFRESH_TOKEN_HERE" \
  -d "grant_type=refresh_token"
```

### Expiración de Tokens

- **Access Token**: 5 minutos (configurable en Keycloak)
- **Refresh Token**: 30 minutos (configurable en Keycloak)
- **JWT Local**: 7 días (configurable en `.env`)

## Troubleshooting

### Error: "Invalid signature"

- Verificar que `KEYCLOAK_URL` y `KEYCLOAK_REALM` sean correctos
- Verificar que el token no haya expirado
- Verificar que Keycloak esté accesible

### Error: "Usuario no encontrado en el sistema"

- El usuario existe en Keycloak pero no en la BD local
- Registrar el usuario localmente primero con `/auth/register`
- O crear el usuario directamente en la BD

### Error: "Forbidden resource"

- El usuario no tiene el permiso requerido
- Verificar permisos del rol: `GET /api/rbac/roles/:id`
- Asignar permisos al rol: `POST /api/rbac/roles/:roleId/permissions`

### Error: "Unauthorized"

- Token no válido o expirado
- Token no presente en el header `Authorization`
- Formato incorrecto: debe ser `Bearer <token>`

---

[← Volver al índice](./README.md) | [Siguiente: Roles y Permisos →](./02-roles-permisos.md)
