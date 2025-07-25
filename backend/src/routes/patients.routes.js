const router = require('express').Router();
const patientsController = require('../controllers/patients.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Aplicar autenticación a TODAS las rutas
router.use(authMiddleware);

// Pacientes - SIN el prefijo /patients porque ya está en index.js
router.get('/active', patientsController.getActivePatients);
router.post('/', patientsController.createPatient);
router.get('/search', patientsController.searchByRut);
router.get('/:id', patientsController.getPatientById);
router.put('/:id/discharge', patientsController.updateDischarge);

// Observaciones
router.get('/:id/admission/observations', patientsController.getObservations);
router.post('/:id/admission/observations', patientsController.createObservation);

// Tareas
router.get('/:id/admission/tasks', patientsController.getAdmissionTasks);
router.post('/:id/admission/tasks', patientsController.createTask);

module.exports = router;
