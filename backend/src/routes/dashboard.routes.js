const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Ruta protegida con autenticación
router.get('/stats', authMiddleware, dashboardController.getStats);

module.exports = router;
