const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/verify-token', authMiddleware, authController.verifyToken);

module.exports = router;
