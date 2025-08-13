# Configuración de Producción

## Estado actual
- **Carpeta:** /var/www/intraneuro
- **Puerto Backend:** 3000
- **PM2 Process:** intraneuro-api
- **Base de datos:** intraneuro_staging
- **Git:** Sincronizado con GitHub

## Comandos útiles
- Reiniciar: `pm2 restart intraneuro-api`
- Ver logs: `pm2 logs intraneuro-api`
- Actualizar: `git pull && pm2 restart intraneuro-api`

## Nginx
- Archivo: /etc/nginx/sites-available/intraneuro
- Root: /var/www/intraneuro
- Proxy: http://localhost:3000

Última actualización: $(date)
