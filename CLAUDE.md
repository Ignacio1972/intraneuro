CLAUDE.md - INTRANEURO Development Guide
🎯 Proyecto
INTRANEURO - Sistema de Gestión Hospitalaria para Clínica Psiquiátrica
Producción: https://intraneurodavila.com (⚠️ NO MODIFICAR DIRECTAMENTE)
GitHub: https://github.com/Ignacio1972/intraneuro

1. First think through the problem, read the codebase for relevant files, and write a plan to todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.


📍 UBICACIONES

LOCAL: ~/Desarrollo/intraneuro-local/codigo
VPS: root@148.113.205.115:/var/www/intraneuro
RAMA ACTUAL: desarrollo-hrm (no main)

🔄 FLUJOS DE TRABAJO
1. DESARROLLO LOCAL
bashcd ~/Desarrollo/intraneuro-local/codigo
./switch-env.sh local          # Configura ambiente local
cd .. && ./start.sh            # Inicia frontend:8080 + backend:3000
2. DESARROLLO MÓVIL
bash# Iniciar modo móvil
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
sed -i '' "s|localhost|$IP|g" js/api.js
./start.sh
# Móvil accede a: http://192.168.x.x:8080

# Volver a local
sed -i '' "s|$IP|localhost|g" js/api.js
3. COMMIT DESDE MÓVIL
bash# ANTES del commit - restaurar configuración
sed -i '' "s|192.168.*.*|localhost|g" js/api.js

# Verificar SIEMPRE
grep "baseURL" js/api.js      # DEBE ser localhost, NO IP

# Commit normal
git add [archivos-modificados]  # NUNCA api.js con IP
git commit -m "feat: mejoras móviles"
git push origin desarrollo-hrm
4. DEPLOY A PRODUCCIÓN
bash# EN LOCAL - Preparar
cd ~/Desarrollo/intraneuro-local/codigo
./switch-env.sh prod           # CRÍTICO: Cambiar a prod
git add js/api.js backend/.env
git commit -m "config: producción"
git push origin desarrollo-hrm

# Merge a main
git checkout main
git merge desarrollo-hrm
git push origin main

# EN VPS - Actualizar
ssh root@148.113.205.115
cd /var/www/intraneuro
git pull origin main
pm2 restart intraneuro-api

# EN LOCAL - Volver a desarrollo
git checkout desarrollo-hrm
./switch-env.sh local
⚙️ CONFIGURACIÓN DE AMBIENTES
Archivos .env:

backend/.env.local → DB: intraneuro_dev, localhost
backend/.env.production → DB: intraneuro_staging, producción
backend/.env → Activo (se copia según modo)

Scripts:

./switch-env.sh [local|prod] - Cambia api.js Y .env
./switch-env.sh - Muestra estado actual

⚠️ REGLAS CRÍTICAS
NUNCA commitear:

api.js con IP local (192.168.x.x)
.env con FRONTEND_URL=*
Archivos *.mobile, *.backup

SIEMPRE antes de commit:
bashgrep "baseURL" js/api.js      # localhost o /api (NUNCA IP)
grep "NODE_ENV" backend/.env  # development o production
Backend: Configurado con HOST=0.0.0.0 para aceptar conexiones móviles automáticamente.


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