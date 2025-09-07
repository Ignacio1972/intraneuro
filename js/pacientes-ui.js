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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; padding: 0.5rem 0; border-top: 1px solid rgba(0,0,0,0.05);">
                <span class="patient-meta" style="font-size: 0.85rem; color: var(--text-secondary);">
                    <span class="icon">🛏️</span> Cama: 
                    <span class="bed-display" onclick="editBed(event, ${patient.id})" 
                          style="cursor: pointer; text-decoration: underline; color: var(--primary-color);">
                        ${patient.bed || 'Sin asignar'}
                    </span>
                </span>
                <button onclick="sharePatientFromList(event, ${patient.id}, '${patient.name.replace(/'/g, "\\'")}')" 
                        class="share-btn-inline" 
                        title="Compartir ficha"
                        style="background: none; border: none; cursor: pointer; padding: 5px; opacity: 0.6;">
                    <span style="font-size: 18px;">📤</span>
                </button>
            </div>
        </div>
    `;
}

// Render patient table
function renderPatientTable(activePatients) {
    return `
        <table class="patients-table">
            <thead>
                <tr>
                    <th></th>
                    <th>Nombre</th>
                    <th>Edad</th>
                    <th>Diagnóstico</th>
                    <th>Médico Tratante</th>
                    <th>Cama</th>
                    <th>Días</th>
                    <th>Ingresado</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${activePatients.map(patient => `
                    <tr data-patient-id="${patient.id}">
                        <td>
                            <div class="status-indicator ${patient.scheduledDischarge ? 'scheduled' : 'active'}">
                                <div class="status-dot"></div>
                            </div>
                        </td>
                        <td>${patient.name}</td>
                        <td>${patient.age} años</td>
                        <td>${catalogos.getDiagnosisText(patient.diagnosis)}</td>
                        <td>
                            <span class="doctor-display" onclick="editAdmittedBy(event, ${patient.id})" 
                                  style="cursor: pointer; text-decoration: underline; color: var(--primary-color);">
                                ${patient.admittedBy || 'Sin asignar'}
                            </span>
                        </td>
                        <td>
                            <span class="bed-display" onclick="editBed(event, ${patient.id})" 
                                  style="cursor: pointer; text-decoration: underline; color: var(--primary-color);">
                                ${patient.bed || 'Sin asignar'}
                            </span>
                        </td>
                        <td>${patient.daysInHospital}</td>
                        <td>${formatDate(patient.admissionDate)}</td>
                        <td>
                            <button onclick="sharePatientFromList(event, ${patient.id}, '${patient.name.replace(/'/g, "\\'")}')" 
                                    class="share-btn-inline" 
                                    title="Compartir ficha"
                                    style="background: none; border: none; cursor: pointer; padding: 5px; opacity: 0.6; transition: opacity 0.2s;">
                                <span style="font-size: 18px;">📤</span>
                            </button>
                        </td>
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
    
    // Cargar observaciones y tareas al abrir el modal
    setTimeout(() => {
        loadObservationHistory(patient.id);
        loadTaskHistory(patient.id);
    }, 100);
    
    return `
        <div class="patient-info-row">
            <span class="info-label">
                <span onclick="editPatientName(event, ${patient.id})" 
                      style="cursor: pointer; margin-right: 5px; color: var(--primary-color); font-size: 0.9em;" 
                      title="Editar nombre">✏️</span>
                Nombre:
            </span>
            <span class="info-value" id="name-${patient.id}">${patient.name}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">
                <span onclick="editPatientAge(event, ${patient.id})" 
                      style="cursor: pointer; margin-right: 5px; color: var(--primary-color); font-size: 0.9em;" 
                      title="Editar edad">✏️</span>
                Edad:
            </span>
            <span class="info-value" id="age-${patient.id}">${patient.age} años</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">
                <span onclick="editPatientRut(event, ${patient.id})" 
                      style="cursor: pointer; margin-right: 5px; color: var(--primary-color); font-size: 0.9em;" 
                      title="Editar RUT">✏️</span>
                RUT:
            </span>
            <span class="info-value" id="rut-${patient.id}">${patient.rut || 'Sin RUT'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">
                <span onclick="editPatientBed(event, ${patient.id})" 
                      style="cursor: pointer; margin-right: 5px; color: var(--primary-color); font-size: 0.9em;" 
                      title="Editar cama">✏️</span>
                Cama:
            </span>
            <span class="info-value" id="bed-${patient.id}">${patient.bed || 'Sin asignar'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">
                <span onclick="editAdmissionDate(event, ${patient.id})" 
                      style="cursor: pointer; margin-right: 5px; color: var(--primary-color); font-size: 0.9em;" 
                      title="Editar fecha de ingreso">✏️</span>
                Fecha Ingreso:
            </span>
            <span class="info-value" id="admission-date-${patient.id}">${formatDate(patient.admissionDate)}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">
                <span onclick="editPatientDiagnosis(event, ${patient.id})" 
                      style="cursor: pointer; margin-right: 5px; color: var(--primary-color); font-size: 0.9em;" 
                      title="Editar diagnóstico">✏️</span>
                Diagnóstico:
            </span>
            <span class="info-value" id="diagnosis-${patient.id}">${diagnosisText}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">
                <span onclick="editDiagnosisDetails(event, ${patient.id})" 
                      style="cursor: pointer; margin-right: 5px; color: var(--primary-color); font-size: 0.9em;" 
                      title="Editar descripción">✏️</span>
                Descripción:
            </span>
            <span class="info-value" id="diagnosis-details-${patient.id}">${patient.diagnosisDetails || 'presenta intenso dolor de cabeza'}</span>
        </div>
        <div class="patient-info-row">
            <span class="info-label">
                <span onclick="editAdmittedBy(event, ${patient.id})" 
                      style="cursor: pointer; margin-right: 5px; color: var(--primary-color); font-size: 0.9em;" 
                      title="Editar médico tratante">✏️</span>
                Médico Tratante:
            </span>
            <span class="info-value" id="admitted-by-${patient.id}">${patient.admittedBy}</span>
        </div>
        
        <!-- NUEVA SECCIÓN: Historia y Pendientes -->
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color);">
            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">
                    Historia:
                </label>
                <textarea 
                    id="patientObservations" 
                    style="width: 100%; max-width: 100%; min-height: 120px; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 4px; resize: vertical; box-sizing: border-box;"
                    placeholder="Historia clínica del paciente..."
                >${patient.observations || ''}</textarea>
                <div id="observationHistory" style="margin-top: 0.5rem; font-size: 0.85em; color: var(--text-secondary);"></div>
            </div>
            
            <div class="form-group" style="margin-bottom: 1rem;">
                <label style="font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">
                    Pendientes:
                </label>
                <textarea 
                    id="patientPendingTasks" 
                    style="width: 100%; max-width: 100%; min-height: 120px; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 4px; resize: vertical; box-sizing: border-box;"
                    placeholder="Tareas o procedimientos pendientes..."
                >${patient.pendingTasks || ''}</textarea>
                <div id="taskHistory" style="margin-top: 0.5rem; font-size: 0.85em; color: var(--text-secondary);"></div>
            </div>
            
            <button 
                class="btn btn-primary" 
                onclick="saveObservationsAndTasks(${patient.id})"
                style="width: 60%;">
                Guardar
            </button>
        </div>
    `;
}


// Render discharged data (info de egreso)
function renderDischargedData(patient) {
    // Variable circles comentada ya que no se usa - 08/08/2025
    return `
        <div class="patient-info-row">
            <span class="info-label">Fecha Egreso:</span>
            <span class="info-value">${formatDate(patient.dischargeDate)}</span>
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

// Cargar historial de observaciones
async function loadObservationHistory(patientId) {
    try {
        const observations = await apiRequest(`/patients/${patientId}/admission/observations`);
        if (observations.length > 0) {
            const latest = observations[0];
            document.getElementById('patientObservations').value = latest.observation;
            
            // Mostrar información de la última actualización
            const historyDiv = document.getElementById('observationHistory');
            if (historyDiv) {
                const date = new Date(latest.created_at);
                historyDiv.innerHTML = `Última actualización: ${date.toLocaleDateString('es-CL')} por ${latest.created_by}`;
            }
        }
    } catch (error) {
        console.log('Usando datos locales para observaciones');
    }
}

// Cargar historial de tareas
async function loadTaskHistory(patientId) {
    try {
        const tasks = await apiRequest(`/patients/${patientId}/admission/tasks`);
        if (tasks.length > 0) {
            const latest = tasks[0];
            document.getElementById('patientPendingTasks').value = latest.task;
            
            // Mostrar información de la última actualización
            const historyDiv = document.getElementById('taskHistory');
            if (historyDiv) {
                const date = new Date(latest.created_at);
                historyDiv.innerHTML = `Última actualización: ${date.toLocaleDateString('es-CL')} por ${latest.created_by}`;
            }
        }
    } catch (error) {
        console.log('Usando datos locales para tareas');
    }
}

// Función helper para obtener iniciales
function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// Función helper para formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // FIX: Agregar T12:00:00 para evitar problemas de timezone
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}