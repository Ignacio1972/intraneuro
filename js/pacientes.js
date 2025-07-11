// pacientes.js - INTRANEURO Patient Management

// Render patients based on current view
function renderPatients() {
    const container = document.getElementById('patientsContainer');
    const activePatients = patients.filter(p => p.status === 'active');
    
    if (activePatients.length === 0) {
        container.innerHTML = renderEmptyState();
        return;
    }
    
    if (viewMode === 'cards') {
        container.className = 'patients-grid';
        container.innerHTML = activePatients.map(patient => renderPatientCard(patient)).join('');
    } else {
        container.className = 'patients-list';
        container.innerHTML = renderPatientTable(activePatients);
    }
    
    // Add click handlers
    addPatientClickHandlers();
}

// Render patient card
function renderPatientCard(patient) {
    const initials = getInitials(patient.name);
    const days = patient.daysInHospital;
    
    return `
        <div class="patient-card" data-patient-id="${patient.id}">
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
            <div class="diagnosis-code">[${patient.diagnosis}]</div>
            <div class="tooltip">${patient.diagnosisText}</div>
        </div>
    `;
}

// Render patient table
function renderPatientTable(patients) {
    return `
        <table class="patients-table">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Edad</th>
                    <th>RUT</th>
                    <th>Días</th>
                    <th>Diagnóstico</th>
                    <th>Ingresado</th>
                </tr>
            </thead>
            <tbody>
                ${patients.map(patient => `
                    <tr data-patient-id="${patient.id}">
                        <td>${patient.name}</td>
                        <td>${patient.age} años</td>
                        <td>${patient.rut}</td>
                        <td>${patient.daysInHospital}</td>
                        <td>${patient.diagnosis}</td>
                        <td>${formatDate(patient.admissionDate)}</td>
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

// Add click handlers to patient elements
function addPatientClickHandlers() {
    const patientElements = document.querySelectorAll('[data-patient-id]');
    
    patientElements.forEach(element => {
        element.addEventListener('click', (e) => {
            const patientId = parseInt(e.currentTarget.dataset.patientId);
            openPatientModal(patientId);
        });
    });
}

// Open patient modal
function openPatientModal(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Fill admission data
    const admissionData = document.getElementById('admissionData');
    admissionData.innerHTML = `
        <div class="patient-info-row">
            <span class="info-label">Nombre:</span>
            <span class="info-value">${patient.name}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Edad:</span>
            <span class="info-value">${patient.age} años</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">RUT:</span>
            <span class="info-value">${patient.rut || 'Sin RUT'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Teléfono:</span>
            <span class="info-value">${patient.phone || 'No registrado'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Fecha Ingreso:</span>
            <span class="info-value">${formatDate(patient.admissionDate)}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Diagnóstico:</span>
            <span class="info-value">${patient.diagnosis}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Descripción:</span>
            <span class="info-value">${patient.diagnosisDetails}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Alergias:</span>
            <span class="info-value">${patient.allergies || 'No presenta'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Ingresado por:</span>
            <span class="info-value">${patient.admittedBy}</span>
        </div>
        <button class="btn btn-secondary" onclick="editPatientData(${patient.id})">Editar datos</button>
    `;
    
    // Fill discharge data
    const dischargeData = document.getElementById('dischargeData');
    if (patient.dischargeDate) {
        // Patient already discharged
        dischargeData.innerHTML = renderDischargedData(patient);
    } else {
        // Active patient - show discharge form
        dischargeData.innerHTML = renderDischargeForm(patient.id);
    }
    
    // Load timeline
    loadPatientTimeline(patient.id);
    
    // Load observations
    loadPatientObservations(patient.id);
    
    // Open modal
    openModal('patientModal');
}

// Render discharge form
function renderDischargeForm(patientId) {
    return `
        <form id="dischargeForm" class="discharge-form" onsubmit="processDischarge(event, ${patientId})">
            <div class="form-group">
                <label>Fecha de Egreso:</label>
                <div class="date-input-group">
                    <input type="date" id="dischargeDate" required>
                    <button type="button" class="btn-today" onclick="setToday('dischargeDate')">HOY</button>
                </div>
            </div>
            <div class="form-group">
                <label>Ranking:</label>
                <div class="ranking-selector" id="rankingSelector">
                    ${[0,1,2,3,4,5,6].map(i => 
                        `<span class="star" data-rating="${i}" onclick="setRating(${i})">⭐</span>`
                    ).join('')}
                </div>
                <input type="hidden" id="patientRanking" value="0" required>
            </div>
            <div class="form-group">
                <label>Diagnóstico de Egreso:</label>
                <select id="dischargeDiagnosis" required>
                    <option value="">Seleccione...</option>
                    <option value="alta">Alta médica</option>
                    <option value="F32.1">F32.1 - Episodio depresivo moderado</option>
                    <option value="F41.1">F41.1 - Trastorno de ansiedad generalizada</option>
                    <option value="F20.0">F20.0 - Esquizofrenia paranoide</option>
                    <option value="F31.1">F31.1 - Trastorno bipolar</option>
                    <option value="F10.2">F10.2 - Dependencia del alcohol</option>
                    <option value="other">Otro...</option>
                </select>
                <textarea id="dischargeDetails" placeholder="Detalles adicionales..." rows="2"></textarea>
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="patientDeceased"> Paciente fallecido
                </label>
            </div>
            <div class="form-group">
                <label>Autorizado por:</label>
                <input type="text" id="authorizedBy" required>
            </div>
            <div class="form-group">
                <label>Contraseña:</label>
                <input type="password" id="dischargePassword" required>
            </div>
            <button type="submit" class="btn btn-primary">PROCESAR EGRESO</button>
        </form>
    `;
}

// Render discharged data
function renderDischargedData(patient) {
    return `
        <div class="patient-info-row">
            <span class="info-label">Fecha Egreso:</span>
            <span class="info-value">${formatDate(patient.dischargeDate)}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">Ranking:</span>
            <span class="info-value">${'⭐'.repeat(patient.ranking)}</span>
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

// Set rating
function setRating(rating) {
    document.getElementById('patientRanking').value = rating;
    
    // Update visual
    const stars = document.querySelectorAll('#rankingSelector .star');
    stars.forEach((star, index) => {
        star.classList.toggle('active', index <= rating);
    });
}

// Process discharge
function processDischarge(event, patientId) {
    event.preventDefault();
    
    const authorizedBy = document.getElementById('authorizedBy').value;
    const password = document.getElementById('dischargePassword').value;
    
    // Validate authorization
    if (!validateAuthorization(authorizedBy, password)) {
        alert('Contraseña incorrecta para el usuario especificado');
        return;
    }
    
    // Get form data
    const dischargeData = {
        dischargeDate: document.getElementById('dischargeDate').value,
        ranking: parseInt(document.getElementById('patientRanking').value),
        dischargeDiagnosis: document.getElementById('dischargeDiagnosis').value,
        dischargeDetails: document.getElementById('dischargeDetails').value,
        deceased: document.getElementById('patientDeceased').checked,
        dischargedBy: authorizedBy
    };
    
    // Update patient
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        Object.assign(patient, dischargeData);
        patient.status = 'discharged';
        
        // Show success message
        alert('Egreso procesado correctamente');
        
        // Close modal and refresh
        closeModal('patientModal');
        updateDashboard();
        renderPatients();
    }
}

// Load patient timeline
function loadPatientTimeline(patientId) {
    const timeline = document.getElementById('patientTimeline');
    // Mock timeline data
    timeline.innerHTML = `
        <h3>Historial</h3>
        <div class="timeline-item">
            <span class="timeline-date">${formatDate(new Date())}</span>
            <span class="timeline-event">Ingreso registrado</span>
        </div>
    `;
}

// Load patient observations
function loadPatientObservations(patientId) {
    const observations = document.getElementById('patientObservations');
    // Load saved observations (mock)
    observations.value = '';
}

// Edit patient data
function editPatientData(patientId) {
    alert('Función de edición en desarrollo');
}