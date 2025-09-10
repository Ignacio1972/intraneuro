const router = require('express').Router();
const patientsController = require('../controllers/patients.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Ruta pública para compartir fichas (SIN autenticación)
router.get('/public/:id', patientsController.getPublicPatient);

// Aplicar autenticación a TODAS las demás rutas
router.use(authMiddleware);

// Pacientes - SIN el prefijo /patients porque ya está en index.js
// IMPORTANTE: Rutas específicas ANTES que rutas con parámetros
router.get('/active', patientsController.getActivePatients);
router.get('/archived', patientsController.getArchivedPatients);
router.get('/search', patientsController.searchByRut);
router.post('/', patientsController.createPatient);

// Rutas para acceder por admissionId directamente (para pacientes archivados)
router.get('/admission/:admissionId/observations', patientsController.getObservationsByAdmission);
router.put('/admission/:admissionId', patientsController.updateArchivedAdmission);

// Rutas existentes por patientId
router.get('/:id/history', patientsController.getPatientHistory);
router.get('/:id/admission/observations', patientsController.getObservations);
router.post('/:id/admission/observations', patientsController.createObservation);
router.get('/:id/admission/tasks', patientsController.getAdmissionTasks);
router.post('/:id/admission/tasks', patientsController.createTask);
router.put('/:id/admission', patientsController.updateActiveAdmission);
router.put('/:id/discharge', patientsController.updateDischarge);
router.put('/:id/bed', patientsController.updateBed);
router.put('/:id/admittedBy', patientsController.updateAdmittedBy);
router.put('/:id/diagnosis-details', patientsController.updateDiagnosisDetails);
router.put('/:id', patientsController.updatePatient);
router.delete('/:id', patientsController.deletePatient);
router.get('/:id', patientsController.getPatientById); // Esta DEBE ir al final

module.exports = router;