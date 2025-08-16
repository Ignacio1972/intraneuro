CLAUDE.md - INTRANEURO Development Guide
🎯 Proyecto
INTRANEURO - Sistema de Gestión Hospitalaria para Clínica Psiquiátrica
Producción: https://intraneurodavila.com (⚠️ NO MODIFICAR DIRECTAMENTE)
GitHub: https://github.com/Ignacio1972/intraneuro
📍 Ubicaciones
LOCAL: ~/Desarrollo/intraneuro-local/codigo
VPS: root@148.113.205.115:/var/www/intraneuro
🔄 FLUJO DE TRABAJO COMPLETO
1. DESARROLLO LOCAL
bashcd ~/Desarrollo/intraneuro-local/codigo
./switch-env.sh local          # Configura ambiente local
cd .. && ./start.sh            # Inicia frontend:8080 + backend:3000
2. ANTES DE COMMIT
bashcd codigo
./switch-env.sh prod           # ⚠️ CRÍTICO: Cambiar a producción
git add .
git commit -m "feat: descripción"
git push origin main
./switch-env.sh local          # Volver a local inmediatamente
3. DEPLOY A PRODUCCIÓN
bashssh root@148.113.205.115
cd /var/www/intraneuro
git pull origin main
pm2 restart intraneuro-api
⚙️ CONFIGURACIÓN DE AMBIENTES
Archivos de Ambiente

backend/.env.local → development, intraneuro_dev, localhost:8080
backend/.env.production → production, intraneuro_staging, intraneurodavila.com
backend/.env → Se copia desde .local o .production según el modo

Script de Cambio
bash./switch-env.sh [local|prod]   # Cambia TANTO api.js como .env
./switch-env.sh                # Ver estado actual
🏗️ ESTRUCTURA
Frontend (JavaScript Vanilla)
index.html           # Dashboard principal
js/api.js           # ⚠️ baseURL cambia entre local/prod
js/main.js          # Orquestador principal
js/auth.js          # Autenticación JWT
js/pacientes.js     # Gestión de pacientes
Backend (Node.js + Express)
server.js                        # Entrada principal
src/controllers/                 # Lógica de negocio
src/models/                      # Modelos Sequelize
src/routes/                      # Endpoints API
backend/.env                     # Config (cambia según ambiente)
🗄️ BASE DE DATOS
Local
bashDB: intraneuro_dev
Usuario: dev_user
Password: desarrollo2025
Producción
bashDB: intraneuro_staging
Usuario: intraneuro_user
Password: [en .env.production]
✅ VERIFICACIONES
Estado Actual
bashgrep "baseURL" js/api.js        # Debe mostrar '/api' para prod
grep "NODE_ENV" backend/.env    # Debe mostrar 'production' para prod
URLs

Local: http://localhost:8080 (frontend) / :3000 (backend)
Producción: https://intraneurodavila.com

⚠️ REGLAS CRÍTICAS

NUNCA push con baseURL: 'http://localhost:3000/api'
SIEMPRE ejecutar ./switch-env.sh prod antes de push
SIEMPRE volver a ./switch-env.sh local después
.env ESTÁ en Git (decisión consciente del proyecto)
NO trabajar directo en el VPS de producción

PROCESO OBLIGATORIO ! :
1. REVISAR → 2. TESTEAR → 3. PROPONER 4. ESPERAR APROBACIÓN → 5. IMPLEMENTAR

Si algo no está 100% claro, DETENERSE, Revisar. Hacer tests.
Jamas escribir codigo sin antes saber 100% cual es el problema.
Analizar y revisar hasta encontrar el problema.
Siempre hacer BACKUP antes de cualquier modificación
Documentar TODAS las decisiones tomadas
Probar exhaustivamente antes de desplegar

🚨 TROUBLESHOOTING
Login falla en local:
bash./switch-env.sh local
# Verificar: baseURL debe ser 'http://localhost:3000/api'
Login falla en producción:
bash# En VPS verificar que api.js tiene baseURL: '/api'
# CORS debe permitir intraneurodavila.com
Error de base de datos:
bash# Local: verificar PostgreSQL corriendo
psql -U dev_user -d intraneuro_dev

# Producción: verificar con PM2
pm2 logs intraneuro-api
📊 FUNCIONALIDADES PRINCIPALES

Autenticación JWT (8h duración)
CRUD pacientes + asignación camas
Observaciones y tareas médicas
Dashboard con estadísticas
Exportación Excel
Diagnóstico de conexión (/diagnostico.html)


Última actualización: 16 Agosto 2025 - Sistema 100% funcional

DOCUMENTACION COMPLETA EN EL ARCHIVO
Documentacion Tecnica.md