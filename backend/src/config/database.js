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
        logging: false, // Cambiar a console.log en desarrollo
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Probar conexión
sequelize.authenticate()
    .then(() => console.log('✅ Conexión a PostgreSQL establecida'))
    .catch(err => console.error('❌ Error conectando a PostgreSQL:', err));

module.exports = sequelize;
