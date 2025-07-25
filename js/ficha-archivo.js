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
    document.getElementById('viewPhone').textContent = patientData.phone || 'Sin teléfono';
    
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
            <div class="admission-card">
                <div class="admission-header">
                    <h3>Admisión #${admissionNumber}</h3>
                    <span class="admission-duration">${duration} ${duration === 1 ? 'día' : 'días'}</span>
                </div>
                
                <div class="admission-content">
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
        document.getElementById('editPhone').value = patientData.phone || '';
        
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
    const phone = document.getElementById('editPhone').value.trim();
    
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
            age: age || null,
            phone: phone || null
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