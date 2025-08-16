RESUMEN TÉCNICO FINAL
Stack

Frontend: Vanilla JS + HTML5/CSS3 (sin frameworks)
Backend: Node.js + Express 5.1 + Sequelize 6.37
DB: PostgreSQL 12+ (2 bases: dev/staging)
Auth: JWT sin refresh tokens
Deploy: PM2 + Nginx (proxy /api)

Características Clave

Dual Environment: switch-env.sh cambia automáticamente
Fallback System: Si API falla, usa datos locales
Cache Prevention: Timestamps en cada request
Cascade Delete: SQL directo para integridad
Excel Export: Con historia completa vía API
Alta Programada: Toggle independiente del egreso

Archivos Críticos
js/api.js              → Cliente HTTP (baseURL switcheable)
backend/.env           → Config ambiente (en Git)
switch-env.sh          → Cambio local↔prod
js/pacientes.js        → Orquestador principal frontend
controllers/patients   → 16 endpoints de negocio
Flujo de Deploy
bash1. ./switch-env.sh prod     # ANTES de commit
2. git push origin main     
3. ssh → git pull → pm2 restart
4. ./switch-env.sh local    # DESPUÉS de push

✅ Sistema 100% funcional en producción: https://intraneurodavila.com

ARQUITECTURA DEL SISTEMA
Base de Datos (PostgreSQL + Sequelize)
javascript// Configuración adaptativa según ambiente
- Pool: 20 conexiones (prod) / 10 (dev)
- Retry automático: 3 intentos en errores de conexión
- Timeout: 10s adquisición, 5s idle
- Logging: Solo en desarrollo
API REST - Endpoints Principales
/api/
├── /health           → Estado del servidor
├── /login           → Autenticación JWT
├── /verify-token    → Validación de sesión
├── /patients/       → CRUD pacientes
│   ├── /active      → Pacientes activos
│   ├── /:id/discharge → Alta programada
│   └── /:id/bed     → Gestión de camas
└── /dashboard/stats → Estadísticas en tiempo real
Modelo de Datos Core - Patient
javascript{
  id: autoincrement,
  name: string(100),
  age: int (1-150),
  rut: string(15) único opcional,  // RUT chileno
  phone: string(20) opcional,
  timestamps: created_at, updated_at
}
// Relación: Patient → hasMany → Admissions

🔄 GESTIÓN DE AMBIENTES
Sistema Dual con switch-env.sh:

Local: intraneuro_dev DB, localhost:8080
Producción: intraneuro_staging DB, intraneurodavila.com
Cambio automático de api.js baseURL y .env

LÓGICA DE NEGOCIO
Controller Principal - Patients (16 endpoints)
javascript// Operaciones CRUD completas + funcionalidades especiales
- getActivePatients()     → Lista con admisiones activas
- createPatient()         → Crea paciente + admisión inicial
- updateDischarge()       → Toggle alta programada O egreso completo
- updateBed()            → Gestión de camas (texto libre, 20 chars)
- getObservations()      → Historial médico por admisión
- createObservation()    → Nueva observación médica
- getAdmissionTasks()    → Tareas pendientes
- createTask()           → Nueva tarea
- getArchivedPatients()  → Pacientes egresados
- reAdmitPatient()       → Reingreso automático
- deletePatient()        → Eliminación completa con SQL directo
Modelo Admission - Core del Sistema
javascript{
  // Ingreso
  admission_date: DATEONLY,
  diagnosis_code: string(10),      // CIE-10
  diagnosis_text: string(100),
  bed: string(20) default:'Sin asignar',
  
  // Egreso
  discharge_date: DATEONLY nullable,
  discharge_diagnosis: string(100),
  ranking: int(0-6),               // Escala Rankin
  deceased: boolean,
  scheduled_discharge: boolean,     // Toggle alta programada
  
  // Estado
  status: ENUM('active','discharged'),
  
  // Relaciones
  → belongsTo Patient
  → hasMany Observations (CASCADE)
  → hasMany PendingTasks (CASCADE)
}
Frontend - pacientes.js (Orquestador)

Dual Mode: API con fallback a datos locales
Cache Control: Timestamps en cada request (_t=${Date.now()})
Features principales:

Toggle alta programada sin recargar página
Exportación Excel con historia completa
Impresión con CSS dedicado
Edición inline de camas
Tracking de cambios no guardados




🔐 SEGURIDAD Y PERFORMANCE
javascript// Conexión DB optimizada
Pool: 20 conexiones (prod) / 10 (dev)
Retry: 3 intentos automáticos
Timeout: 10s adquisición

// Anti-caché en frontend
Headers: 'Cache-Control: no-cache, no-store'
URL: endpoint + '?_t=' + timestamp

// JWT
Duración: 8 horas
Verificación: cada 5 minutos

MAPA DE RUTAS API
Rutas de Pacientes (/api/patients/)
javascript// Todas requieren JWT (authMiddleware)
GET    /active                          → Pacientes activos con admisiones
GET    /archived                        → Historial de egresados  
GET    /search?rut=X                    → Búsqueda por RUT chileno
POST   /                                → Crear paciente + admisión

// Por ID de paciente
GET    /:id                             → Detalle completo
GET    /:id/history                     → Historial de admisiones
PUT    /:id                             → Actualizar datos básicos
PUT    /:id/discharge                   → Toggle alta O egreso completo
PUT    /:id/bed                         → Actualizar cama
DELETE /:id                             → Eliminación completa (CASCADE)

// Observaciones y Tareas (por paciente)
GET    /:id/admission/observations      → Lista observaciones
POST   /:id/admission/observations      → Nueva observación
GET    /:id/admission/tasks             → Lista tareas pendientes
POST   /:id/admission/tasks             → Nueva tarea

// Especial: Por admissionId (para archivados)
GET    /admission/:admissionId/observations → Observaciones históricas
🔐 SISTEMA DE AUTENTICACIÓN
Login Flow
javascriptPOST /api/login
Body: { username, password }
Response: {
  token: "JWT...",
  user: {
    id, username, full_name, role
  }
}

// Token payload
{
  id: userId,
  username: string,
  full_name: string,
  role: 'admin'|'doctor'|'nurse',
  iat: timestamp,
  exp: timestamp + 8h
}
Verificación continua

Frontend: Check cada 5 minutos
Backend: Middleware en todas las rutas
Expiración: 8 horas (configurable)
Storage: localStorage (token) + sessionStorage (user)

SEGURIDAD Y AUTENTICACIÓN - DETALLE COMPLETO
Middleware JWT
javascript// Validación en cada request
Bearer Token required
Error 401: Token no proporcionado | Token inválido
Token payload: {id, username, full_name, role}
Frontend Auth Flow
javascript// auth.js - Características de seguridad
1. NO fallback a usuarios locales (comentados)
2. Verificación token al cargar página
3. Modal login NO cerrable (ESC/click fuera bloqueados)
4. Timeout inactividad: 30 minutos
5. Verificación periódica con API
6. Limpieza completa en logout (localStorage + sessionStorage)
📝 INGRESO DE PACIENTES - FLUJO COMPLETO
ingreso.js - Validaciones y Features
javascript// Validaciones
- RUT chileno (validateRut) - opcional con checkbox
- Edad: 1-150 años
- Cama: texto libre 20 chars

// Features especiales
- Detección reingresos por RUT → alerta amarilla
- Búsqueda historial previo vía API
- Fallback a datos locales si API falla
- Success overlay animado 1.5s
🗄️ BASE DE DATOS - ESTRUCTURA REAL
6 Tablas + 5 Índices + 3 Triggers
sqlusers → patients → admissions → observations
                              → pending_tasks  
                              → timeline_events

// Índices performance
- idx_patients_rut (búsqueda rápida)
- idx_admissions_status (filtro activos)
- idx_admissions_scheduled (altas programadas)

// Triggers automáticos
- updated_at en users, patients, admissions

// Constraints importantes
- RUT único pero nullable
- CASCADE DELETE en relaciones
- CHECK age > 0 AND < 150
- CHECK ranking 0-6 (Escala Rankin)
🚀 OPTIMIZACIONES IMPLEMENTADAS

Cache Prevention: _t=${Date.now()} en cada request
Connection Pool: 20 prod / 10 dev con retry x3
Fallback System: API → localStorage → datos mock
Session Security:

Token 8h + verificación cada 5 min
Timeout inactividad 30 min
Limpieza completa en logout


SQL Directo: Delete con queries raw para integridad

⚠️ PUNTOS CRÍTICOS DEL SISTEMA
javascript// DEBE mantener sincronía
switch-env.sh → api.js baseURL + backend/.env

// NO modificar
- Modal login (no cerrable por diseño)
- Usuarios hardcoded en BD (temporal)
- .env en Git (decisión consciente)

// Campos deshabilitados temporalmente
- Alergias (comentado 08/08/2025)
- Escala Rankin (hidden con value=0)
- Teléfono paciente (removido del form)
📊 MÉTRICAS Y LÍMITES

Usuarios concurrentes: ~20 (pool size)
Timeout API: 30 segundos
Token duración: 8 horas
Texto campos: Cama 20 chars, Diagnóstico 100 chars
Exportación Excel: Sin límite de registros
Reintentos DB: 3 automáticos

🔄 FLUJO DE DATOS COMPLETO
1. LOGIN
   Browser → POST /api/login → JWT → localStorage
   → sessionStorage (user) → showMainApp()

2. INGRESO PACIENTE  
   Form → validateRut → checkExisting → POST /api/patients
   → Update local array → Toast → Reload patients

3. ALTA PROGRAMADA
   Toggle → PUT /api/patients/:id/discharge 
   → Update dashboard → Re-render con badge

4. EGRESO COMPLETO
   Form → Auth check → PUT con discharge_date
   → Status='discharged' → Archive view

   ARQUITECTURA DE MODELOS - COMPLETA
index.js - Orquestador de Modelos
javascript// 6 Modelos con asociaciones bidireccionales
Patient ←→ Admission ←→ Observation
                    ←→ PendingTask
                    ←→ TimelineEvent

// Funciones críticas exportadas
- syncDatabase()    → Sincroniza modelos con BD
- testConnection()  → Verifica conexión antes de iniciar
- setupAssociations() → Configura todas las relaciones

// Configuración Sequelize
- CASCADE DELETE en todas las relaciones
- alter: false (no modifica tablas existentes)
- logging: false en producción
🔄 SWITCH-ENV.SH - EL ARCHIVO MÁS CRÍTICO
bash# Script que modifica 2 archivos clave:

LOCAL → PRODUCCIÓN:
1. js/api.js: 'http://localhost:3000/api' → '/api'
2. backend/.env: copia .env.local → .env

PRODUCCIÓN → LOCAL:
1. js/api.js: '/api' → 'http://localhost:3000/api'  
2. backend/.env: copia .env.production → .env

# USO CORRECTO:
./switch-env.sh prod   # ANTES de git push
git add . && git commit && git push
./switch-env.sh local  # INMEDIATAMENTE después

# VERIFICAR ESTADO:
./switch-env.sh        # Sin argumentos muestra estado actual
⚠️ PUNTO DE FALLA COMÚN:

Si se hace push con baseURL: 'http://localhost:3000/api', el login fallará en producción


📊 DIAGRAMA DE FLUJO COMPLETO
mermaidgraph TD
    A[Usuario] -->|1. Login| B[auth.js]
    B -->|2. POST /api/login| C[auth.controller]
    C -->|3. JWT| D[localStorage]
    
    D -->|4. Headers| E[api.js]
    E -->|5. Requests| F[Backend]
    
    F -->|6. Sequelize| G[PostgreSQL]
    
    F -->|7. JSON| H[Frontend]
    H -->|8. Fallback| I[localStorage]
    
    style A fill:#f9f
    style G fill:#9f9
    style I fill:#ff9
🔧 RESUMEN TÉCNICO DEFINITIVO
Tecnologías
yamlFrontend:
  - Vanilla JS (sin React/Vue)
  - LocalStorage + SessionStorage
  - XLSX.js para Excel
  
Backend:
  - Node.js 18+ / Express 5.1
  - Sequelize 6.37 (ORM)
  - JWT (sin refresh tokens)
  
Database:
  - PostgreSQL 12+
  - 6 tablas, 5 índices, 3 triggers
  - Pool: 20 conexiones (prod)
  
DevOps:
  - PM2 (process manager)
  - Nginx (reverse proxy)
  - GitHub (sin CI/CD)
Números Clave

8 horas: Duración JWT
30 minutos: Timeout inactividad
30 segundos: Timeout API requests
20 caracteres: Máximo campo cama
3 reintentos: Conexión BD
5 minutos: Verificación token periódica

🚨 GUÍA DE TROUBLESHOOTING RÁPIDA
ProblemaCausaSoluciónLogin falla en prodbaseURL incorrecto./switch-env.sh prodToken expira rápidoJWT_EXPIRE bajoCambiar a '24h' en .envBD no conectaPool agotadoReiniciar: pm2 restartCambios no se guardanCache browserCtrl+F5 o _t=timestampModal login no cierraPor diseñoEs intencional (seguridad)Alta programada no actualizaCache APIVerificar _t= en requests
📝 COMANDOS ESENCIALES
bash# Local
cd ~/Desarrollo/intraneuro-local
./switch-env.sh local
./start.sh                    # Frontend:8080 + Backend:3000

# Producción  
ssh root@148.113.205.115
cd /var/www/intraneuro
git pull
pm2 restart intraneuro-api
pm2 logs --lines 50          # Ver logs

# Base de Datos
psql -U intraneuro_user -d intraneuro_staging
\dt                           # Ver tablas
\d+ admissions               # Ver estructura

# Verificar estado
curl https://intraneurodavila.com/api/health
grep "baseURL" js/api.js     # Ver configuración actual
✅ CHECKLIST PARA NUEVO DESARROLLADOR

 Leer CLAUDE.md primero
 Entender switch-env.sh completamente
 Probar ambiente local con ./start.sh
 Revisar api.js y patients.controller.js
 NO modificar usuarios hardcoded en BD
 NO cerrar modal login (es intencional)
 SIEMPRE hacer switch-env antes de push
 Verificar con /api/health después de deploy


📌 DOCUMENTACIÓN COMPLETA

27 archivos analizados
100% cobertura del sistema
Producción: https://intraneurodavila.com
GitHub: https://github.com/Ignacio1972/intraneuro

Última actualización: 16 Agosto 2025
Sistema: 100% funcional y estable