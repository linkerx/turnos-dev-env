# Guía de Ejemplos de Uso

## Índice
- [Configuración Inicial](#configuración-inicial)
- [Escenario 1: Consultorio Médico Simple](#escenario-1-consultorio-médico-simple)
- [Escenario 2: Hospital con Múltiples Especialidades](#escenario-2-hospital-con-múltiples-especialidades)
- [Escenario 3: Sistema de Guardias Rotativos](#escenario-3-sistema-de-guardias-rotativos)
- [Escenario 4: Gestión de Permisos Personalizados](#escenario-4-gestión-de-permisos-personalizados)

## Configuración Inicial

### 1. Inicializar el Sistema

```bash
# 1. Ejecutar seed de RBAC (crear roles y permisos predefinidos)
cd src/turnos-api
npm run seed:rbac

# Output esperado:
# ✅ Permisos creados: 20+
# ✅ Roles creados: administrator, gestor, user
# ✅ Permisos asignados a roles
```

### 2. Crear Usuario Administrador

```bash
# Opción A: Registro local
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "AdminPass123!",
    "nombre": "Administrador Principal",
    "telefono": "+54 11 1111-1111",
    "role": "gestor"
  }'

# Response: { "id": "uuid-gestor-admin", ... }

# Opción B: Crear en Keycloak (recomendado para producción)
# - Acceder a consola de Keycloak
# - Crear usuario con email: admin@hospital.com
# - Asignar password
# - Usuario se vinculará en primer login
```

### 3. Asignar Rol de Administrador

```bash
# Primero obtener token de Keycloak (omitir si usas JWT local)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_SECRET" \
  -d "username=admin@hospital.com" \
  -d "password=AdminPass123!" \
  -d "grant_type=password" | jq -r '.access_token')

# Obtener ID del rol administrator
ADMIN_ROLE_ID=$(curl -s http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.name == "administrator") | .id')

# Obtener ID del gestor admin
ADMIN_GESTOR_ID="uuid-gestor-admin"  # Del paso anterior

# Asignar rol
curl -X POST http://localhost:3000/api/rbac/gestores/$ADMIN_GESTOR_ID/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roleId\": \"$ADMIN_ROLE_ID\"}"

# ✅ Admin configurado
```

---

## Escenario 1: Consultorio Médico Simple

**Contexto**: Un médico que tiene su propio consultorio y quiere ofrecer turnos online.

### Paso 1: Registro del Médico

```bash
# Registrar médico como gestor
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor.perez@consultorio.com",
    "password": "DoctorPass123",
    "nombre": "Dr. Juan Pérez",
    "telefono": "+54 11 2222-2222",
    "role": "gestor"
  }'

# Response: { "id": "uuid-gestor-perez", ... }
```

### Paso 2: Asignar Rol de Gestor

```bash
# Admin asigna rol "gestor"
GESTOR_ROLE_ID=$(curl -s http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.name == "gestor") | .id')

curl -X POST http://localhost:3000/api/rbac/gestores/uuid-gestor-perez/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roleId\": \"$GESTOR_ROLE_ID\"}"
```

### Paso 3: Médico Crea su Agenda

```bash
# Login del médico
GESTOR_TOKEN=$(curl -s -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_SECRET" \
  -d "username=doctor.perez@consultorio.com" \
  -d "password=DoctorPass123" \
  -d "grant_type=password" | jq -r '.access_token')

# Crear agenda personal
AGENDA_ID=$(curl -s -X POST http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $GESTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Consultorio Dr. Pérez",
    "descripcion": "Medicina general y clínica",
    "gestorIds": ["uuid-gestor-perez"]
  }' | jq -r '.id')

echo "Agenda creada: $AGENDA_ID"
```

### Paso 4: Definir Horarios de Atención

```bash
# Lunes a Viernes: 9:00-13:00 (turnos de 30 min)
for day in 20 21 22 23 24; do
  curl -X POST http://localhost:3000/api/espacios \
    -H "Authorization: Bearer $GESTOR_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"agendaId\": \"$AGENDA_ID\",
      \"startTime\": \"2025-01-${day}T09:00:00.000Z\",
      \"endTime\": \"2025-01-${day}T13:00:00.000Z\",
      \"slotDuration\": 30
    }"
  echo "Espacio creado para 2025-01-$day"
done

# Verificar calendario
curl http://localhost:3000/api/espacios/gestor/my-calendar \
  -H "Authorization: Bearer $GESTOR_TOKEN"
```

### Paso 5: Paciente Reserva un Turno

```bash
# Registrar paciente
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente@example.com",
    "password": "Pass123",
    "nombre": "María García",
    "telefono": "+54 11 3333-3333",
    "role": "user"
  }'

# Admin asigna rol "user"
USER_ROLE_ID=$(curl -s http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.name == "user") | .id')

curl -X POST http://localhost:3000/api/rbac/users/uuid-user-maria/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roleId\": \"$USER_ROLE_ID\"}"

# Login del paciente (JWT local para turnos)
USER_JWT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "paciente@example.com",
    "password": "Pass123"
  }' | jq -r '.accessToken')

# Buscar espacios disponibles
curl "http://localhost:3000/api/espacios/available/$AGENDA_ID?date=2025-01-20" \
  -H "Authorization: Bearer $KEYCLOAK_USER_TOKEN"

# Reservar turno (nota: usar JWT local, no Keycloak)
ESPACIO_ID="uuid-espacio-lunes"
curl -X POST http://localhost:3000/api/turnos \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"espacioId\": \"$ESPACIO_ID\",
    \"startTime\": \"2025-01-20T09:30:00.000Z\",
    \"notas\": \"Control de presión arterial\"
  }"

# Ver mis turnos
curl http://localhost:3000/api/turnos/my-turnos \
  -H "Authorization: Bearer $USER_JWT"
```

### Paso 6: Médico Confirma el Turno

```bash
# Login gestor con JWT local
GESTOR_JWT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor.perez@consultorio.com",
    "password": "DoctorPass123"
  }' | jq -r '.accessToken')

# Ver turnos pendientes
curl http://localhost:3000/api/turnos/gestor/my-turnos \
  -H "Authorization: Bearer $GESTOR_JWT"

# Confirmar turno
TURNO_ID="uuid-turno-123"
curl -X PATCH http://localhost:3000/api/turnos/$TURNO_ID/confirm \
  -H "Authorization: Bearer $GESTOR_JWT"

# Después de la atención, marcar como completado
curl -X PATCH http://localhost:3000/api/turnos/$TURNO_ID/complete \
  -H "Authorization: Bearer $GESTOR_JWT"
```

---

## Escenario 2: Hospital con Múltiples Especialidades

**Contexto**: Hospital con varios departamentos y especialistas que comparten agendas.

### Paso 1: Admin Crea Gestores para Cada Especialidad

```bash
# Crear gestores para cardiología
for doctor in "Dr. Carlos López" "Dra. Ana Martínez"; do
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${doctor// /.}@hospital.com\",
      \"password\": \"HospitalPass123\",
      \"nombre\": \"$doctor\",
      \"role\": \"gestor\"
    }"
done

# Asignar rol gestor a cada uno (similar a ejemplo anterior)
```

### Paso 2: Crear Agendas por Especialidad

```bash
# Agenda de Cardiología con 2 médicos
CARDIO_AGENDA=$(curl -s -X POST http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Cardiología Hospital Central",
    "descripcion": "Consultas cardiológicas especializadas",
    "gestorIds": ["uuid-carlos-lopez", "uuid-ana-martinez"]
  }' | jq -r '.id')

# Agenda de Pediatría
PEDIA_AGENDA=$(curl -s -X POST http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Pediatría Hospital Central",
    "descripcion": "Atención pediátrica general",
    "gestorIds": ["uuid-pediatra-1", "uuid-pediatra-2"]
  }' | jq -r '.id')

echo "Agendas creadas: Cardiología=$CARDIO_AGENDA, Pediatría=$PEDIA_AGENDA"
```

### Paso 3: Cada Médico Define su Disponibilidad

```bash
# Dr. Carlos López (Cardiólogo) - Lunes y Miércoles
CARLOS_TOKEN="..."

curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $CARLOS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agendaId\": \"$CARDIO_AGENDA\",
    \"startTime\": \"2025-01-20T08:00:00.000Z\",
    \"endTime\": \"2025-01-20T12:00:00.000Z\",
    \"slotDuration\": 45
  }"

# Dra. Ana Martínez (Cardióloga) - Martes y Jueves
ANA_TOKEN="..."

curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $ANA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agendaId\": \"$CARDIO_AGENDA\",
    \"startTime\": \"2025-01-21T14:00:00.000Z\",
    \"endTime\": \"2025-01-21T18:00:00.000Z\",
    \"slotDuration\": 45
  }"
```

### Paso 4: Pacientes Reservan por Especialidad

```bash
# Usuario busca agenda de cardiología
USER_TOKEN="..."

# Ver agendas disponibles
curl http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $USER_TOKEN" | jq '.[] | {nombre, descripcion}'

# Ver horarios disponibles en cardiología
curl "http://localhost:3000/api/espacios/available/$CARDIO_AGENDA" \
  -H "Authorization: Bearer $USER_TOKEN"

# Reservar con Dr. Carlos López (lunes)
USER_JWT="..."  # JWT local
curl -X POST http://localhost:3000/api/turnos \
  -H "Authorization: Bearer $USER_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"espacioId\": \"espacio-carlos-lunes\",
    \"startTime\": \"2025-01-20T09:00:00.000Z\",
    \"notas\": \"Dolor en el pecho\"
  }"
```

---

## Escenario 3: Sistema de Guardias Rotativos

**Contexto**: Equipo de emergencias con guardias nocturnas compartidas.

### Paso 1: Admin Crea Grupo de Guardia

```bash
# Crear grupo con 4 médicos
GRUPO_GUARDIA=$(curl -s -X POST http://localhost:3000/api/grupos \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Guardia Nocturna Emergencias",
    "descripcion": "Equipo de guardia 20:00-08:00",
    "activo": true,
    "gestorIds": [
      "uuid-medico-1",
      "uuid-medico-2",
      "uuid-medico-3",
      "uuid-medico-4"
    ]
  }' | jq -r '.id')

echo "Grupo creado: $GRUPO_GUARDIA"
```

### Paso 2: Admin Crea Agenda de Emergencias

```bash
EMERGENCIAS_AGENDA=$(curl -s -X POST http://localhost:3000/api/agendas \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Sala de Emergencias",
    "descripcion": "Atención de emergencias 24/7",
    "gestorIds": [
      "uuid-medico-1",
      "uuid-medico-2",
      "uuid-medico-3",
      "uuid-medico-4"
    ]
  }' | jq -r '.id')
```

### Paso 3: Crear Espacios Grupales Rotativos

```bash
# Cualquier médico del grupo puede crear espacios grupales
MEDICO1_TOKEN="..."

# Semana 1: Guardia Lunes-Martes (20:00-08:00)
curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $MEDICO1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agendaId\": \"$EMERGENCIAS_AGENDA\",
    \"grupoId\": \"$GRUPO_GUARDIA\",
    \"startTime\": \"2025-01-20T20:00:00.000Z\",
    \"endTime\": \"2025-01-21T08:00:00.000Z\",
    \"slotDuration\": 60
  }"

# Semana 2: Guardia Miércoles-Jueves (20:00-08:00)
curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $MEDICO1_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agendaId\": \"$EMERGENCIAS_AGENDA\",
    \"grupoId\": \"$GRUPO_GUARDIA\",
    \"startTime\": \"2025-01-22T20:00:00.000Z\",
    \"endTime\": \"2025-01-23T08:00:00.000Z\",
    \"slotDuration\": 60
  }"

# ✅ El sistema verifica que NINGÚN médico del grupo tenga solapamientos
```

### Paso 4: Verificar que No Hay Solapamientos

```bash
# Si un médico del grupo intenta crear espacio individual en horario de guardia
MEDICO2_TOKEN="..."

curl -X POST http://localhost:3000/api/espacios \
  -H "Authorization: Bearer $MEDICO2_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"agendaId\": \"otra-agenda-uuid\",
    \"startTime\": \"2025-01-20T22:00:00.000Z\",
    \"endTime\": \"2025-01-21T02:00:00.000Z\",
    \"slotDuration\": 30
  }"

# ❌ Error 409: "El gestor ya tiene un espacio que se solapa con este horario"
```

---

## Escenario 4: Gestión de Permisos Personalizados

**Contexto**: Hospital necesita rol de "Recepcionista" con permisos específicos.

### Paso 1: Listar Permisos Disponibles

```bash
curl http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.[] | {name, description}'
```

### Paso 2: Crear Rol Personalizado

```bash
# Obtener IDs de permisos necesarios
VIEW_AGENDAS_ID=$(curl -s http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.name == "view_all_agendas") | .id')

VIEW_ESPACIOS_ID=$(curl -s http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.name == "view_espacios") | .id')

VIEW_TURNOS_ID=$(curl -s http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.name == "view_turnos") | .id')

# Crear rol
RECEP_ROLE_ID=$(curl -s -X POST http://localhost:3000/api/rbac/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"recepcionista\",
    \"description\": \"Personal de recepción que gestiona turnos\",
    \"active\": true,
    \"permissionIds\": [
      \"$VIEW_AGENDAS_ID\",
      \"$VIEW_ESPACIOS_ID\",
      \"$VIEW_TURNOS_ID\"
    ]
  }" | jq -r '.id')

echo "Rol recepcionista creado: $RECEP_ROLE_ID"
```

### Paso 3: Crear Usuario Recepcionista

```bash
# Registrar como gestor (para tener más acceso)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recepcion@hospital.com",
    "password": "RecepPass123",
    "nombre": "Laura Recepcionista",
    "telefono": "+54 11 4444-4444",
    "role": "gestor"
  }'

# Asignar rol personalizado
curl -X POST http://localhost:3000/api/rbac/gestores/uuid-recepcionista/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roleId\": \"$RECEP_ROLE_ID\"}"
```

### Paso 4: Agregar Permisos Adicionales

```bash
# Agregar permiso para cancelar turnos
CANCEL_TURNO_ID=$(curl -s http://localhost:3000/api/rbac/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.name == "cancel_turno") | .id')

curl -X POST http://localhost:3000/api/rbac/roles/$RECEP_ROLE_ID/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"permissionIds\": [\"$CANCEL_TURNO_ID\"]}"

# Verificar rol actualizado
curl http://localhost:3000/api/rbac/roles/$RECEP_ROLE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.permissions'
```

---

## Scripts de Utilidad

### Script de Setup Completo

```bash
#!/bin/bash
# setup-hospital.sh

set -e

echo "🏥 Configurando Sistema de Turnos del Hospital"

# Variables
API_URL="http://localhost:3000/api"
KEYCLOAK_URL="http://localhost:8080"
REALM="turnos-realm"
CLIENT_ID="turnos-api"
CLIENT_SECRET="your-secret"

# 1. Seed RBAC
echo "📋 Inicializando RBAC..."
cd src/turnos-api
npm run seed:rbac

# 2. Función para obtener token de Keycloak
get_token() {
  local email=$1
  local password=$2

  curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
    -d "client_id=$CLIENT_ID" \
    -d "client_secret=$CLIENT_SECRET" \
    -d "username=$email" \
    -d "password=$password" \
    -d "grant_type=password" | jq -r '.access_token'
}

# 3. Crear admin
echo "👤 Creando administrador..."
ADMIN_ID=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "AdminPass123",
    "nombre": "Admin Principal",
    "role": "gestor"
  }' | jq -r '.id')

echo "✅ Admin creado: $ADMIN_ID"

echo "🎉 Setup completado!"
```

### Script de Testing

```bash
#!/bin/bash
# test-flow.sh - Prueba flujo completo usuario-gestor

set -e

API_URL="http://localhost:3000/api"

# Simular flujo completo
echo "🧪 Probando flujo completo..."

# 1. Gestor crea espacio
echo "1️⃣ Gestor creando espacio..."
# ... (código similar a ejemplos anteriores)

# 2. Usuario reserva turno
echo "2️⃣ Usuario reservando turno..."
# ...

# 3. Gestor confirma
echo "3️⃣ Gestor confirmando turno..."
# ...

echo "✅ Flujo completo exitoso!"
```

---

## Troubleshooting Común

### Error: 401 Unauthorized

```bash
# Causa: Token expirado o inválido
# Solución: Renovar token

# Para Keycloak (usar refresh token)
NEW_TOKEN=$(curl -s -X POST http://localhost:8080/realms/turnos-realm/protocol/openid-connect/token \
  -d "client_id=turnos-api" \
  -d "client_secret=YOUR_SECRET" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "grant_type=refresh_token" | jq -r '.access_token')

# Para JWT local (login nuevamente)
JWT=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}' | jq -r '.accessToken')
```

### Error: 409 Conflict (Solapamiento de Espacios)

```bash
# Causa: Gestor ya tiene espacio en ese horario
# Solución: Ver calendario del gestor

curl http://localhost:3000/api/espacios/gestor/my-calendar \
  -H "Authorization: Bearer $GESTOR_TOKEN" | jq '.[] | {startTime, endTime, agenda: .agenda.nombre}'

# Ajustar horarios para evitar solapamiento
```

### Error: 403 Forbidden

```bash
# Causa: Sin permisos suficientes
# Solución: Verificar permisos del usuario

# Ver mi rol y permisos (decodificar JWT)
echo $KEYCLOAK_TOKEN | cut -d'.' -f2 | base64 -d | jq

# O verificar en BD directamente
# SELECT r.name, p.name FROM users u
# JOIN roles r ON u.role_id = r.id
# JOIN role_permissions rp ON r.id = rp.role_id
# JOIN permissions p ON rp.permission_id = p.id
# WHERE u.email = 'user@example.com';
```

---

[← Anterior: Endpoints de Grupos](./08-endpoints-grupos.md) | [Volver al índice](./README.md)
