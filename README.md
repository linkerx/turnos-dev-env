# Turnos - Sistema de Gestión de Turnos

Sistema de gestión de turnos con agendas compartidas entre gestores, desarrollado con NestJS, TypeORM y PostgreSQL.

## 🏗️ Arquitectura

Este proyecto sigue las guidelines de microservicios en monorepo:

```
turnos-dev-env/
├── src/
│   └── turnos-api/          # Backend NestJS
│       ├── src/
│       │   ├── auth/         # Autenticación JWT
│       │   ├── users/        # Usuarios
│       │   ├── gestores/     # Gestores
│       │   ├── agendas/      # Agendas compartidas
│       │   ├── time-slots/   # Espacios de tiempo
│       │   └── turnos/       # Reservas de turnos
│       ├── Dockerfile
│       └── Makefile
├── docker-compose.yml
├── Makefile
└── config/
    └── env.example
```

## ✨ Características

### Roles de Usuario

- **Usuarios**: Pueden reservar turnos en agendas disponibles
- **Gestores**: Pueden crear agendas, definir espacios de tiempo, y gestionar turnos

### Funcionalidades Clave

1. **Agendas Compartidas**: Múltiples gestores pueden compartir una agenda
2. **Espacios de Tiempo (Time Slots)**: Los gestores definen bloques de tiempo en agendas
3. **Validación de Solapamiento**: Los espacios de tiempo del mismo gestor NO pueden solaparse entre diferentes agendas
4. **Turnos con Selección**: Si hay solapamiento de gestores en una agenda, los usuarios pueden elegir
5. **Estados de Turno**: pending → confirmed → completed o cancelled

## 🚀 Inicio Rápido

### Primera Vez

```bash
# 1. Inicializar el proyecto
make init

# 2. Levantar los servicios
make up

# 3. Acceder a la API
# API: http://localhost:3000/api
# Swagger Docs: http://localhost:3000/api/docs
```

### Desarrollo Diario

```bash
# Ver logs
make logs
make logs-api

# Reiniciar servicios
make restart
make restart-api

# Detener servicios
make down
```

### Con Herramientas Adicionales (pgAdmin)

```bash
make up-tools
# pgAdmin: http://localhost:5050
# Email: admin@turnos.local
# Password: admin
```

## 📚 API Endpoints

### Autenticación

- `POST /api/auth/register` - Registrar usuario o gestor
- `POST /api/auth/login` - Iniciar sesión

### Agendas (Gestores)

- `POST /api/agendas` - Crear agenda
- `GET /api/agendas` - Listar agendas
- `GET /api/agendas/:id` - Ver agenda
- `POST /api/agendas/:id/gestores/:gestorId` - Agregar gestor
- `DELETE /api/agendas/:id/gestores/:gestorId` - Quitar gestor

### Time Slots (Gestores)

- `POST /api/time-slots` - Crear espacio de tiempo
- `GET /api/time-slots/agenda/:agendaId` - Ver espacios de una agenda
- `GET /api/time-slots/gestor/my-calendar` - Ver mi calendario completo
- `GET /api/time-slots/available/:agendaId` - Ver espacios disponibles
- `DELETE /api/time-slots/:id` - Eliminar espacio de tiempo

### Turnos

- `POST /api/turnos` - Reservar turno (Usuario)
- `GET /api/turnos/my-turnos` - Mis turnos (Usuario)
- `GET /api/turnos/gestor/my-turnos` - Turnos de mis espacios (Gestor)
- `GET /api/turnos/overlapping` - Ver gestores disponibles en un horario
- `PATCH /api/turnos/:id/confirm` - Confirmar turno (Gestor)
- `PATCH /api/turnos/:id/cancel` - Cancelar turno
- `PATCH /api/turnos/:id/complete` - Marcar como completado (Gestor)

## 🔧 Comandos Útiles

```bash
# Ver ayuda
make help

# Desarrollo local (sin Docker)
make dev-api

# Tests
make test-api

# Linting
make lint-api

# Formateo de código
make format-api

# Shell en contenedor
make shell-api
make shell-db

# Backup/Restore Database
make backup-db
make restore-db BACKUP=backup_20240115_120000.sql

# Limpiar todo
make clean
make down-volumes  # ⚠️ Elimina datos
```

## 🗄️ Base de Datos

### Entidades

- **User**: Usuarios que reservan turnos
- **Gestor**: Gestores que administran agendas
- **Agenda**: Contenedor de espacios de tiempo, compartida por gestores
- **TimeSlot**: Espacio de tiempo definido por un gestor en una agenda
- **Turno**: Reserva de un usuario en un espacio de tiempo específico

### Relaciones

```
Gestor ←→ Agenda (many-to-many)
Gestor → TimeSlot (one-to-many)
Agenda → TimeSlot (one-to-many)
TimeSlot → Turno (one-to-many)
User → Turno (one-to-many)
```

## 🔐 Seguridad

- Autenticación JWT
- Roles: `user` y `gestor`
- Guards para proteger endpoints
- Validación de permisos en operaciones

## 🧪 Testing

```bash
# Unit tests
make test-api

# E2E tests
cd src/turnos-api && npm run test:e2e

# Coverage
cd src/turnos-api && npm run test:cov
```

## 📦 Migración a Microservicios

Este proyecto está estructurado como monorepo pero puede separarse fácilmente en microservicios independientes:

1. Mover `src/turnos-api` a su propio repositorio
2. El Dockerfile y Makefile ya están incluidos
3. Versionar con tags semánticos (v1.0.0, v1.1.0, etc.)
4. Crear un `deploy-env` separado con docker-compose de producción

## 🐛 Troubleshooting

### El contenedor de la API no inicia

```bash
make logs-api
# Verificar errores de conexión a DB
```

### Error de conexión a PostgreSQL

```bash
# Verificar que postgres esté corriendo
make ps

# Reiniciar postgres
docker-compose restart postgres
```

### Cambios en el código no se reflejan

```bash
# El hot reload debería funcionar automáticamente
# Si no funciona, reiniciar:
make restart-api
```

## 📝 Variables de Entorno

Ver `config/env.example` para todas las variables disponibles.

Principales:

- `API_PORT`: Puerto de la API (default: 3000)
- `DB_*`: Configuración de PostgreSQL
- `JWT_SECRET`: Secret para tokens JWT (cambiar en producción)
- `JWT_EXPIRES_IN`: Tiempo de expiración de tokens (default: 7d)

## 🤝 Contribuir

Este proyecto sigue las guidelines de microservicios. Ver `guidelines/` para más detalles.

## 📄 Licencia

MIT
