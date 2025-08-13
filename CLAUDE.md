# CLAUDE.md - INTRANEURO Local Development

## Información del Proyecto
- **Nombre:** INTRANEURO - Sistema de Gestión Clínica
- **Tipo:** Sistema hospitalario para clínica psiquiátrica
- **Estado:** Proyecto local para entrenamiento (NO tocar producción)
- **Producción:** https://intraneuro.lat (NO modificar)

## Comandos Principales

### Backend (Node.js + Express)
```bash
# Navegar al backend
cd backend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Ver logs en desarrollo
npm run dev

# Verificar estado de la base de datos
npm run db:check
```

### Frontend (JavaScript Vanilla)
```bash
# Servir archivos estáticos (desde raíz del proyecto)
python3 -m http.server 8080
# o
npx serve .
# o
live-server
```

### Base de Datos (PostgreSQL)
```bash
# Conectar a la base de datos local
psql -U intraneuro_user -d intraneuro_db

# Inicializar esquema
psql -U intraneuro_user -d intraneuro_db -f database/schema.sql

# Importar datos de prueba
psql -U intraneuro_user -d intraneuro_db -f init_db.sql
```

## Estructura del Proyecto

### Frontend
- `index.html` - Dashboard principal
- `archivos.html` - Gestión de archivos
- `ficha-archivo.html` - Detalle de archivo
- `css/` - Estilos CSS modulares
- `js/` - JavaScript modular por funcionalidad

### Backend
- `server.js` - Punto de entrada
- `src/controllers/` - Lógica de negocio
- `src/models/` - Modelos de datos
- `src/routes/` - Definición de rutas API
- `src/middleware/` - Middleware de autenticación

## Variables de Entorno Locales
Crear archivo `.env` en `/backend/`:
```
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_NAME=intraneuro_db_local
DB_USER=postgres
DB_PASS=password
JWT_SECRET=mi_secreto_local_para_desarrollo
JWT_EXPIRE=8h
FRONTEND_URL=http://localhost:8080
```

## Comandos de Desarrollo

### Linting y Validación
```bash
# Si existe ESLint
npm run lint

# Si existe Prettier
npm run format

# Verificar tipos (si se usa TypeScript)
npm run typecheck
```

### Testing
```bash
# Ejecutar tests (si existen)
npm test

# Tests en modo watch
npm run test:watch
```

## URLs de Desarrollo
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api
- **Base de Datos:** localhost:5432

## Funcionalidades Principales
1. **Autenticación:** Login/logout con JWT
2. **Gestión de Pacientes:** CRUD completo + asignación de camas
3. **Observaciones:** Sistema de notas médicas
4. **Tareas Pendientes:** Seguimiento de tareas por paciente
5. **Dashboard:** Estadísticas en tiempo real
6. **Exportación:** Excel con datos de pacientes

## Notas Importantes
- ⚠️ **NUNCA** modificar archivos de producción
- ⚠️ Este es un entorno de **SOLO DESARROLLO**
- 🔄 Usar datos de prueba, no datos reales de pacientes
- 🚫 No conectar a la base de datos de producción
- 📚 Ideal para aprender desarrollo full-stack

## Flujo de Trabajo Recomendado
1. Hacer cambios en archivos locales
2. Probar en http://localhost:8080
3. Verificar API en http://localhost:3000/api
4. Usar herramientas de desarrollo del navegador
5. Experimentar sin miedo a romper nada

## Archivos Críticos para Desarrollo
- `js/main.js` - Orquestador principal
- `js/api.js` - Comunicación con backend
- `backend/src/controllers/patients.controller.js` - Lógica de pacientes
- `database/schema.sql` - Estructura de BD

## Stack Tecnológico
- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **Backend:** Node.js, Express.js
- **Base de Datos:** PostgreSQL
- **Autenticación:** JWT
- **Estilos:** CSS puro (sin frameworks)

## 🚀 DEPLOYMENT A VPS

### Entornos Disponibles
- **Local:** http://localhost:8080 (desarrollo)
- **Staging:** http://148.113.205.115:3001 (testing)
- **Producción:** https://intraneuro.lat (activo)

### Comandos de Deployment

#### 1. Crear paquete para VPS
```bash
tar -czf /tmp/intraneuro-staging.tar.gz --exclude='node_modules' --exclude='.git' --exclude='data' --exclude='backend/logs' --exclude='backend/backups' --exclude='*.tar.gz' .
```

#### 2. Subir a VPS
```bash
sshpass -p 'PASSWORD' scp -o StrictHostKeyChecking=no /tmp/intraneuro-staging.tar.gz root@148.113.205.115:/var/www/intraneuro-staging/
```

#### 3. Extraer y configurar
```bash
# Conectar a VPS
ssh root@148.113.205.115

# Extraer código
cd /var/www/intraneuro-staging && tar -xzf intraneuro-staging.tar.gz

# Instalar dependencias
cd backend && npm install

# Configurar variables de entorno
nano .env  # Usar credenciales correctas

# Dar permisos BD
sudo -u postgres psql -d intraneuro_staging -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO intraneuro_user;'
sudo -u postgres psql -d intraneuro_staging -c 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO intraneuro_user;'

# Iniciar servidor
npm start
```

### Health Check URLs
- **Staging:** http://148.113.205.115:3001/api/health
- **Detailed:** http://148.113.205.115:3001/api/health/detailed

### Mejoras Implementadas en Staging
- ✅ Pool de conexiones optimizado (10-20 conexiones)
- ✅ Health checks robustos (/api/health, /api/health/detailed)
- ✅ Graceful shutdown implementation
- ✅ Sistema de logging avanzado
- ✅ Script de backup automático
- ✅ Manejo de errores mejorado

### Archivos Críticos Nuevos
- `backend/src/controllers/health.controller.js` - Health checks
- `backend/src/utils/logger.js` - Sistema de logging
- `backend/scripts/backup.js` - Backup automático
- `backend/logs/` - Directorio de logs (auto-creado)
- `backend/backups/` - Directorio de backups (auto-creado)