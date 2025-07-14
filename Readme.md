INTRANEURO - Sistema de Gestión Clínica
🏥 Estado Actual

✅ Frontend en producción: https://intraneuro.lat
✅ Interfaz 95% completada y funcional
⚠️ Backend pendiente de implementación
⚠️ Datos temporales en memoria (se pierden al recargar)

📋 Descripción
Sistema de gestión de pacientes hospitalarios para clínica psiquiátrica en Chile. Permite el registro, seguimiento y egreso de pacientes con interfaz simple y eficiente.
Características Principales

Ingreso rápido de pacientes con validación de RUT chileno
Vista de pacientes en tarjetas o lista
Ficha completa del paciente con timeline
Sistema de observaciones y tareas pendientes
Escala de Rankin para evaluación al egreso
Dashboard con estadísticas en tiempo real

📚 Documentación Técnica
Para Desarrolladores - LECTURA OBLIGATORIA

PARTE 1: Visión General y Arquitectura

Arquitectura del sistema
Stack tecnológico
Modelos de datos
Endpoints de la API
Configuración del servidor


PARTE 2: Implementación del Backend

Instalación y configuración
Base de datos PostgreSQL
Estructura del backend
Controladores y rutas
Testing básico


PARTE 3: Integración Frontend-Backend

Plan de migración gradual
Modificaciones en el frontend
Sincronización con Google Sheets
Backup automático
Troubleshooting



⚠️ IMPORTANTE - LEER ANTES DE CODIFICAR
Proceso Obligatorio para Desarrolladores

PROHIBIDO escribir código sin autorización
Leer TODA la documentación técnica (las 3 partes)
Hacer preguntas sobre cualquier duda
Proponer plan detallado antes de implementar
Esperar aprobación explícita antes de comenzar

¿Por qué?

El frontend está en producción y funcionando
No podemos romper nada
Cada cambio debe ser planificado y probado

🚀 Acceso Rápido
Credenciales de Prueba (Temporal)
Usuario: doctor1
Contraseña: doctor123
Información del Servidor

URL Producción: https://intraneuro.lat
IP Servidor: 148.113.205.115
OS: Ubuntu
Web Server: Nginx con SSL (Let's Encrypt)

Stack Tecnológico

Frontend: HTML5, CSS3, JavaScript Vanilla ✅
Backend: Node.js + Express (pendiente) ⏳
Base de Datos: PostgreSQL (pendiente) ⏳
Autenticación: JWT (pendiente) ⏳

🗂️ Estructura del Proyecto
/var/www/intraneuro/
├── index.html              # Página principal
├── css/                    # Estilos
├── js/                     # JavaScript del frontend
├── assets/                 # Imágenes y recursos
├── data/                   # SQLite (sin usar aún)
├── docs/                   # Documentación técnica
│   ├── PARTE_1_VISION_GENERAL_Y_ARQUITECTURA.md
│   ├── PARTE_2_IMPLEMENTACION_DEL_BACKEND.md
│   └── PARTE_3_INTEGRACION_FRONTEND_BACKEND.md
└── backend/                # A implementar
📊 Estado de Implementación
✅ Completado

 Interfaz de usuario completa
 Sistema de login (temporal)
 CRUD de pacientes (en memoria)
 Validaciones frontend
 HTTPS configurado

⏳ Pendiente

 Backend API REST
 Base de datos PostgreSQL
 Autenticación con JWT
 Persistencia de datos
 Sincronización con Google Sheets
 Sistema de backups
 Seguridad (hash de contraseñas)

🛠️ Comandos Útiles
bash# Ver logs de Nginx
tail -f /var/log/nginx/access.log

# Estado del servidor
systemctl status nginx

# Acceder al servidor
ssh usuario@148.113.205.115
🤝 Contribuir

Lee TODA la documentación técnica
Abre un issue describiendo lo que quieres implementar
Espera aprobación antes de comenzar
Sigue el plan de implementación por fases