// pacientes-refactored.js - Archivo principal refactorizado
// Orquestador que usa los módulos especializados

// NO declarar variables globales aquí - usar las de main.js
// viewMode se declara en main.js línea 6
// patients se declara en main.js línea 5
// currentPatientId se declara en main.js
// hasUnsavedChanges se declara en main.js línea 9

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Inicializando módulo de pacientes refactorizado...');
    
    // Solo cargar pacientes si estamos autenticados (main app visible)
    const mainApp = document.getElementById('mainApp');
    if (mainApp && mainApp.style.display !== 'none') {
        // Cargar pacientes al inicio
        renderPatients();
        
        // Verificar si hay un paciente en la URL para abrir
        checkURLForPatient();
    }
    
    // Event listeners siempre se configuran
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Toggle vista cards/table
    const viewToggle = document.getElementById('viewToggle');
    if (viewToggle) {
        viewToggle.addEventListener('click', () => {
            viewMode = viewMode === 'cards' ? 'table' : 'cards';
            localStorage.setItem('viewMode', viewMode);
            renderPatients();
        });
    }
    
    // Botón nuevo paciente
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) {
        newPatientBtn.addEventListener('click', () => {
            openModal('newPatientModal');
        });
    }
    
    // Botón exportar Excel
    const exportBtn = document.getElementById('exportExcelBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportActivePatientsToExcel);
    }
    
    // Botón imprimir
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', printActivePatients);
    }
}

// Renderizar pacientes (función principal)
async function renderPatients() {
    // Primero intentar cargar desde API
    await PacientesAPI.loadPatientsFromAPI();
    
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
    
    // Agregar click handlers
    addPatientClickHandlers();
}

// Agregar event handlers a elementos de pacientes
function addPatientClickHandlers() {
    const patientElements = document.querySelectorAll('[data-patient-id]');
    
    patientElements.forEach(element => {
        element.addEventListener('click', (e) => {
            const patientId = parseInt(e.currentTarget.dataset.patientId);
            openPatientModal(patientId);
        });
    });
}

// Abrir modal del paciente
function openPatientModal(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    // Llenar datos de admisión
    const admissionData = document.getElementById('admissionData');
    admissionData.innerHTML = renderAdmissionData(patient);
    
    // Agregar botón de compartir
    addShareButton(patientId, patient.name);
    
    // Llenar datos de egreso
    const dischargeData = document.getElementById('dischargeData');
    if (patient.dischargeDate) {
        dischargeData.innerHTML = PacientesDischarge.renderDischargedData(patient);
    } else {
        dischargeData.innerHTML = PacientesDischarge.renderDischargeForm(patientId, patient);
    }
    
    // Abrir modal
    openModal('patientModal');
    
    // Establecer ID actual
    currentPatientId = patientId;
    
    // Agregar al historial para interceptar botón back
    history.pushState({patientModal: true, patientId: patientId}, '', '#patient-' + patientId);
    
    // Inicializar tracking de cambios
    initializeChangeTracking();
    
    // Si es paciente activo, establecer fecha de hoy en egreso
    if (!patient.dischargeDate) {
        setTimeout(() => {
            const dischargeDateField = document.getElementById('dischargeDate');
            if (dischargeDateField) {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                dischargeDateField.value = `${year}-${month}-${day}`;
            }
        }, 100);
    }
}

// Guardar observaciones y tareas
async function saveObservationsAndTasks(patientId) {
    const observationsField = document.getElementById('patientObservations');
    const tasksField = document.getElementById('patientPendingTasks');
    
    if (!observationsField && !tasksField) return;
    
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;
    
    try {
        // Guardar observaciones si hay cambios
        if (observationsField && observationsField.value.trim() !== patient.observations) {
            await PacientesAPI.saveObservationsAPI(patientId, observationsField.value.trim());
            patient.observations = observationsField.value.trim();
        }
        
        // Guardar tareas si hay cambios
        if (tasksField && tasksField.value.trim() !== patient.pendingTasks) {
            await PacientesAPI.savePendingTasksAPI(patientId, tasksField.value.trim());
            patient.pendingTasks = tasksField.value.trim();
        }
        
        hasUnsavedChanges = false;
        showToast('Cambios guardados correctamente');
        renderPatients();
        
    } catch (error) {
        console.error('Error guardando cambios:', error);
        showToast('Error al guardar cambios', 'error');
    }
}

// Inicializar tracking de cambios
function initializeChangeTracking() {
    const observationsField = document.getElementById('patientObservations');
    const tasksField = document.getElementById('patientPendingTasks');
    
    const markAsChanged = () => {
        hasUnsavedChanges = true;
    };
    
    if (observationsField) {
        observationsField.addEventListener('input', markAsChanged);
    }
    
    if (tasksField) {
        tasksField.addEventListener('input', markAsChanged);
    }
}

// Cargar historial de observaciones
async function loadObservationHistory(patientId) {
    try {
        const observations = await PacientesAPI.loadObservationHistoryAPI(patientId);
        const historyDiv = document.getElementById('observationHistory');
        
        if (historyDiv && observations.length > 0) {
            const historyHTML = observations.slice(0, 3).map(obs => `
                <div class="history-item">
                    <small>${formatDate(obs.created_at)} - ${obs.observed_by || 'Usuario'}</small>
                    <p>${obs.observation}</p>
                </div>
            `).join('');
            
            historyDiv.innerHTML = `<strong>Historial:</strong>${historyHTML}`;
        }
    } catch (error) {
        console.error('Error cargando historial:', error);
    }
}

// Cargar historial de tareas
async function loadTaskHistory(patientId) {
    try {
        const tasks = await PacientesAPI.loadTaskHistoryAPI(patientId);
        const historyDiv = document.getElementById('taskHistory');
        
        if (historyDiv && tasks.length > 0) {
            const historyHTML = tasks.slice(0, 3).map(task => `
                <div class="history-item">
                    <small>${formatDate(task.created_at)} - ${task.assigned_to || 'Usuario'}</small>
                    <p>${task.task}</p>
                </div>
            `).join('');
            
            historyDiv.innerHTML = `<strong>Historial:</strong>${historyHTML}`;
        }
    } catch (error) {
        console.error('Error cargando tareas:', error);
    }
}

// Exportar a Excel
async function exportActivePatientsToExcel() {
    try {
        showToast('Generando Excel...');
        
        const activePatients = patients.filter(p => p.status === 'active');
        
        // Crear datos para Excel
        const data = activePatients.map(p => ({
            'Nombre': p.name,
            'Edad': p.age,
            'RUT': p.rut || 'Sin RUT',
            'Cama': p.bed || 'Sin asignar',
            'Fecha Ingreso': formatDate(p.admissionDate),
            'Diagnóstico': catalogos.getDiagnosisText(p.diagnosis),
            'Médico': p.admittedBy,
            'Alta Programada': p.scheduledDischarge ? 'Sí' : 'No'
        }));
        
        // Crear libro de Excel
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Pacientes Activos');
        
        // Descargar
        const fileName = `pacientes_activos_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('Excel generado correctamente');
    } catch (error) {
        console.error('Error exportando a Excel:', error);
        showToast('Error al generar Excel', 'error');
    }
}

// Imprimir pacientes activos
async function printActivePatients() {
    const printWindow = window.open('', '_blank');
    const activePatients = patients.filter(p => p.status === 'active');
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pacientes Activos - INTRANEURO</title>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .fecha { text-align: right; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>INTRANEURO - Pacientes Activos</h1>
            <div class="fecha">Fecha: ${new Date().toLocaleDateString('es-CL')}</div>
            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Edad</th>
                        <th>RUT</th>
                        <th>Cama</th>
                        <th>Ingreso</th>
                        <th>Diagnóstico</th>
                        <th>Médico</th>
                    </tr>
                </thead>
                <tbody>
                    ${activePatients.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.age}</td>
                            <td>${p.rut || 'Sin RUT'}</td>
                            <td>${p.bed || 'Sin asignar'}</td>
                            <td>${formatDate(p.admissionDate)}</td>
                            <td>${catalogos.getDiagnosisText(p.diagnosis)}</td>
                            <td>${p.admittedBy}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>window.onload = () => window.print();</script>
        </body>
        </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// Agregar botón de compartir
function addShareButton(patientId, patientName) {
    // Implementación del botón compartir
    const existingButton = document.querySelector('.share-button');
    if (existingButton) {
        existingButton.remove();
    }
    
    const shareButton = document.createElement('button');
    shareButton.className = 'share-button';
    shareButton.innerHTML = '📤 Compartir Ficha';
    shareButton.onclick = () => sharePatient(patientId, patientName);
    
    const modal = document.querySelector('#patientModal .modal-content');
    if (modal) {
        modal.appendChild(shareButton);
    }
}

// Compartir paciente
async function sharePatient(patientId, patientName) {
    const shareUrl = `${window.location.origin}/ficha.html?id=${patientId}`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Ficha de ${patientName}`,
                text: `Ficha médica de ${patientName} - INTRANEURO`,
                url: shareUrl
            });
        } catch (err) {
            console.log('Error compartiendo:', err);
        }
    } else {
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(shareUrl).then(() => {
            showToast('Enlace copiado al portapapeles');
        });
    }
}

// Verificar URL para abrir paciente
function checkURLForPatient() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#patient-')) {
        const patientId = parseInt(hash.replace('#patient-', ''));
        if (patientId) {
            setTimeout(() => {
                openPatientModal(patientId);
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 500);
        }
    }
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

// Interceptar botón back del navegador
window.addEventListener('popstate', (e) => {
    const patientModal = document.getElementById('patientModal');
    
    if (patientModal && patientModal.classList.contains('active')) {
        e.preventDefault();
        
        if (confirm('¿Cerrar información del paciente y volver a la lista?')) {
            closeModal('patientModal');
            history.replaceState(null, '', window.location.pathname);
        } else {
            const currentState = e.state || {};
            history.pushState({
                patientModal: true, 
                patientId: currentState.patientId || currentPatientId
            }, '', '#patient-' + (currentState.patientId || currentPatientId));
        }
    }
});

// Hacer funciones globales disponibles
window.renderPatients = renderPatients;
window.openPatientModal = openPatientModal;
window.saveObservationsAndTasks = saveObservationsAndTasks;
window.exportActivePatientsToExcel = exportActivePatientsToExcel;
window.printActivePatients = printActivePatients;

// Exponer funciones de edición
window.editPatientName = PacientesEdit.editPatientName;
window.editPatientAge = PacientesEdit.editPatientAge;
window.editPatientRut = PacientesEdit.editPatientRut;
window.editPatientBed = PacientesEdit.editPatientBed;
window.editAdmissionDate = PacientesEdit.editAdmissionDate;
window.editDiagnosis = PacientesEdit.editDiagnosis;
window.editDiagnosisDetails = PacientesEdit.editDiagnosisDetails;
window.editAdmittedBy = PacientesEdit.editAdmittedBy;
window.editBed = PacientesEdit.editBed;

// Exponer funciones de alta/egreso
window.toggleScheduledDischarge = PacientesDischarge.toggleScheduledDischarge;
window.processDischarge = PacientesDischarge.processDischarge;
window.setRating = PacientesDischarge.setRating;

// Exponer funciones de historial
window.loadObservationHistory = loadObservationHistory;
window.loadTaskHistory = loadTaskHistory;

// Función para compartir desde la lista
window.sharePatientFromList = function(event, patientId, patientName) {
    event.stopPropagation();
    sharePatient(patientId, patientName);
};