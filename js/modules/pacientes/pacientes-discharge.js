// pacientes-discharge.js - Módulo de alta y egreso de pacientes
// Manejo de altas programadas y egresos definitivos

// Toggle alta programada
async function toggleScheduledDischarge(patientId) {
    try {
        const response = await PacientesAPI.toggleScheduledDischargeAPI(patientId);
        
        if (response.scheduled !== undefined) {
            const patient = patients.find(p => p.id === patientId);
            if (patient) {
                patient.scheduledDischarge = response.scheduled;
                renderPatients();
                
                const message = response.scheduled 
                    ? '✅ Alta programada activada' 
                    : '❌ Alta programada desactivada';
                showToast(message);
            }
        }
    } catch (error) {
        console.error('Error toggling scheduled discharge:', error);
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
    const ranking = document.getElementById('selectedRating')?.value || 0;
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
            ranking: parseInt(ranking),
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
            <div class="scheduled-discharge-toggle">
                <button type="button" 
                        class="btn-scheduled ${scheduledClass}" 
                        onclick="toggleScheduledDischarge(${patientId})">
                    ${scheduledText}
                </button>
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
                
                <!-- Escala de Rankin -->
                <div class="form-group">
                    <label>Escala de Rankin Modificada:</label>
                    <div class="ranking-scale">
                        ${[0,1,2,3,4,5,6].map(i => `
                            <button type="button" class="ranking-btn" 
                                    onclick="setRating(${i})" 
                                    data-rating="${i}">
                                ${i}
                            </button>
                        `).join('')}
                    </div>
                    <div id="rankingDescription" class="ranking-description"></div>
                    <input type="hidden" id="selectedRating" value="0">
                </div>
                
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

// Establecer calificación Rankin
function setRating(rating) {
    // Quitar clase active de todos los botones
    document.querySelectorAll('.ranking-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Agregar clase active al botón seleccionado
    document.querySelector(`.ranking-btn[data-rating="${rating}"]`)?.classList.add('active');
    
    // Guardar valor seleccionado
    document.getElementById('selectedRating').value = rating;
    
    // Mostrar descripción
    const descriptions = {
        0: 'Sin síntomas',
        1: 'Sin incapacidad importante',
        2: 'Incapacidad leve',
        3: 'Incapacidad moderada',
        4: 'Incapacidad moderadamente severa',
        5: 'Incapacidad severa',
        6: 'Muerte'
    };
    
    document.getElementById('rankingDescription').textContent = descriptions[rating] || '';
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
            
            ${patient.ranking !== undefined ? `
                <div class="info-row">
                    <span class="info-label">Escala Rankin:</span>
                    <span class="info-value">${patient.ranking}</span>
                </div>
            ` : ''}
            
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