const router = require('express').Router();

// Importar rutas
const authRoutes = require('./auth.routes');
const patientsRoutes = require('./patients.routes');
const dashboardRoutes = require('./dashboard.routes');
const healthController = require('../controllers/health.controller');

// Health check endpoints
router.get('/health', healthController.healthCheck);
router.get('/health/detailed', healthController.detailedHealth);

// Usar rutas
router.use('/', authRoutes);  // Login estará en /api/login
router.use('/patients', patientsRoutes);
router.use('/dashboard', dashboardRoutes);

// Ruta de prueba adicional
router.get('/status', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'API INTRANEURO funcionando',
        version: '1.0.0',
        timestamp: new Date()
    });
});

module.exports = router;