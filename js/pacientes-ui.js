// pacientes-ui.js - INTRANEURO Componentes UI de Pacientes

// Render patient card
function renderPatientCard(patient) {
    const initials = getInitials(patient.name);
    const days = patient.daysInHospital;
    const diagnosisText = catalogos.getDiagnosisText(patient.diagnosis);
    
    // Badge de alta programada
    const scheduledBadge = patient.scheduledDischarge ? 
        '<span class="badge-scheduled">ALTA HOY</span>' : '';
    
    return `
        <div class="patient-card" data-patient-id="${patient.id}">
            ${scheduledBadge}
            <div class="patient-header">
                <div class="patient-avatar">${initials}</div>
                <div class="patient-basic-info">
                    <div class="patient-name">${patient.name}</div>
                    <div class="patient-age">${patient.age} años</div>
                </div>
            </div>
            <div class="stay-duration">
                <span class="days">${days}</span> días
            </div>
            <div class="diagnosis-code">${diagnosisText}</div>
            <div class="tooltip">${patient.diagnosisText}</div>
        </div>
    `;
}

// Render patient table
function renderPatientTable(activePatients) {
    return `
        <table class="patients-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Edad</th>
                    <th>Días</th>
                    <th>Diagnóstico</th>
                    <th>Ingresado</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${activePatients.map(patient => `
                    <tr data-patient-id="${patient.id}">
                        <td>${patient.name}</td>
                        <td>${patient.age} años</td>
                        <td>${patient.daysInHospital}</td>
                        <td>${catalogos.getDiagnosisText(patient.diagnosis)}</td>
                        <td>${formatDate(patient.admissionDate)}</td>
                        <td>${patient.scheduledDischarge ? 
                            '<span class="badge-scheduled-table">Alta hoy</span>' : 
                            '<span class="badge-active">Activo</span>'
                        }</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Render empty state
function renderEmptyState() {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">🏥</div>
            <h3>No hay pacientes activos</h3>
            <p>Haga clic en "Nuevo Ingreso" para registrar un paciente</p>
        </div>
    `;
}

// Render admission data (info del paciente en modal)
function renderAdmissionData(patient) {
    const diagnosisText = catalogos.getDiagnosisText(patient.diagnosis);
    
    return `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1rem;">
            <div class="grid-info-row">
                <div class="patient-info-row">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">${patient.name}</span>
                </div>
            </div>
            <div class="grid-info-row">
                <div class="patient-info-row">
                    <span class="info-label">Edad:</span>
                    <span class="info-value">${patient.age} años</span>
                </div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1rem;">
            <div class="grid-info-row">
                <div class="patient-info-row">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">${patient.phone || 'No registrado'}</span>
                </div>
            </div>
            <div class="grid-info-row">
                <div class="patient-info-row">
                    <span class="info-label">RUT:</span>
                    <span class="info-value">${patient.rut || 'Sin RUT'}</span>
                </div>
            </div>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Fecha Ingreso:</span>
            <span class="info-value">${formatDate(patient.admissionDate)}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Diagnóstico:</span>
            <span class="info-value">${diagnosisText}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Descripción:</span>
            <span class="info-value">${patient.diagnosisDetails || 'presenta intenso dolor de cabeza'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Alergias:</span>
            <span class="info-value">${patient.allergies || 'No presenta'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Ingresado por:</span>
            <span class="info-value">${patient.admittedBy}</span>
        </div>
    `;
}

// Render discharged data (info de egreso)
function renderDischargedData(patient) {
    const circles = Array.from({length: 7}, (_, i) => 
        i <= patient.ranking ? '●' : '○'
    ).join(' ');
    
    return `
        <div class="patient-info-row">
            <span class="info-label">Fecha Egreso:</span>
            <span class="info-value">${formatDate(patient.dischargeDate)}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Escala de Rankin:</span>
            <span class="info-value">${circles} (${patient.ranking})</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Diagnóstico Egreso:</span>
            <span class="info-value">${patient.dischargeDiagnosis}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Autorizado por:</span>
            <span class="info-value">${patient.dischargedBy}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Estado:</span>
            <span class="info-value">${patient.deceased ? '✝️ Fallecido' : 'Egresado'}</span>
        </div>
    `;
}

// Mostrar mensaje toast/notificación
function showToast(message, type = 'success') {
    // Remover toast anterior si existe
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Crear nuevo toast
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="toast-message">${message}</span>
    `;
    
    // Agregar al body
    document.body.appendChild(toast);
    
    // Animación de entrada
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}