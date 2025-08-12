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
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en puerto ${PORT}`);
    console.log('🌍 Timezone configurado:', new Date().toString());
});