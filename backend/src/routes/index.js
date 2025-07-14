const router = require('express').Router();

// Importar rutas
const authRoutes = require('./auth.routes');
const patientsRoutes = require('./patients.routes');
const dashboardRoutes = require('./dashboard.routes');

// Health check endpoint (sin prefijo, será /api/health)
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString()
    });
});

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