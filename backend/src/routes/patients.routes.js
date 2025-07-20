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
router.put('/:id/discharge', patientsController.updateDischarge);

// Observaciones
router.get('/:id/admission/observations', patientsController.getObservations);
router.post('/:id/admission/observations', patientsController.createObservation);

// Tareas
router.get('/:id/admission/tasks', patientsController.getTasks);
router.post('/:id/admission/tasks', patientsController.createTask);
module.exports = router;
