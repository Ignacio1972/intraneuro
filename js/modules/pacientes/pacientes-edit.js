// pacientes-edit.js - Módulo de edición inline de pacientes
// Todas las funciones de edición de campos

// Editar nombre del paciente
async function editPatientName(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentName = patient.name;
    const newName = prompt(
        `Editar nombre del paciente:\n\n` +
        `Nombre actual: ${currentName}\n\n` +
        `Ingrese el nuevo nombre (mínimo 3 caracteres):`,
        currentName
    );
    
    if (newName === null) return;
    
    const trimmedName = newName.trim();
    
    if (trimmedName.length < 3) {
        showToast('El nombre debe tener al menos 3 caracteres', 'error');
        return;
    }
    
    if (trimmedName === currentName) {
        showToast('Sin cambios en el nombre', 'info');
        return;
    }
    
    try {
        const response = await PacientesAPI.updatePatientNameAPI(patientId, trimmedName);
        
        if (response.success) {
            patient.name = trimmedName;
            document.getElementById(`name-${patientId}`).textContent = trimmedName;
            renderPatients();
            showToast('Nombre actualizado correctamente');
        }
    } catch (error) {
        console.error('Error actualizando nombre:', error);
        showToast('Error al actualizar nombre', 'error');
    }
}

// Editar edad del paciente
async function editPatientAge(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentAge = patient.age;
    const newAge = prompt(
        `Editar edad del paciente:\n\n` +
        `Edad actual: ${currentAge} años\n\n` +
        `Ingrese la nueva edad (1-120):`,
        currentAge
    );
    
    if (newAge !== null && newAge !== '') {
        const ageNum = parseInt(newAge);
        
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
            showToast('La edad debe ser un número entre 1 y 120', 'error');
            return;
        }
        
        if (ageNum === currentAge) {
            showToast('Sin cambios en la edad', 'info');
            return;
        }
        
        try {
            const response = await PacientesAPI.updatePatientAgeAPI(patientId, ageNum);
            
            if (response.success) {
                patient.age = ageNum;
                document.getElementById(`age-${patientId}`).textContent = `${ageNum} años`;
                renderPatients();
                showToast('Edad actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando edad:', error);
            showToast('Error al actualizar edad', 'error');
        }
    }
}

// Editar RUT del paciente
async function editPatientRut(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentRut = patient.rut || '';
    const newRut = prompt(
        `Editar RUT del paciente:\n\n` +
        `RUT actual: ${currentRut || 'Sin RUT'}\n\n` +
        `Ingrese el nuevo RUT:`,
        currentRut
    );
    
    if (newRut !== null) {
        const trimmedRut = newRut.trim();
        
        if (trimmedRut && !validateRUT(trimmedRut)) {
            showToast('RUT inválido', 'error');
            return;
        }
        
        try {
            const response = await PacientesAPI.updatePatientRutAPI(patientId, trimmedRut);
            
            if (response.success) {
                patient.rut = trimmedRut;
                document.getElementById(`rut-${patientId}`).textContent = trimmedRut || 'Sin RUT';
                renderPatients();
                showToast('RUT actualizado correctamente');
            }
        } catch (error) {
            console.error('Error actualizando RUT:', error);
            showToast('Error al actualizar RUT', 'error');
        }
    }
}

// Editar cama del paciente
async function editPatientBed(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentBed = patient.bed || '';
    const newBed = prompt(
        `Editar cama del paciente:\n\n` +
        `Cama actual: ${currentBed || 'Sin asignar'}\n\n` +
        `Ingrese la nueva cama:`,
        currentBed
    );
    
    if (newBed !== null) {
        try {
            const response = await PacientesAPI.updatePatientBedAPI(patientId, newBed);
            
            if (response.success) {
                patient.bed = newBed || 'Sin asignar';
                document.getElementById(`bed-${patientId}`).textContent = newBed || 'Sin asignar';
                renderPatients();
                showToast('Cama actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando cama:', error);
            showToast('Error al actualizar cama', 'error');
        }
    }
}

// Editar fecha de ingreso
async function editAdmissionDate(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDate = patient.admissionDate.split('T')[0];
    const newDate = prompt(
        `Editar fecha de ingreso:\n\n` +
        `Fecha actual: ${formatDate(patient.admissionDate)}\n\n` +
        `Ingrese la nueva fecha (YYYY-MM-DD):`,
        currentDate
    );
    
    if (newDate !== null && newDate !== '') {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newDate)) {
            showToast('Formato de fecha inválido. Use YYYY-MM-DD', 'error');
            return;
        }
        
        try {
            const response = await PacientesAPI.updateAdmissionDateAPI(patientId, newDate);
            
            if (response.success) {
                patient.admissionDate = newDate;
                document.getElementById(`admission-date-${patientId}`).textContent = formatDate(newDate);
                renderPatients();
                showToast('Fecha de ingreso actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando fecha:', error);
            showToast('Error al actualizar fecha de ingreso', 'error');
        }
    }
}

// Editar diagnóstico
async function editDiagnosis(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDiagnosis = patient.diagnosis || '';
    const diagnosisOptions = Object.entries(catalogos.diagnosis).map(([codigo, nombre]) => 
        `${codigo} - ${nombre}`
    ).join('\n');
    
    const newDiagnosis = prompt(
        `Editar diagnóstico del paciente:\n\n` +
        `Diagnóstico actual: ${catalogos.getDiagnosisText(currentDiagnosis)}\n\n` +
        `Ingrese el código del nuevo diagnóstico:\n${diagnosisOptions}`,
        currentDiagnosis
    );
    
    if (newDiagnosis !== null && newDiagnosis !== '') {
        const validDiagnosis = catalogos.diagnosis[newDiagnosis];
        
        if (!validDiagnosis) {
            showToast('Código de diagnóstico inválido', 'error');
            return;
        }
        
        try {
            const response = await PacientesAPI.updateDiagnosisAPI(patientId, newDiagnosis);
            
            if (response.success) {
                patient.diagnosis = newDiagnosis;
                document.getElementById(`diagnosis-${patientId}`).textContent = catalogos.getDiagnosisText(newDiagnosis);
                renderPatients();
                showToast('Diagnóstico actualizado correctamente');
            }
        } catch (error) {
            console.error('Error actualizando diagnóstico:', error);
            showToast('Error al actualizar diagnóstico', 'error');
        }
    }
}

// Editar descripción del diagnóstico
async function editDiagnosisDetails(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDetails = patient.diagnosisDetails || '';
    const newDetails = prompt(
        `Editar descripción del diagnóstico:\n\n` +
        `Descripción actual: ${currentDetails || 'Sin descripción'}\n\n` +
        `Ingrese la nueva descripción:`,
        currentDetails
    );
    
    if (newDetails !== null) {
        try {
            const response = await PacientesAPI.updateDiagnosisDetailsAPI(patientId, newDetails);
            
            if (response.success) {
                patient.diagnosisDetails = newDetails || '';
                document.getElementById(`diagnosis-details-${patientId}`).textContent = newDetails || 'Sin descripción';
                showToast('Descripción actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando descripción:', error);
            showToast('Error al actualizar descripción', 'error');
        }
    }
}

// Editar médico tratante
async function editAdmittedBy(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDoctor = patient.admittedBy || '';
    const newDoctor = prompt(
        `Editar médico tratante:\n\n` +
        `Médico actual: ${currentDoctor || 'Sin asignar'}\n\n` +
        `Ingrese el nombre del nuevo médico tratante:`,
        currentDoctor
    );
    
    if (newDoctor !== null && newDoctor !== '') {
        try {
            const response = await PacientesAPI.updateAdmittedByAPI(patientId, newDoctor);
            
            if (response.success) {
                patient.admittedBy = newDoctor;
                document.getElementById(`admitted-by-${patientId}`).textContent = newDoctor;
                renderPatients();
                showToast('Médico tratante actualizado correctamente');
            }
        } catch (error) {
            console.error('Error actualizando médico:', error);
            showToast('Error al actualizar médico tratante', 'error');
        }
    }
}

// Editar cama desde la lista (versión simplificada)
async function editBed(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentBed = patient.bed || 'Sin asignar';
    const newBed = prompt(`Cambiar cama del paciente ${patient.name}:\n\nCama actual: ${currentBed}`, currentBed);
    
    if (newBed !== null && newBed !== currentBed) {
        try {
            const response = await PacientesAPI.updatePatientBedAPI(patientId, newBed);
            
            if (response.success) {
                patient.bed = newBed || 'Sin asignar';
                renderPatients();
                showToast('Cama actualizada correctamente');
            }
        } catch (error) {
            console.error('Error actualizando cama:', error);
            showToast('Error al actualizar cama', 'error');
        }
    }
}

// Función para editar diagnóstico desde la lista (diferente a editDiagnosis del modal)
async function editPatientDiagnosis(event, patientId) {
    event.stopPropagation();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    const currentDiagnosis = patient.diagnosis || '';
    const newDiagnosis = prompt(
        `Editar diagnóstico del paciente:\n\n` +
        `Diagnóstico actual: ${catalogos.getDiagnosisText(currentDiagnosis)}\n\n` +
        `Ingrese el nuevo diagnóstico:`,
        currentDiagnosis
    );
    
    if (newDiagnosis !== null && newDiagnosis !== '') {
        try {
            const response = await apiRequest(`/patients/${patientId}/admission`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    diagnosis_code: newDiagnosis,
                    diagnosis_text: newDiagnosis
                })
            });
            
            if (response.success) {
                patient.diagnosis = newDiagnosis;
                patient.diagnosisText = newDiagnosis;
                const diagElement = document.getElementById(`diagnosis-${patientId}`);
                if (diagElement) {
                    diagElement.textContent = newDiagnosis;
                }
                renderPatients();
                showToast('Diagnóstico actualizado correctamente');
            }
        } catch (error) {
            console.error('Error actualizando diagnóstico:', error);
            showToast('Error al actualizar diagnóstico', 'error');
        }
    }
}

// Hacer la función global para el onclick
window.editPatientDiagnosis = editPatientDiagnosis;

// Exportar funciones para usar en otros módulos
const PacientesEdit = {
    editPatientName,
    editPatientAge,
    editPatientRut,
    editPatientBed,
    editAdmissionDate,
    editDiagnosis,
    editDiagnosisDetails,
    editAdmittedBy,
    editBed,
    editPatientDiagnosis
};