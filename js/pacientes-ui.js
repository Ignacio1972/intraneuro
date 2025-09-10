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
                    <span class="bed-display">
                        ${patient.bed || 'Sin asignar'}
                    </span>
                </span>
                <button onclick="sharePatientFromList(event, ${patient.id}, '${patient.name.replace(/'/g, "\\'")}')" 
                        class="share-btn-inline" 
                        title="Compartir ficha"
                        style="background: none; border: none; cursor: pointer; padding: 5px; opacity: 0.7; transition: all 0.2s ease;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 2L11 13"></path>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                    </svg>
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
                    <th onclick="sortByColumn('name')" style="cursor: pointer; user-select: none;">
                        Nombre <span id="sort-name" style="font-size: 12px;"></span>
                    </th>
                    <th onclick="sortByColumn('age')" style="cursor: pointer; user-select: none;">
                        Edad <span id="sort-age" style="font-size: 12px;"></span>
                    </th>
                    <th>Diagnóstico</th>
                    <th onclick="sortByColumn('doctor')" style="cursor: pointer; user-select: none; position: relative;">
                        Médico Tratante <span id="sort-doctor" style="font-size: 12px;"></span>
                    </th>
                    <th onclick="sortByColumn('bed')" style="cursor: pointer; user-select: none;">
                        Cama <span id="sort-bed" style="font-size: 12px;"></span>
                    </th>
                    <th onclick="sortByColumn('days')" style="cursor: pointer; user-select: none;">
                        Días <span id="sort-days" style="font-size: 12px;"></span>
                    </th>
                    <th onclick="sortByColumn('admission')" style="cursor: pointer; user-select: none;">
                        Ingresado <span id="sort-admission" style="font-size: 12px;"></span>
                    </th>
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
                            <span class="doctor-display">
                                ${patient.admittedBy || 'Sin asignar'}
                            </span>
                        </td>
                        <td>
                            <span class="bed-display">
                                ${patient.bed || 'Sin asignar'}
                            </span>
                        </td>
                        <td>${patient.daysInHospital}</td>
                        <td>${formatDate(patient.admissionDate)}</td>
                        <td>
                            <button onclick="sharePatientFromList(event, ${patient.id}, '${patient.name.replace(/'/g, "\\'")}')" 
                                    class="share-btn-inline" 
                                    title="Compartir ficha"
                                    style="background: none; border: none; cursor: pointer; padding: 5px; opacity: 0.7; transition: all 0.2s ease;"
                                    onmouseover="this.style.opacity='1'; this.style.color='#4CAF50';"
                                    onmouseout="this.style.opacity='0.7'; this.style.color='inherit';">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 2L11 13"></path>
                                    <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                                </svg>
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
        
        <!-- NUEVA SECCIÓN: Sistema de Notas tipo Chat -->
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid var(--border-color);">
            <h3 style="font-weight: 600; color: var(--text-secondary); margin-bottom: 1rem;">
                📝 Seguimiento del Paciente
            </h3>
            
            <div class="chat-notes-container">
                <!-- Tabs para Historia y Pendientes -->
                <div class="chat-tabs">
                    <button class="chat-tab active" onclick="switchChatTab(${patient.id}, 'historia')">
                        Historia Clínica
                    </button>
                    <button class="chat-tab" onclick="switchChatTab(${patient.id}, 'pendientes')">
                        Tareas Pendientes
                    </button>
                </div>
                
                <!-- Área de mensajes -->
                <div class="chat-messages" id="chat-messages-${patient.id}">
                    <!-- Los mensajes se cargarán aquí dinámicamente -->
                </div>
                
                <!-- Input y botón de envío -->
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <textarea 
                            class="chat-input" 
                            id="chat-input-${patient.id}"
                            placeholder="Escribe una nota..."
                            rows="1"
                            onkeydown="handleChatKeydown(event, ${patient.id})"
                            oninput="autoResizeChatInput(this)"
                        ></textarea>
                    </div>
                    <button 
                        class="chat-send-btn" 
                        id="chat-send-btn-${patient.id}"
                        onclick="sendChatNote(${patient.id})"
                        title="Enviar nota"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Campos ocultos para mantener compatibilidad -->
            <input type="hidden" id="patientObservations" value="${patient.observations || ''}">
            <input type="hidden" id="patientPendingTasks" value="${patient.pendingTasks || ''}">
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