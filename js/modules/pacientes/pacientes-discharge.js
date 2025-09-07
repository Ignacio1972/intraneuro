// pacientes-discharge.js - Módulo de alta y egreso de pacientes
// Manejo de altas programadas y egresos definitivos

// Toggle alta programada
async function toggleScheduledDischarge(patientId) {
    const isChecked = document.getElementById('toggleScheduledDischarge').checked;
    
    console.log(`[TOGGLE] Patient ${patientId}: ${isChecked ? 'Activando' : 'Desactivando'} alta programada`);
    
    try {
        const response = await PacientesAPI.toggleScheduledDischargeAPI(patientId, isChecked);
        
        if (response) {
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                // Actualizar el estado local del paciente
                patient.scheduledDischarge = isChecked;
                console.log(`[TOGGLE] Array local actualizado`);
                
                // Actualizar dashboard inmediatamente
                if (typeof updateDashboardFromAPI === 'function') {
                    updateDashboardFromAPI();
                }
                
                // Actualizar badges inmediatamente - esto es CLAVE
                if (typeof renderPatients === 'function') {
                    renderPatients();
                }
                
                // Actualizar el texto del toggle en el modal
                const toggleLabel = document.querySelector('.switch-label span');
                if (toggleLabel) {
                    toggleLabel.textContent = isChecked 
                        ? '✅ Alta programada para HOY' 
                        : '📅 Programar alta para HOY';
                    toggleLabel.style.color = isChecked ? '#28a745' : '#666';
                }
                
                // Mostrar notificación toast
                const message = isChecked 
                    ? 'Alta activada para hoy' 
                    : 'Alta desactivada';
                showToast(message);
            }
        }
    } catch (error) {
        console.error('[TOGGLE] Error actualizando alta programada:', error);
        
        // Revertir el toggle si falló
        document.getElementById('toggleScheduledDischarge').checked = !isChecked;
        showToast('Error al cambiar estado de alta programada', 'error');
    }
}

// Procesar egreso definitivo
async function processDischarge(event, patientId) {
    event.preventDefault();
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Obtener valores del formulario
    const dischargeDate = document.getElementById('dischargeDate')?.value;
    const dischargeDiagnosis = document.getElementById('dischargeDiagnosis')?.value;
    const dischargeDetails = document.getElementById('dischargeDetails')?.value;
    // Ranking eliminado del sistema
    const deceased = document.getElementById('patientDeceased')?.checked || false;
    
    // Validaciones
    if (!dischargeDate) {
        showToast('Por favor ingrese la fecha de egreso', 'error');
        return;
    }
    
    if (!dischargeDiagnosis) {
        showToast('Por favor seleccione el diagnóstico de egreso', 'error');
        return;
    }
    
    // Confirmación
    const confirmMessage = deceased 
        ? `⚠️ CONFIRMAR FALLECIMIENTO\n\n¿Está seguro de registrar el fallecimiento de ${patient.name}?`
        : `¿Confirmar el egreso de ${patient.name}?\n\nFecha: ${formatDate(dischargeDate)}\nDiagnóstico: ${catalogos.getDiagnosisText(dischargeDiagnosis)}`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const dischargeData = {
            date: dischargeDate,
            diagnosis: dischargeDiagnosis,
            details: dischargeDetails,
            // ranking eliminado del sistema
            deceased: deceased,
            dischargedBy: sessionStorage.getItem('currentUser') || 'Usuario'
        };
        
        const response = await PacientesAPI.processDischargeAPI(patientId, dischargeData);
        
        if (response.success) {
            // Remover de la lista de pacientes activos
            patients = patients.filter(p => p.id !== patientId);
            
            // Cerrar modal y actualizar vista
            closeModal('patientModal');
            updateDashboardFromAPI();
            renderPatients();
            
            showToast(`✅ Paciente ${patient.name} egresado correctamente`);
        }
    } catch (error) {
        console.error('Error procesando egreso:', error);
        showToast('Error al procesar el egreso', 'error');
    }
}

// Renderizar formulario de egreso
function renderDischargeForm(patientId, patient) {
    const scheduledClass = patient.scheduledDischarge ? 'scheduled' : '';
    const scheduledText = patient.scheduledDischarge ? 'ALTA PROGRAMADA' : 'Programar Alta';
    
    return `
        <div class="discharge-form">
            <h3>Egreso del Paciente</h3>
            
            <!-- Toggle Alta Programada -->
            <div class="form-group" style="margin-bottom: 20px;">
                <label class="switch-label" style="display: flex; align-items: center; justify-content: space-between;">
                    <span style="font-weight: 600; color: ${patient.scheduledDischarge ? '#28a745' : '#666'};">
                        ${patient.scheduledDischarge ? '✅ Alta programada para HOY' : '📅 Programar alta para HOY'}
                    </span>
                    <label class="switch">
                        <input type="checkbox" 
                               id="toggleScheduledDischarge" 
                               ${patient.scheduledDischarge ? 'checked' : ''} 
                               onchange="toggleScheduledDischarge(${patientId})">
                        <span class="slider"></span>
                    </label>
                </label>
            </div>
            
            <form id="dischargeForm" onsubmit="processDischarge(event, ${patientId})">
                <div class="form-row">
                    <div class="form-group">
                        <label for="dischargeDate">Fecha de Egreso:</label>
                        <input type="date" id="dischargeDate" required 
                               max="${new Date().toISOString().split('T')[0]}">
                    </div>
                    
                    <div class="form-group">
                        <label for="dischargeDiagnosis">Diagnóstico de Egreso:</label>
                        <select id="dischargeDiagnosis" required>
                            <option value="">Seleccione...</option>
                            ${Object.entries(catalogos.diagnosis).map(([codigo, nombre]) => 
                                `<option value="${codigo}" ${patient.diagnosis === codigo ? 'selected' : ''}>
                                    ${codigo} - ${nombre}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="dischargeDetails">Detalles del Egreso:</label>
                    <textarea id="dischargeDetails" rows="3" 
                              placeholder="Condición del paciente al egreso, recomendaciones, etc."></textarea>
                </div>
                
                <!-- Escala de Rankin ELIMINADA del sistema -->
                
                <!-- Checkbox fallecimiento -->
                <div class="form-group checkbox-group">
                    <label>
                        <input type="checkbox" id="patientDeceased">
                        <span class="checkbox-label">Paciente fallecido</span>
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        Confirmar Egreso
                    </button>
                    <button type="button" class="btn btn-secondary" 
                            onclick="closeModal('patientModal')">
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    `;
}

// Función setRating eliminada - Rankin ya no se usa en el sistema
// Dejar función vacía para evitar errores
window.setRating = function(rating) {
    // Función vacía - Rankin eliminado
}

// Renderizar datos de paciente egresado (solo lectura)
function renderDischargedData(patient) {
    return `
        <div class="discharged-info">
            <div class="alert alert-info">
                <strong>Paciente Egresado</strong>
            </div>
            
            <div class="info-row">
                <span class="info-label">Fecha de Egreso:</span>
                <span class="info-value">${formatDate(patient.dischargeDate)}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">Diagnóstico de Egreso:</span>
                <span class="info-value">${patient.dischargeDiagnosis || 'No especificado'}</span>
            </div>
            
            <div class="info-row">
                <span class="info-label">Detalles:</span>
                <span class="info-value">${patient.dischargeDetails || 'Sin detalles'}</span>
            </div>
            
            <!-- Escala Rankin eliminada -->
            
            ${patient.deceased ? `
                <div class="alert alert-warning">
                    <strong>Paciente Fallecido</strong>
                </div>
            ` : ''}
            
            <div class="info-row">
                <span class="info-label">Egresado por:</span>
                <span class="info-value">${patient.dischargedBy || 'No especificado'}</span>
            </div>
        </div>
    `;
}

// Exportar funciones
const PacientesDischarge = {
    toggleScheduledDischarge,
    processDischarge,
    renderDischargeForm,
    setRating,
    renderDischargedData
};