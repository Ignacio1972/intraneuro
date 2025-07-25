const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Dashboard - SIN el prefijo /dashboard
router.get('/stats', dashboardController.getStats);

module.exports = router;
