const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: process.env.NODE_ENV === 'production' ? 20 : 10,
            min: 2,
            acquire: 10000, // 10 segundos para obtener conexión
            idle: 5000,     // 5 segundos antes de cerrar conexión inactiva
            evict: 1000,    // Verificar conexiones muertas cada segundo
            handleDisconnects: true
        },
        retry: {
            match: [
                /ConnectionError/,
                /ConnectionRefusedError/,
                /ConnectionTimedOutError/,
                /TimeoutError/
            ],
            max: 3
        }
    }
);

// Probar conexión
sequelize.authenticate()
    .then(() => console.log('✅ Conexión a PostgreSQL establecida'))
    .catch(err => console.error('❌ Error conectando a PostgreSQL:', err));

module.exports = sequelize;
