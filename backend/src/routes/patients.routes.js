const router = require('express').Router();
const patientsController = require('../controllers/patients.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas
router.get('/active', patientsController.getActivePatients);
router.get('/search', patientsController.searchByRut);
router.get('/:id', patientsController.getPatientById);
router.post('/', patientsController.createPatient);

module.exports = router;
