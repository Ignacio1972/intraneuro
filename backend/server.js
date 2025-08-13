require('dotenv').config();

// Configurar timezone de Chile
process.env.TZ = 'America/Santiago';

// SOLUCIÓN: Configurar parser para fechas DATE
const pg = require('pg');
pg.types.setTypeParser(1082, function(stringValue) {
    // 1082 = DATE type
    // Devolver string sin conversión automática a Date
    return stringValue;
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { syncDatabase } = require('./src/models');

const app = express();

// Sincronizar base de datos
syncDatabase();

// Middlewares de seguridad
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Rutas
app.use('/api', require('./src/routes'));

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log('🌍 Timezone configurado:', new Date().toString());
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Recibido ${signal}. Iniciando shutdown graceful...`);
    
    // Cerrar servidor HTTP (deja de aceptar nuevas conexiones)
    server.close(async () => {
        console.log('✅ Servidor HTTP cerrado');
        
        try {
            // Cerrar conexiones de base de datos
            if (require('./src/models').sequelize) {
                await require('./src/models').sequelize.close();
                console.log('✅ Conexiones de BD cerradas');
            }
            
            console.log('✅ Shutdown completado');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error durante shutdown:', error);
            process.exit(1);
        }
    });
    
    // Forzar cierre después de 10 segundos
    setTimeout(() => {
        console.error('❌ Forzando shutdown después de timeout');
        process.exit(1);
    }, 10000);
};

// Escuchar señales de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});