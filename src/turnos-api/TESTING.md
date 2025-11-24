# Testing Guide

Este documento describe cómo ejecutar tests y seeds en la aplicación de gestión de turnos.

## Seeds (Datos de Prueba)

### Sistema de Seeds Completo

El proyecto incluye un sistema completo de seeds para poblar la base de datos con datos de prueba.

#### Ejecutar todos los seeds

```bash
npm run seed
```

Este comando ejecutará los seeds en el siguiente orden:

1. **RBAC**: Roles y Permisos
2. **Users**: Usuarios del sistema
3. **Gestores**: Gestores de agendas
4. **Grupos**: Grupos de gestores
5. **Agendas**: Agendas compartidas
6. **Espacios**: Espacios de tiempo en calendarios
7. **Turnos**: Turnos reservados

#### Ejecutar solo RBAC seeds

```bash
npm run seed:rbac
```

### Datos incluidos en los seeds

#### Usuarios (Users)
- Admin Usuario (admin@example.com) - rol: administrator
- Juan Pérez (juan.perez@example.com) - rol: user
- María García (maria.garcia@example.com) - rol: user
- Carlos Rodríguez (carlos.rodriguez@example.com) - rol: user
- Ana Martínez (ana.martinez@example.com) - rol: user
- Luis Fernández (luis.fernandez@example.com) - rol: user

Contraseña para usuarios: `password123`
Contraseña para admin: `admin123`

#### Gestores
- Gestor Admin (gestor.admin@example.com) - rol: administrator
- Dr. Roberto González (dr.gonzalez@clinica.com) - rol: gestor
- Dra. Laura López (dra.lopez@clinica.com) - rol: gestor
- Dr. Jorge Sánchez (dr.sanchez@clinica.com) - rol: gestor
- Dra. Patricia Ramírez (dra.ramirez@clinica.com) - rol: gestor

Contraseña para gestores: `password123` (gestor123 para admin)

#### Grupos
- **Cardiología**: Dr. González y Dra. López
- **Pediatría**: Dr. Sánchez y Dra. Ramírez
- **Medicina General**: Dr. González y Dr. Sánchez

#### Agendas
- **Consultas Cardiología**: Gestores de cardiología
- **Consultas Pediatría**: Gestores de pediatría
- **Consultorios Externos**: Varios gestores
- **Emergencias**: Todos los gestores

#### Espacios
- Espacios individuales para cada gestor durante días laborables
- Espacios de grupo para sábados
- Duración de slots: 20-30 minutos según especialidad

#### Turnos
- Múltiples turnos distribuidos en diferentes espacios
- Estados variados: pending, confirmed, completed

## Testing

### Ejecutar todos los tests

```bash
npm test
```

### Ejecutar tests con coverage

```bash
npm run test:cov
```

### Ejecutar tests en modo watch

```bash
npm run test:watch
```

### Ejecutar tests e2e

```bash
npm run test:e2e
```

## Estructura de Tests

### Tests Unitarios

Los tests unitarios cubren los servicios principales:

- **AgendasService**: Gestión de agendas compartidas
- **EspaciosService**: Gestión de espacios de tiempo
- **TurnosService**: Gestión de turnos
- **GruposService**: Gestión de grupos de gestores
- **RbacService**: Gestión de roles y permisos

### Tests E2E

Los tests end-to-end cubren los endpoints principales de la API.

### Configuración de Testing

El proyecto utiliza:
- **Jest** como framework de testing
- **@nestjs/testing** para testing de módulos NestJS
- **TypeORM** con base de datos de prueba
- **supertest** para tests E2E

#### Configuración de Base de Datos de Prueba

Los tests utilizan una base de datos separada configurada en `src/test-utils/test-db.config.ts`.

Variables de entorno para testing (opcional):
```bash
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_USERNAME=postgres
TEST_DB_PASSWORD=postgres
TEST_DB_DATABASE=turnos_test_db
```

## Coverage Report

Después de ejecutar `npm run test:cov`, el reporte de cobertura estará disponible en:
- **Consola**: Resumen de cobertura por archivo
- **HTML**: `coverage/index.html` (abrir en navegador)

### Coverage Actual

- **Servicios principales**: >90% coverage
  - AgendasService: 98.18%
  - EspaciosService: 95.83%
  - TurnosService: 96.61%
  - GruposService: 90.76%
  - RbacService: 84%

- **Coverage general**: ~36% (los controllers requieren tests e2e adicionales)

## Factory para Tests

El proyecto incluye `TestDataFactory` en `src/test-utils/test-data.factory.ts` con métodos helper para crear datos de prueba:

```typescript
import { TestDataFactory } from '../test-utils/test-data.factory';

// Crear usuario de prueba
const user = await TestDataFactory.createUser({
  email: 'test@example.com',
  nombre: 'Test User',
});

// Crear gestor de prueba
const gestor = await TestDataFactory.createGestor({
  email: 'gestor@example.com',
  nombre: 'Test Gestor',
}, role);

// Y más...
```

## Mejores Prácticas

1. **Ejecutar tests antes de commit**: Siempre ejecuta los tests antes de hacer commit
2. **Mantener alto coverage**: Apunta a >80% de coverage en servicios
3. **Tests aislados**: Cada test debe ser independiente
4. **Usar factories**: Utiliza TestDataFactory para crear datos de prueba consistentes
5. **Limpiar después de tests**: Los tests E2E deben limpiar la base de datos

## Troubleshooting

### Error de conexión a base de datos
```bash
# Asegúrate de que PostgreSQL esté corriendo
docker-compose up -d postgres
```

### Tests lentos
```bash
# Usa --maxWorkers para limitar paralelismo
npm test -- --maxWorkers=4
```

### Errores de TypeORM
```bash
# Limpia y reconstruye la base de datos de prueba
# Los tests usan dropSchema: true por defecto
```
