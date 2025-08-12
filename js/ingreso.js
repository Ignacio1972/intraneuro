// ingreso.js - INTRANEURO Admission Management

// Initialize admission form
document.addEventListener('DOMContentLoaded', () => {
    const admissionForm = document.getElementById('admissionForm');
    if (admissionForm) {
        admissionForm.addEventListener('submit', handleAdmission);
    }
    
    // RUT input handler
    const rutInput = document.getElementById('patientRut');
    if (rutInput) {
        rutInput.addEventListener('blur', checkExistingPatient);
    }
    
    // No RUT checkbox
    const noRutCheckbox = document.getElementById('noRut');
    if (noRutCheckbox) {
        noRutCheckbox.addEventListener('change', (e) => {
            const rutInput = document.getElementById('patientRut');
            if (e.target.checked) {
                rutInput.disabled = true;
                rutInput.required = false;
                rutInput.value = '';
            } else {
                rutInput.disabled = false;
                rutInput.required = true;
            }
        });
    }
});

// MODIFICADA: Handle admission form submission con API
async function handleAdmission(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: document.getElementById('patientName').value,
        age: parseInt(document.getElementById('patientAge').value),
        rut: document.getElementById('noRut').checked ? null : document.getElementById('patientRut').value,
        phone: null,  // CAMBIADO: Ya no existe el campo de teléfono
        bed: document.getElementById('patientBed').value || 'Sin asignar',
        admissionDate: document.getElementById('admissionDate').value,
        diagnosis: document.getElementById('diagnosis').value,
        diagnosisText: document.getElementById('diagnosis').value,
        diagnosisDetails: document.getElementById('diagnosisDetails').value,
        allergies: null, // Campo temporalmente deshabilitado - 08/08/2025
        admittedBy: document.getElementById('admittedBy').value,
        status: 'active'
    };
    
    // Validate RUT if provided
    if (formData.rut && !validateRut(formData.rut)) {
        alert('El RUT ingresado no es válido');
        return;
    }
    
    // NUEVO: Intentar guardar en API primero
    try {
        const response = await apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response && response.patient) {
     //       console.log('Paciente guardado en BD:', response);
            
            // Crear objeto paciente con datos de respuesta
            const newPatient = {
                ...response.patient,
                bed: formData.bed,
                admissionDate: formData.admissionDate,
                diagnosis: formData.diagnosis,
                diagnosisText: formData.diagnosisText,
                diagnosisDetails: formData.diagnosisDetails,
                allergies: formData.allergies,
                admittedBy: formData.admittedBy,
                status: 'active',
                daysInHospital: calculateDays(formData.admissionDate),
                scheduledDischarge: false
            };
            
            // Actualizar array local para mantener sincronía
            patients.push(newPatient);
            
            // Show success message
            showAdmissionSuccess(newPatient);
            
            // Reset form
            e.target.reset();
            // document.getElementById('allergyDetails').style.display = 'none'; // Deshabilitado - 08/08/2025
            
            // Close modal y actualizar vista
            setTimeout(() => {
                closeModal('admissionModal');
                updateDashboard();
                // Recargar pacientes desde API para mantener sincronía
                if (typeof loadPatientsFromAPI === 'function') {
                    loadPatientsFromAPI().then(() => renderPatients());
                } else {
                    renderPatients();
                }
            }, 1500);
            
            return; // Salir si API funcionó
        }
    } catch (error) {
    //    console.log('Error guardando en API, usando fallback local:', error);
    }
    
    // FALLBACK: Lógica original si API falla
    const newPatient = {
        ...formData,
        id: Date.now(), // Temporary ID generation
        daysInHospital: calculateDays(formData.admissionDate),
        scheduledDischarge: false
    };
    
    patients.push(newPatient);
    
    // Show success message
    showAdmissionSuccess(newPatient);
    
    // Reset form
    e.target.reset();
    // document.getElementById('allergyDetails').style.display = 'none'; // Deshabilitado - 08/08/2025
    
    // Close modal
    setTimeout(() => {
        closeModal('admissionModal');
        updateDashboard();
        renderPatients();
    }, 1500);
}

// MODIFICADA: Check for existing patient con API
async function checkExistingPatient() {
    const rut = document.getElementById('patientRut').value;
    if (!rut) return;
    
    // NUEVO: Intentar buscar en API primero
    try {
        const response = await apiRequest(`/patients/search?rut=${encodeURIComponent(rut)}`);
        
        if (response && response.found && response.previousAdmissions) {
            const patientHistory = response.previousAdmissions;
            if (patientHistory.length > 0) {
                showReadmissionAlert(patientHistory);
                return;
            }
        }
    } catch (error) {
   //     console.log('Error buscando en API, usando datos locales:', error);
    }
    
    // FALLBACK: Buscar en datos locales
    const patientHistory = patients.filter(p => p.rut === rut && p.status === 'discharged');
    
    if (patientHistory.length > 0) {
        showReadmissionAlert(patientHistory);
    }
}

// Show readmission alert
function showReadmissionAlert(history) {
    const lastAdmission = history[history.length - 1];
    
    // Create alert banner
    const existingAlert = document.querySelector('.readmission-alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = 'readmission-alert';
    alert.innerHTML = `
        <div style="background: #FFF3CD; border: 1px solid #FFEAA7; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
            <h4 style="color: #856404; margin-bottom: 0.5rem;">⚠️ Paciente con historial previo</h4>
            <p style="color: #856404; margin: 0;">
                Último egreso: ${formatDate(lastAdmission.dischargeDate || lastAdmission.discharge_date)}<br>
                Diagnóstico previo: ${lastAdmission.diagnosis || lastAdmission.diagnosis_code} - ${lastAdmission.diagnosisText || lastAdmission.diagnosis_text}<br>
                Total de ingresos previos: ${history.length}
            </p>
        </div>
    `;
    
    // Insert after patient data section
    const formSection = document.querySelector('#admissionForm .form-section');
    formSection.appendChild(alert);
}

// Get diagnosis text
function getDiagnosisText(code) {
    const diagnoses = {
        'F32.1': 'Episodio depresivo moderado',
        'F41.1': 'Trastorno de ansiedad generalizada',
        'F20.0': 'Esquizofrenia paranoide',
        'F31.1': 'Trastorno bipolar, episodio maníaco',
        'F10.2': 'Dependencia del alcohol',
        'F43.1': 'Trastorno de estrés post-traumático',
        'F60.3': 'Trastorno límite de la personalidad',
        'F84.0': 'Autismo infantil',
        'F90.0': 'Trastorno por déficit de atención con hiperactividad',
        'F50.0': 'Anorexia nerviosa',
        'other': 'Otro diagnóstico'
    };
    
    return diagnoses[code] || code;
}

// Show admission success message
function showAdmissionSuccess(patient) {
    // Create success overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                    text-align: center; z-index: 2000;">
            <div style="font-size: 3rem; color: #27AE60; margin-bottom: 1rem;">✓</div>
            <h3 style="color: #2C3E50; margin-bottom: 0.5rem;">Ingreso Registrado</h3>
            <p style="color: #7F8C8D;">${patient.name} ha sido ingresado correctamente</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Remove after animation
    setTimeout(() => {
        overlay.remove();
    }, 1500);
}

// Quick patient search for discharge
function quickSearchPatient(searchTerm) {
    const activePatients = patients.filter(p => p.status === 'active');
    
    return activePatients.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.rut?.includes(searchTerm)
    );
}

// Populate diagnosis descriptions
const diagnosisDescriptions = {
    'F32.1': 'Caracterizado por estado de ánimo deprimido, pérdida de interés y disminución de energía',
    'F41.1': 'Ansiedad y preocupación excesivas que ocurren la mayoría de los días durante al menos 6 meses',
    'F20.0': 'Presencia de ideas delirantes, alucinaciones, lenguaje desorganizado',
    'F31.1': 'Período de estado de ánimo anormal y persistentemente elevado, expansivo o irritable',
    'F10.2': 'Patrón desadaptativo de consumo de alcohol que conlleva deterioro o malestar clínicamente significativo',
    'F43.1': 'Re-experimentación persistente del acontecimiento traumático',
    'F60.3': 'Patrón general de inestabilidad en las relaciones interpersonales',
    'F84.0': 'Desarrollo anormal o deficiente de la interacción social y comunicación',
    'F90.0': 'Patrón persistente de inatención y/o hiperactividad-impulsividad',
    'F50.0': 'Rechazo a mantener el peso corporal igual o por encima del valor mínimo normal'
};