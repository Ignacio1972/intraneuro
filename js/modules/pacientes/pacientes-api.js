// pacientes-api.js - Módulo de llamadas API para pacientes
// Todas las interacciones con el backend

// Cargar pacientes activos desde API
async function loadPatientsFromAPI() {
    try {
        const timestamp = Date.now();
        const response = await apiRequest(`/patients/active?_t=${timestamp}`);
        
        if (Array.isArray(response)) {
            patients = response;
            console.log('Pacientes cargados desde API:', patients.length);
            return true;
        } else {
            throw new Error('Respuesta inválida de API');
        }
    } catch (error) {
        console.log('Usando datos locales de pacientes:', error.message);
        return false;
    }
}

// Actualizar cama del paciente
async function updatePatientBedAPI(patientId, bed) {
    const response = await apiRequest(`/patients/${patientId}/bed`, {
        method: 'PUT',
        body: JSON.stringify({ bed: bed || 'Sin asignar' })
    });
    return response;
}

// Actualizar médico tratante
async function updateAdmittedByAPI(patientId, admittedBy) {
    const response = await apiRequest(`/patients/${patientId}/admittedBy`, {
        method: 'PUT',
        body: JSON.stringify({ admittedBy: admittedBy })
    });
    return response;
}

// Actualizar edad del paciente
async function updatePatientAgeAPI(patientId, age) {
    const response = await apiRequest(`/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify({ age: age })
    });
    return response;
}

// Actualizar RUT del paciente
async function updatePatientRutAPI(patientId, rut) {
    const response = await apiRequest(`/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify({ rut: rut })
    });
    return response;
}

// Actualizar nombre del paciente
async function updatePatientNameAPI(patientId, name) {
    const response = await apiRequest(`/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: name })
    });
    return response;
}

// Actualizar descripción del diagnóstico
async function updateDiagnosisDetailsAPI(patientId, diagnosisDetails) {
    // Usar el endpoint de admission que incluye diagnosis_details
    const response = await apiRequest(`/patients/${patientId}/admission`, {
        method: 'PUT',
        body: JSON.stringify({ 
            diagnosis_details: diagnosisDetails || '',
            diagnosisDetails: diagnosisDetails || '' // Por compatibilidad
        })
    });
    return response;
}

// Actualizar fecha de ingreso
async function updateAdmissionDateAPI(patientId, date) {
    const response = await apiRequest(`/patients/${patientId}/admission`, {
        method: 'PUT',
        body: JSON.stringify({ admissionDate: date })
    });
    return response;
}

// Actualizar diagnóstico
async function updateDiagnosisAPI(patientId, diagnosisCode) {
    const response = await apiRequest(`/patients/${patientId}/admission`, {
        method: 'PUT',
        body: JSON.stringify({ diagnosisCode: diagnosisCode })
    });
    return response;
}

// Toggle alta programada
async function toggleScheduledDischargeAPI(patientId, isScheduled) {
    const response = await apiRequest(`/patients/${patientId}/discharge`, {
        method: 'PUT',
        body: JSON.stringify({ 
            scheduledDischarge: isScheduled 
        })
    });
    return response;
}

// Procesar egreso completo
async function processDischargeAPI(patientId, dischargeData) {
    const response = await apiRequest(`/patients/${patientId}/discharge`, {
        method: 'PUT',
        body: JSON.stringify({
            action: 'discharge',
            dischargeDate: dischargeData.date,
            dischargeDiagnosis: dischargeData.diagnosis,
            dischargeDetails: dischargeData.details,
            ranking: dischargeData.ranking,
            deceased: dischargeData.deceased,
            dischargedBy: dischargeData.dischargedBy || sessionStorage.getItem('currentUser')
        })
    });
    return response;
}

// Guardar observaciones
async function saveObservationsAPI(patientId, observation) {
    const response = await apiRequest(`/patients/${patientId}/admission/observations`, {
        method: 'POST',
        body: JSON.stringify({ 
            observation: observation,
            observedBy: sessionStorage.getItem('currentUser') || 'Usuario'
        })
    });
    return response;
}

// Guardar tareas pendientes
async function savePendingTasksAPI(patientId, task) {
    const response = await apiRequest(`/patients/${patientId}/admission/tasks`, {
        method: 'POST',
        body: JSON.stringify({ 
            task: task,
            assignedTo: sessionStorage.getItem('currentUser') || 'Usuario'
        })
    });
    return response;
}

// Cargar historial de observaciones
async function loadObservationHistoryAPI(patientId) {
    try {
        const response = await apiRequest(`/patients/${patientId}/admission/observations`);
        return response;
    } catch (error) {
        console.error('Error cargando observaciones:', error);
        return [];
    }
}

// Cargar historial de tareas
async function loadTaskHistoryAPI(patientId) {
    try {
        const response = await apiRequest(`/patients/${patientId}/admission/tasks`);
        return response;
    } catch (error) {
        console.error('Error cargando tareas:', error);
        return [];
    }
}

// Eliminar paciente
async function deletePatientAPI(patientId) {
    const response = await apiRequest(`/patients/${patientId}`, {
        method: 'DELETE'
    });
    return response;
}

// Exportar para usar en otros módulos
const PacientesAPI = {
    loadPatientsFromAPI,
    updatePatientBedAPI,
    updateAdmittedByAPI,
    updatePatientAgeAPI,
    updatePatientRutAPI,
    updatePatientNameAPI,
    updateDiagnosisDetailsAPI,
    updateAdmissionDateAPI,
    updateDiagnosisAPI,
    toggleScheduledDischargeAPI,
    processDischargeAPI,
    saveObservationsAPI,
    savePendingTasksAPI,
    loadObservationHistoryAPI,
    loadTaskHistoryAPI,
    deletePatientAPI
};