// ficha-archivo.js - Lógica para la ficha de paciente archivado
let patientId = null;
let patientData = null;
let editMode = false;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Obtener ID del paciente de la URL
    const urlParams = new URLSearchParams(window.location.search);
    patientId = urlParams.get('id');
    
    if (!patientId || isNaN(patientId)) {
        showToast('ID de paciente no válido', 'error');
        setTimeout(() => {
            window.location.href = 'archivos.html';
        }, 2000);
        return;
    }
    
    loadPatientData();
});

// Cargar datos del paciente
async function loadPatientData() {
    showLoading(true);
    
    try {
        const response = await apiRequest(`/patients/${patientId}/history`);
        
        if (!response) {
            throw new Error('No se recibieron datos del paciente');
        }
        
        patientData = response;
        displayPatientData();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showToast('Error al cargar datos del paciente', 'error');
        
        // Esperar 3 segundos y volver a archivos
        setTimeout(() => {
            window.location.href = 'archivos.html';
        }, 3000);
    } finally {
        showLoading(false);
    }
}

// Mostrar datos del paciente
function displayPatientData() {
    if (!patientData) return;
    
    // Actualizar título y header
    document.getElementById('patientNameHeader').textContent = patientData.name || 'Sin nombre';
    document.title = `INTRANEURO - ${patientData.name}`;
    
    // Datos personales - Vista
    document.getElementById('viewName').textContent = patientData.name || '-';
    document.getElementById('viewRut').textContent = patientData.rut || 'Sin RUT';
    document.getElementById('viewAge').textContent = patientData.age ? `${patientData.age} años` : '-';
    
    // Mostrar admisiones
    displayAdmissions();
}

// Mostrar historial de admisiones
function displayAdmissions() {
    const container = document.getElementById('admissionsList');
    const countElement = document.getElementById('admissionCount');
    
    if (!patientData.admissions || patientData.admissions.length === 0) {
        container.innerHTML = '<p class="no-data">No hay admisiones registradas</p>';
        countElement.textContent = '0 admisiones';
        return;
    }
    
    // Actualizar contador
    const count = patientData.admissions.length;
    countElement.textContent = `${count} ${count === 1 ? 'admisión' : 'admisiones'}`;
    
    // Ordenar admisiones por fecha (más reciente primero)
    const sortedAdmissions = [...patientData.admissions].sort((a, b) => 
        new Date(b.admissionDate) - new Date(a.admissionDate)
    );
    
    let html = '';
    
    sortedAdmissions.forEach((admission, index) => {
        const admissionNumber = sortedAdmissions.length - index;
        const duration = calculateDaysBetween(admission.admissionDate, admission.dischargeDate);
        
        html += `
            <div class="admission-card" data-admission-id="${admission.admissionId}">
                <div class="admission-header">
                    <h3>Admisión #${admissionNumber}</h3>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="admission-duration">${duration} ${duration === 1 ? 'día' : 'días'}</span>
                        <button onclick="toggleEditAdmission(${admission.admissionId})" class="btn btn-small btn-secondary" title="Editar admisión">
                            <i class="icon">✏️</i> Editar
                        </button>
                    </div>
                </div>
                
                <!-- Modo Vista -->
                <div class="admission-content" id="admissionView-${admission.admissionId}">
                    <div class="admission-dates">
                        <div class="date-item">
                            <label>Ingreso:</label>
                            <span>${formatDate(admission.admissionDate)}</span>
                        </div>
                        <div class="date-item">
                            <label>Egreso:</label>
                            <span>${formatDate(admission.dischargeDate)}</span>
                        </div>
                    </div>
                    
                    <div class="admission-details">
                        <div class="detail-item">
                            <label>Diagnóstico de Ingreso:</label>
                            <span class="diagnosis-code">${admission.diagnosis || '-'}</span>
                            <span class="diagnosis-text">${admission.diagnosisText || '-'}</span>
                        </div>
                        
                        <div class="detail-item">
                            <label>Médico Tratante:</label>
                            <span>${admission.admittedBy || '-'}</span>
                        </div>
                        
                        <div class="detail-item">
                            <label>Cama:</label>
                            <span>${admission.bed || '-'}</span>
                        </div>
                        
                        ${admission.dischargeDiagnosis ? `
                        <div class="detail-item">
                            <label>Diagnóstico de Egreso:</label>
                            <span class="diagnosis-text">${admission.dischargeDiagnosis}</span>
                        </div>
                        ` : ''}
                        
                        <div class="detail-item">
                            <label>Escala de Rankin:</label>
                            <span class="rankin-score rankin-${admission.ranking || 0}">
                                ${admission.ranking || 0} - ${getRankinDescription(admission.ranking || 0)}
                            </span>
                        </div>
                        
                        <div class="detail-item">
                            <label>Médico de Alta:</label>
                            <span>${admission.dischargedBy || '-'}</span>
                        </div>
                        
                        ${admission.dischargeDetails ? `
                        <div class="detail-item discharge-details">
                            <label>Detalles de Egreso:</label>
                            <div class="details-text">${admission.dischargeDetails}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <!-- Modo Edición -->
                <div class="admission-content" id="admissionEdit-${admission.admissionId}" style="display: none;">
                    <div class="admission-dates">
                        <div class="date-item">
                            <label>Ingreso:</label>
                            <input type="date" id="editDate-${admission.admissionId}" class="form-control" value="${admission.admissionDate ? admission.admissionDate.split('T')[0] : ''}">
                        </div>
                        <div class="date-item">
                            <label>Egreso:</label>
                            <span>${formatDate(admission.dischargeDate)}</span>
                        </div>
                    </div>
                    
                    <div class="admission-details">
                        <div class="detail-item">
                            <label>Diagnóstico de Ingreso:</label>
                            <select id="editDiag-${admission.admissionId}" class="form-control">
                                <option value="">Seleccione diagnóstico...</option>
                            </select>
                        </div>
                        
                        <div class="detail-item">
                            <label>Médico Tratante:</label>
                            <input type="text" id="editDoctor-${admission.admissionId}" class="form-control" value="${admission.admittedBy || ''}" placeholder="Nombre del médico">
                        </div>
                        
                        <div class="detail-item">
                            <label>Cama:</label>
                            <input type="text" id="editBed-${admission.admissionId}" class="form-control" value="${admission.bed || ''}" placeholder="Ej: 12A">
                        </div>
                        
                        <div class="edit-actions" style="margin-top: 1rem;">
                            <button onclick="saveAdmissionChanges(${admission.admissionId})" class="btn btn-success">
                                <i class="icon">✓</i> Guardar
                            </button>
                            <button onclick="cancelAdmissionEdit(${admission.admissionId})" class="btn btn-secondary">
                                <i class="icon">✗</i> Cancelar
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="admission-actions">
                    <button onclick="loadObservations(${admission.admissionId})" class="btn btn-small btn-secondary">
                        Ver Observaciones
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}
// Cargar observaciones de una admisión
async function loadObservations(admissionId) {
    showLoading(true);
    
    try {
        const response = await apiRequest(`/patients/admission/${admissionId}/observations`);
        
        if (response && response.length > 0) {
            displayObservations(admissionId, response);
        } else {
            showToast('No hay observaciones para esta admisión', 'info');
        }
        
    } catch (error) {
        console.error('Error cargando observaciones:', error);
        showToast('Error al cargar observaciones', 'error');
    } finally {
        showLoading(false);
    }
}

// Mostrar observaciones
function displayObservations(admissionId, observations) {
    const section = document.getElementById('observationsSection');
    const container = document.getElementById('observationsContainer');
    
    // Encontrar la admisión correspondiente
    const admission = patientData.admissions.find(a => a.admissionId === admissionId);
    
    let html = `
        <div class="observations-header">
            <h4>Observaciones - Admisión del ${formatDate(admission.admissionDate)}</h4>
            <button onclick="hideObservations()" class="btn btn-small btn-secondary">
                Cerrar
            </button>
        </div>
        <div class="observations-list">
    `;
    
    observations.forEach(obs => {
        html += `
            <div class="observation-item">
                <div class="observation-meta">
                    <span class="observation-date">${formatDateTime(obs.created_at)}</span>
                    <span class="observation-author">${obs.created_by}</span>
                </div>
                <div class="observation-text">${obs.observation}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    section.style.display = 'block';
    
    // Scroll suave hacia las observaciones
    section.scrollIntoView({ behavior: 'smooth' });
}

// Ocultar observaciones
function hideObservations() {
    document.getElementById('observationsSection').style.display = 'none';
}

// Modo edición
function toggleEditMode() {
    editMode = !editMode;
    
    const viewMode = document.getElementById('patientDataView');
    const editModeDiv = document.getElementById('patientDataEdit');
    const editBtn = document.getElementById('editPatientBtn');
    
    if (editMode) {
        // Cargar datos en campos de edición
        document.getElementById('editName').value = patientData.name || '';
        document.getElementById('editRut').value = patientData.rut || '';
        document.getElementById('editAge').value = patientData.age || '';
        
        viewMode.style.display = 'none';
        editModeDiv.style.display = 'grid';
        editBtn.style.display = 'none';
        
        // Focus en el primer campo
        document.getElementById('editName').focus();
    } else {
        viewMode.style.display = 'grid';
        editModeDiv.style.display = 'none';
        editBtn.style.display = 'block';
    }
}

// Cancelar edición
function cancelEdit() {
    editMode = false;
    toggleEditMode();
}

// Guardar datos del paciente
async function savePatientData() {
    const name = document.getElementById('editName').value.trim();
    const rut = document.getElementById('editRut').value.trim();
    const age = parseInt(document.getElementById('editAge').value);
    
    // Validaciones
    if (!name) {
        showToast('El nombre es obligatorio', 'error');
        return;
    }
    
    if (age && (age < 1 || age > 120)) {
        showToast('La edad debe estar entre 1 y 120 años', 'error');
        return;
    }
    
    // Validar RUT si se ingresó
    if (rut && !validarRUT(rut)) {
        showToast('RUT inválido', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const updatedData = {
            name,
            rut: rut || null,
            age: age || null
        };
        
        await apiRequest(`/patients/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });
        
        // Actualizar datos locales
        patientData = { ...patientData, ...updatedData };
        
        // Actualizar vista
        displayPatientData();
        
        // Salir del modo edición
        cancelEdit();
        
        showToast('Datos actualizados correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando datos:', error);
        showToast('Error al guardar los datos', 'error');
    } finally {
        showLoading(false);
    }
}

// Variables para edición de admisión
let editingAdmissions = new Set();

// Toggle edición de admisión
function toggleEditAdmission(admissionId) {
    const viewMode = document.getElementById(`admissionView-${admissionId}`);
    const editMode = document.getElementById(`admissionEdit-${admissionId}`);
    
    if (editingAdmissions.has(admissionId)) {
        // Salir del modo edición
        cancelAdmissionEdit(admissionId);
    } else {
        // Entrar en modo edición
        editingAdmissions.add(admissionId);
        
        // Buscar la admisión en los datos
        const admission = patientData.admissions.find(a => a.admissionId === admissionId);
        
        if (!admission) {
            showToast('No se encontró la admisión', 'error');
            return;
        }
        
        // Llenar select de diagnósticos
        const select = document.getElementById(`editDiag-${admissionId}`);
        if (select && select.options.length <= 1) {
            if (typeof DIAGNOSTICOS !== 'undefined') {
                DIAGNOSTICOS.forEach(diag => {
                    const option = document.createElement('option');
                    option.value = diag.codigo;
                    option.textContent = `${diag.codigo} - ${diag.nombre}`;
                    if (diag.codigo === admission.diagnosis) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                });
            }
            
            // Si no hay diagnósticos cargados pero hay un valor actual
            if (admission.diagnosis && !select.value) {
                const option = document.createElement('option');
                option.value = admission.diagnosis;
                option.textContent = `${admission.diagnosis} - ${admission.diagnosisText || ''}`;
                option.selected = true;
                select.appendChild(option);
            }
        }
        
        // Mostrar modo edición
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
    }
}

// Cancelar edición de admisión
function cancelAdmissionEdit(admissionId) {
    editingAdmissions.delete(admissionId);
    
    const viewMode = document.getElementById(`admissionView-${admissionId}`);
    const editMode = document.getElementById(`admissionEdit-${admissionId}`);
    
    viewMode.style.display = 'block';
    editMode.style.display = 'none';
}

// Guardar cambios de admisión
async function saveAdmissionChanges(admissionId) {
    const dateInput = document.getElementById(`editDate-${admissionId}`);
    const diagSelect = document.getElementById(`editDiag-${admissionId}`);
    const doctorInput = document.getElementById(`editDoctor-${admissionId}`);
    const bedInput = document.getElementById(`editBed-${admissionId}`);
    
    if (!dateInput.value) {
        showToast('La fecha de ingreso es obligatoria', 'error');
        return;
    }
    
    const diagText = diagSelect.options[diagSelect.selectedIndex]?.text.split(' - ')[1] || '';
    
    const datos = {
        admission_date: dateInput.value,
        diagnosis_code: diagSelect.value,
        diagnosis_text: diagText,
        admitted_by: doctorInput.value || 'Sin asignar',
        bed: bedInput.value || 'Sin asignar'
    };
    
    showLoading(true);
    
    try {
        await apiRequest(`/patients/admission/${admissionId}`, {
            method: 'PUT',
            body: JSON.stringify(datos)
        });
        
        showToast('Admisión actualizada correctamente', 'success');
        
        // Salir del modo edición y recargar datos
        editingAdmissions.delete(admissionId);
        await loadPatientData();
        
    } catch (error) {
        console.error('Error actualizando admisión:', error);
        showToast('Error al actualizar la admisión', 'error');
    } finally {
        showLoading(false);
    }
}

// Utilidades
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
}

function getRankinDescription(ranking) {
    const descriptions = [
        'Sin síntomas',
        'Sin incapacidad importante',
        'Incapacidad leve',
        'Incapacidad moderada',
        'Incapacidad moderadamente grave',
        'Incapacidad grave',
        'Muerte'
    ];
    return descriptions[ranking] || 'Sin evaluar';
}

// Mostrar/ocultar loading
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// Mostrar toast
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}


// Imprimir - configuración especial
window.addEventListener('beforeprint', () => {
    // Expandir todas las secciones para impresión
    document.querySelectorAll('.admission-card').forEach(card => {
        card.style.pageBreakInside = 'avoid';
    });
    
});
// Funciones para el modal de borrar
function mostrarModalBorrar() {
    document.getElementById('modalBorrar').style.display = 'flex';
}

function cerrarModalBorrar() {
    document.getElementById('modalBorrar').style.display = 'none';
}

async function confirmarBorrado() {
    showLoading(true);
    
    try {
        await apiRequest(`/patients/${patientId}`, {
            method: 'DELETE'
        });
        
        showToast('Ficha eliminada correctamente', 'success');
        
        // Esperar un momento y redirigir
        setTimeout(() => {
            window.location.href = 'archivos.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error borrando paciente:', error);
        showToast('Error al borrar la ficha', 'error');
        showLoading(false);
    }
}

// Funciones para el modal de reingresar
function mostrarModalReingresar() {
    // Pre-llenar el formulario con datos actuales
    document.getElementById('reingresoNombre').value = patientData.name || '';
    document.getElementById('reingresoRut').value = patientData.rut || '';
    document.getElementById('reingresoEdad').value = patientData.age || '';
    
    // Llenar select de diagnósticos
    const select = document.getElementById('reingresoDiagnostico');
    select.innerHTML = '<option value="">Seleccione diagnóstico...</option>';
    
    if (typeof DIAGNOSTICOS !== 'undefined') {
        DIAGNOSTICOS.forEach(diag => {
            const option = document.createElement('option');
            option.value = diag.codigo;
            option.textContent = `${diag.codigo} - ${diag.nombre}`;
            select.appendChild(option);
        });
    }
    
    document.getElementById('modalReingresar').style.display = 'flex';
}

function cerrarModalReingresar() {
    document.getElementById('modalReingresar').style.display = 'none';
}

async function procesarReingreso() {
    const form = document.getElementById('formReingresar');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const diagSelect = document.getElementById('reingresoDiagnostico');
    const diagText = diagSelect.options[diagSelect.selectedIndex]?.text.split(' - ')[1] || '';
    
    const datos = {
        name: document.getElementById('reingresoNombre').value,
        age: parseInt(document.getElementById('reingresoEdad').value),
        rut: document.getElementById('reingresoRut').value || null,
        admissionDate: new Date().toISOString().split('T')[0],
        diagnosis: document.getElementById('reingresoDiagnostico').value,
        diagnosisText: diagText,
        bed: document.getElementById('reingresoCama').value || 'Sin asignar',
        admittedBy: sessionStorage.getItem('currentUser') || 'Sistema'
    };
    
    showLoading(true);
    
    try {
        await apiRequest('/patients', {
            method: 'POST',
            body: JSON.stringify(datos)
        });
        
        showToast('Paciente reingresado correctamente', 'success');
        
        // Redirigir al sistema principal
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error reingresando paciente:', error);
        showToast('Error al reingresar paciente', 'error');
        showLoading(false);
    }
}