INTRANEURO - Sistema de Gestión Clínica
Documentación Técnica Actualizada - Versión 2.0
Fecha de actualización: Enero 2025
URL en producción: https://intraneuro.lat
Repositorio: https://github.com/Ignacio1972/intraneuro

🎯 RESUMEN EJECUTIVO
INTRANEURO es un sistema de gestión hospitalaria para clínica psiquiátrica en Chile, completamente funcional y en producción con las siguientes características:

Frontend: 100% completado (JavaScript Vanilla)
Backend: 100% implementado (Node.js + Express + PostgreSQL)
Estado: Sistema en producción estable con todas las funcionalidades core operativas

✅ ESTADO ACTUAL DEL PROYECTO
Funcionalidades Completadas
1. Autenticación y Seguridad

✅ Login con JWT (expiración 8h)
✅ Logout con limpieza de sesión
✅ Protección de rutas con middleware
✅ Sistema de fallback (si API falla, usa datos locales)

2. Gestión de Pacientes

✅ Lista de pacientes activos (vista tarjetas/tabla)
✅ Ingreso de nuevo paciente con validación RUT opcional
✅ Asignación y gestión de camas
✅ Egreso/Alta con escala de Rankin
✅ Toggle "Alta Programada para Hoy"
✅ Búsqueda por RUT (endpoint implementado)
✅ Exportar a Excel con columna de cama
✅ Impresión con número de cama

3. Funcionalidades Clínicas

✅ Sistema de observaciones con historial completo
✅ Gestión de tareas pendientes por paciente
✅ Dashboard con estadísticas en tiempo real
✅ Timeline del paciente (parcialmente implementado)

4. Interfaz de Usuario

✅ Sistema de notificaciones toast
✅ Badges visuales ("ALTA HOY")
✅ Modales para ficha completa del paciente
✅ Diseño responsive adaptable a móviles
✅ Código modularizado (data-catalogos.js, pacientes-ui.js)

Funcionalidades Pendientes

⏳ Búsqueda por RUT en UI (backend listo)
⏳ Timeline completo del paciente
⏳ Implementar bcrypt para passwords
⏳ Backup automático
⏳ Logs de auditoría completos
⏳ Rate limiting para seguridad

📁 ARQUITECTURA DEL SISTEMA
Arquitectura General
CLIENTE (Browser)
    ↓ HTTPS
NGINX (Puerto 443)
    ├── / → Frontend estático
    └── /api/* → Proxy a Backend (Puerto 3000)
                    ↓
            NODE.JS + EXPRESS
                    ↓
            POSTGRESQL (Puerto 5432)
Stack Tecnológico
ComponenteTecnologíaEstadoFrontendJavaScript Vanilla✅ ProducciónBackendNode.js + Express✅ ProducciónBase de DatosPostgreSQL✅ ProducciónAutenticaciónJWT✅ FuncionandoServidor WebNginx✅ ConfiguradoSSLLet's Encrypt✅ Activo
🗂️ ESTRUCTURA DE ARCHIVOS
Frontend (/var/www/intraneuro/)
├── index.html              # Estructura principal
├── archivos.html          # Gestión de archivos
├── ficha-archivo.html     # Detalle de archivo
├── css/
│   ├── main.css           # Estilos generales
│   ├── modal.css          # Estilos de modales
│   ├── pacientes.css      # Estilos de pacientes
│   ├── login.css          # Estilos de autenticación
│   ├── archivos.css       # Estilos de archivos
│   └── ficha-archivo.css  # Estilos ficha archivo
├── js/
│   ├── main.js            # Orquestador principal
│   ├── api.js             # Helper para API calls
│   ├── auth.js            # Autenticación
│   ├── pacientes.js       # Gestión de pacientes
│   ├── ingreso.js         # Formulario ingreso
│   ├── validaciones.js    # Validación RUT
│   ├── data-catalogos.js  # Catálogos CIE-10
│   ├── pacientes-ui.js    # Componentes UI
│   ├── archivos.js        # Gestión archivos
│   └── ficha-archivo.js   # Detalle archivo
└── assets/                # Imágenes y recursos
Backend (/var/www/intraneuro/backend/)
├── server.js              # Punto de entrada
├── package.json          # Dependencias
├── .env                  # Variables de entorno
├── database/
│   └── schema.sql        # Esquema de BD
└── src/
    ├── config/
    │   └── database.js   # Configuración PostgreSQL
    ├── controllers/
    │   ├── auth.controller.js       # Autenticación
    │   ├── patients.controller.js   # CRUD pacientes
    │   └── dashboard.controller.js  # Estadísticas
    ├── models/
    │   ├── index.js              # Índice de modelos
    │   ├── user.model.js         # Modelo usuario
    │   ├── patient.model.js      # Modelo paciente
    │   ├── admission.model.js    # Modelo admisión
    │   ├── observation.model.js  # Observaciones
    │   ├── task.model.js         # Tareas (no usado)
    │   ├── pending-task.model.js # Tareas pendientes
    │   └── timeline-event.model.js # Eventos timeline
    ├── routes/
    │   ├── index.js              # Router principal
    │   ├── auth.routes.js        # Rutas auth
    │   ├── patients.routes.js    # Rutas pacientes
    │   └── dashboard.routes.js   # Rutas dashboard
    └── middleware/
        └── auth.middleware.js    # Verificación JWT
🗄️ BASE DE DATOS
Tablas Principales
TablaDescripciónRelacionesusersUsuarios del sistema-patientsDatos básicos del paciente1:N con admissionsadmissionsIngresos/egresos + camaN:1 con patientsobservationsObservaciones médicasN:1 con admissionspending_tasksTareas pendientesN:1 con admissionstimeline_eventsEventos del timelineN:1 con admissions
Campos Críticos

admissions.status: 'active' o 'discharged'
admissions.scheduled_discharge: boolean para alta programada
admissions.bed: VARCHAR(20) para número/letra de cama
patients.rut: Único pero opcional

🚀 API ENDPOINTS
Autenticación
POST   /api/login                    # Login con username/password
GET    /api/verify-token            # Verificar JWT válido
Pacientes
GET    /api/patients/active         # Lista pacientes activos
POST   /api/patients                # Crear paciente + admisión
GET    /api/patients/:id            # Detalle paciente
PUT    /api/patients/:id/discharge  # Toggle alta programada
PUT    /api/patients/:id/bed        # Actualizar cama
GET    /api/patients/search?rut=X   # Buscar por RUT
Observaciones y Tareas
GET    /api/patients/:id/admission/observations  # Lista observaciones
POST   /api/patients/:id/admission/observations  # Nueva observación
GET    /api/patients/:id/admission/tasks        # Lista tareas
POST   /api/patients/:id/admission/tasks        # Nueva tarea
Dashboard
GET    /api/dashboard/stats         # Estadísticas
🔧 CONFIGURACIÓN
Variables de Entorno (.env)
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_NAME=intraneuro_db
DB_USER=intraneuro_user
DB_PASS=[SEGURO]
JWT_SECRET=[SECRETO]
JWT_EXPIRE=8h
FRONTEND_URL=https://intraneuro.lat
Nginx Configuration

Frontend servido en /
API proxy en /api/* → localhost:3000
SSL con Let's Encrypt configurado

PM2 Process Manager
bash# Proceso: intraneuro-api
pm2 status              # Ver estado
pm2 logs intraneuro-api # Ver logs
pm2 restart intraneuro-api # Reiniciar
📊 FLUJOS DE DATOS
1. Autenticación
Login → auth.js → POST /api/login → JWT → localStorage → api.js headers
2. Carga de Pacientes
renderPatients() → GET /api/patients/active → patients[] → renderPatientCard()
                            ↓ (fallback)
                      patients[] en main.js
3. Alta Programada
Toggle → toggleScheduledDischarge() → PUT /api/patients/:id/discharge
    ↓                                        ↓
updateDashboard()                    Actualiza BD scheduled_discharge
    ↓
Actualiza contador
4. Gestión de Camas
Click cama → editBed() → PUT /api/patients/:id/bed → Actualiza BD
                                ↓
                        renderPatients()
🔐 SEGURIDAD
Implementado

JWT con expiración de 8 horas
CORS configurado para dominio específico
HTTPS con certificado SSL válido
Middleware de autenticación en rutas protegidas

Pendiente

⚠️ Logs de auditoría básicos
⚠️ Backups manuales (automatizar)

📈 HISTÓRICO DE CAMBIOS
Julio 2025 - Última actualización mayor

✅ Implementación completa del backend
✅ Gestión de camas agregada
✅ Sistema de notificaciones toast
✅ Exportación a Excel mejorada
✅ Modularización del código frontend

Archivos modificados más recientes

/backend/src/models/admission.model.js - Campo bed agregado
/backend/src/controllers/patients.controller.js - CRUD de camas
/js/pacientes-ui.js - Visualización de camas
/js/data-catalogos.js - Catálogos centralizados

🛠️ COMANDOS ÚTILES
Servidor
bash# Logs de Nginx
sudo tail -f /var/log/nginx/access.log

# Estado de servicios
systemctl status nginx
pm2 status

# Conexión a BD
psql -U intraneuro_user -d intraneuro_db
Desarrollo
bash# Backend
cd /var/www/intraneuro/backend
pm2 logs intraneuro-api
pm2 restart intraneuro-api

# Ver logs en tiempo real
pm2 logs --lines 100
📝 NOTAS IMPORTANTES

Sistema de Fallback: Si la API falla, el frontend usa datos locales de main.js
IDs Mixtos: Frontend usa patient_id, algunos endpoints esperan admission_id
RUT Opcional: La validación existe pero no es obligatoria
Token 8h: Los usuarios deben re-autenticarse cada 8 horas
Camas: Campo texto libre, máximo 20 caracteres, editable desde lista

🚦 PRÓXIMOS PASOS RECOMENDADOS
Fase 1 - Seguridad (Prioridad Alta)

Implementar bcrypt para hash de passwords
Agregar rate limiting en endpoints críticos
Implementar logs de auditoría completos
Configurar backups automáticos

Fase 2 - Funcionalidades

Completar UI de búsqueda por RUT
Implementar timeline completo del paciente
Agregar reportes y estadísticas avanzadas
Sistema de notificaciones por email

Fase 3 - Optimización

Implementar caché con Redis
Optimizar consultas a BD
Comprimir assets del frontend
Implementar lazy loading

📞 INFORMACIÓN DE CONTACTO

URL Producción: https://intraneuro.lat
Repositorio: https://github.com/Ignacio1972/intraneuro
Servidor: 148.113.205.115