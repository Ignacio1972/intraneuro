DOCUMENTACIÓN TÉCNICA - INTRANEURO DEPLOYMENT
🔧 CONFIGURACIÓN DE AMBIENTES
Archivos clave:

codigo/switch-env.sh - Script para cambiar entre ambientes
backend/.env.local - Config desarrollo (DB: intraneuro_dev, URL: localhost:8080)
backend/.env.production - Config producción (DB: intraneuro_staging, URL: intraneurodavila.com)
js/api.js - baseURL cambia entre http://localhost:3000/api (local) y /api (prod)

📍 UBICACIONES
LOCAL: ~/Desarrollo/intraneuro-local/codigo
GITHUB: https://github.com/Ignacio1972/intraneuro
VPS: root@148.113.205.115:/var/www/intraneuro
🔄 FLUJO DE TRABAJO
DESARROLLO LOCAL:
bashcd ~/Desarrollo/intraneuro-local/codigo
./switch-env.sh local    # Configura para desarrollo
cd .. && ./start.sh      # Inicia servicios
# Trabajar en http://localhost:8080
DEPLOYMENT A PRODUCCIÓN:
bash# 1. EN LOCAL - Preparar
cd ~/Desarrollo/intraneuro-local/codigo
./switch-env.sh prod     # CRÍTICO: Cambiar a config producción
git add .
git commit -m "feat: descripción"
git push origin main

# 2. EN VPS - Actualizar
ssh root@148.113.205.115
cd /var/www/intraneuro
git pull origin main
pm2 restart intraneuro-api

# 3. EN LOCAL - Volver a desarrollo
./switch-env.sh local    # IMPORTANTE: Volver a local
⚠️ REGLAS CRÍTICAS

NUNCA hacer push con baseURL: 'http://localhost:3000/api'
SIEMPRE ejecutar ./switch-env.sh prod antes de push
SIEMPRE volver a ./switch-env.sh local después de push
VERIFICAR estado actual: ./switch-env.sh sin argumentos
.env está en Git (decisión consciente para simplificar deploys)

🚨 TROUBLESHOOTING
Si login falla en producción: Verificar que api.js tiene baseURL: '/api'
Si login falla en local: Verificar que api.js tiene baseURL: 'http://localhost:3000/api'
Estado actual: grep "baseURL" js/api.js y grep "NODE_ENV" backend/.env

Última actualización: 16 Agosto 2025