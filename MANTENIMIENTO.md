# INTRANEURO - Guía de Mantenimiento

## Estado del Sistema
- **URL:** https://intraneuro.lat
- **Servidor:** VPS Ubuntu 22.04
- **IP:** 148.113.205.115
- **Carpeta:** /var/www/intraneuro
- **Puerto Backend:** 3000
- **Proceso PM2:** intraneuro-api

## Comandos Útiles

### Ver estado
```bash
pm2 status
pm2 logs intraneuro-api --lines 50
Actualizar desde GitHub
bashcd /var/www/intraneuro
git pull origin main
pm2 restart intraneuro-api
Reiniciar servicios
bashpm2 restart intraneuro-api
sudo systemctl restart nginx
Ver logs de errores
bashpm2 logs intraneuro-api --err
tail -f /var/log/nginx/error.log
Backup rápido
bashtar -czf ~/backup-$(date +%Y%m%d).tar.gz /var/www/intraneuro
Base de Datos

Nombre: intraneuro_staging
Usuario: intraneuro_user
Puerto: 5432 (PostgreSQL)

Configuraciones

Backend .env: /var/www/intraneuro/backend/.env
Nginx: /etc/nginx/sites-available/intraneuro
PM2: pm2 show intraneuro-api

Última actualización: $(date)
