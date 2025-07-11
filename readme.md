DOCUMENTACIÓN TÉCNICA - SISTEMA INTRANEURO
1. RESUMEN DEL PROYECTO

Cliente: INTRANEURO - Clínica Psiquiátrica
Sistema: Gestión de Pacientes Hospitalarios
Estado: Frontend completado, en producción con HTTPS
URL: https://intraneuro.lat

2. ARQUITECTURA
2.1 Stack Tecnológico

Frontend: HTML5, CSS3, JavaScript Vanilla (sin frameworks)
Base de Datos: SQLite (preparada, sin backend)
Servidor Web: Nginx (producción)
SSL: Let's Encrypt
Ubicación: VPS Ubuntu en /var/www/intraneuro/

2.2 Estructura de Archivos
/var/www/intraneuro/
├── index.html          # Página principal
├── init_db.sql         # Schema de base de datos
├── favicon.ico         # Icono del sitio
├── css/
│   ├── main.css        # Estilos globales
│   ├── login.css       # Estilos de login
│   ├── modal.css       # Estilos de modales (incluye modal grande)
│   └── pacientes.css   # Estilos vista pacientes
├── js/
│   ├── main.js         # Funciones principales
│   ├── auth.js         # Autenticación
│   ├── pacientes.js    # Gestión de pacientes
│   ├── ingreso.js      # Gestión de ingresos
│   └── validaciones.js # Validaciones (RUT chileno)
├── assets/
│   └── img/
│       └── logo.svg    # Logo INTRANEURO
├── data/
│   └── intraneuro.db   # Base de datos SQLite
└── backups/            # Backups del sistema
3. FUNCIONALIDADES IMPLEMENTADAS
3.1 Sistema de Login

Usuarios hardcodeados en JS (temporal)
Sesión en sessionStorage
Timeout de 30 minutos

3.2 Vista Principal

Dashboard con contador de pacientes activos
"Altas Programadas para Mañana" (muestra 0 - pendiente implementación)
Vista tarjetas/lista de pacientes
Hover muestra diagnóstico
Un solo click abre ficha del paciente (actualizado)

3.3 Ingreso de Pacientes

Validación de RUT chileno
Detección de reingresos
Diagnósticos CIE-10 (capítulo F)
Registro de alergias
Campo "Pendientes" para tareas
Modal más grande para mejor visibilidad
Autorización con contraseña

3.4 Ficha del Paciente

Datos de ingreso y egreso en columnas
Observaciones y Pendientes lado a lado (nuevo)
Timeline de eventos
Opción de egreso con:

Escala de Rankin (pendiente cambiar estrellas por círculos)
Diagnóstico de egreso
Opción "fallecido"
Autorización con contraseña



4. CONFIGURACIÓN DEL SERVIDOR
4.1 VPS Actual

OS: Ubuntu
IP: 148.113.205.115
Dominio: intraneuro.lat
HTTPS: Configurado con Let's Encrypt
Nginx: Instalado directamente (ya no en Docker)
OpenMRS: Eliminado completamente

4.2 Configuración Nginx
nginx# Archivo: /etc/nginx/sites-available/intraneuro
server {
    server_name intraneuro.lat www.intraneuro.lat;
    root /var/www/intraneuro;
    index index.html;
    
    # Configuración SSL manejada por Certbot
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/intraneuro.lat/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/intraneuro.lat/privkey.pem;
}
5. PENDIENTES POR IMPLEMENTAR
5.1 Backend API (Prioridad Alta)
Crear API REST con Node.js/Express:

POST /api/login - Autenticación real
GET /api/patients/active - Listar pacientes activos
POST /api/patients - Crear paciente
PUT /api/patients/:id - Actualizar paciente
PUT /api/patients/:id/discharge - Egresar paciente
GET /api/patients/:id/history - Historial del paciente
POST /api/patients/:id/observations - Guardar observaciones
POST /api/patients/:id/pending-tasks - Guardar pendientes

5.2 Base de Datos

Migrar de arrays en memoria a SQLite
Implementar modelos y consultas
Backups automáticos

5.3 Funcionalidades Frontend Pendientes

Cambiar Ranking por "Escala de Rankin" con círculos
Ajustar días hospitalizados (mostrar entre 4-9 días para demo)
Reemplazar códigos F por nombres descriptivos en las vistas
Ocultar RUT en vista de lista
Implementar cálculo real de "Altas Programadas"
Sección de Archivo funcional
Exportación a Excel/CSV
Guardar observaciones y pendientes en BD

5.4 Seguridad

Sistema de autenticación real con JWT
Hashear contraseñas con bcrypt
Validaciones en backend
Rate limiting
CORS configurado correctamente

6. DATOS DE PRUEBA
Usuarios (temporal en auth.js)
admin / admin123
doctor1 / doctor123
enfermera / enfermera123
7. COMANDOS ÚTILES
bash# Ver logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Verificar base de datos
sqlite3 /var/www/intraneuro/data/intraneuro.db
.tables
.schema patients

# Reiniciar Nginx
systemctl restart nginx

# Ver estado del servidor
systemctl status nginx

# Renovar certificado SSL (automático con Certbot)
certbot renew --dry-run
8. NOTAS DE DESARROLLO
8.1 Consideraciones UX

El cliente prefiere simplicidad
No requiere gestión de camas
Foco en pacientes activos
Egreso desde ficha del paciente

8.2 Próximos Pasos Recomendados

Implementar Backend API con Node.js
Conectar Frontend con Backend
Migrar datos a SQLite
Completar cambios visuales pendientes
Implementar sistema de reportes

8.3 Estructura Recomendada para Backend
/var/www/intraneuro/backend/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── utils/
├── package.json
├── server.js
└── .env

Última actualización: 11 de Julio 2025
Estado: Frontend en producción, pendiente backend para funcionalidad completa