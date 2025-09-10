// archivos.js - Gestión de pacientes archivados
let archivedPatients = [];
let currentFilter = {
    search: '',
    date: null
};
let currentPatientData = null;

// DATOS DE PRUEBA - ELIMINAR CUANDO EL BACKEND ESTÉ LISTO
const mockArchivedPatients = [
    {
        id: 1,
        name: "Juan Pérez García",
        age: 45,
        rut: "12345678-9",
        phone: "+56912345678",
        admissions: [{
            admissionId: 1,
            admissionDate: "2024-01-15",
            dischargeDate: "2024-02-20",
            diagnosis: "F32.1",
            diagnosisText: "Episodio depresivo moderado",
            diagnosisDetails: "Paciente con síntomas depresivos moderados, respondió bien al tratamiento",
            ranking: 2,
            dischargedBy: "Dr. María Silva",
            allergies: "Penicilina"
        }]
    },
    {
        id: 2,
        name: "María González Rojas",
        age: 67,
        rut: "8765432-1",
        phone: "+56987654321",
        admissions: [{
            admissionId: 2,
            admissionDate: "2024-02-01",
            dischargeDate: "2024-03-15",
            diagnosis: "F20.0",
            diagnosisText: "Esquizofrenia paranoide",
            diagnosisDetails: "Estabilización exitosa con antipsicóticos",
            ranking: 3,
            dischargedBy: "Dr. Carlos Mendoza"
        }]
    },
    {
        id: 3,
        name: "Pedro Martínez Silva",
        age: 32,
        rut: "15432789-K",
        phone: "+56954321098",
        admissions: [
            {
                admissionId: 4,
                admissionDate: "2024-03-01",
                dischargeDate: "2024-03-20",
                diagnosis: "F41.1",
                diagnosisText: "Trastorno de ansiedad generalizada",
                diagnosisDetails: "Mejoría significativa con terapia cognitivo-conductual",
                ranking: 1,
                dischargedBy: "Dr. María Silva"
            },
            {
                admissionId: 3,
                admissionDate: "2023-06-15",
                dischargeDate: "2023-07-10",
                diagnosis: "F41.0",
                diagnosisText: "Trastorno de pánico",
                diagnosisDetails: "Primera admisión por crisis de pánico severas",
                ranking: 2,
                dischargedBy: "Dr. Ana Rodríguez"
            }
        ]
    }
];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const currentUser = sessionStorage.getItem('currentUser');
    
    if (!token || !currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Mostrar usuario actual
    document.getElementById('currentUser').textContent = `Usuario: ${currentUser}`;
    
    // Cargar pacientes archivados
    loadArchivedPatients();
    
    // Event listeners
    document.getElementById('searchArchivos').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchArchivos();
    });
});

// Cargar pacientes archivados
async function loadArchivedPatients() {
    try {
        const response = await apiRequest('/patients/archived');
        archivedPatients = response;
        renderArchivedPatients();
    } catch (error) {
        console.error('Error cargando archivos:', error);
        
        // TEMPORAL: Usar datos de prueba si el backend falla
        console.log('Usando datos de prueba...');
        archivedPatients = mockArchivedPatients;
        renderArchivedPatients();
    }
}

// Renderizar lista de archivados
function renderArchivedPatients(patientsToRender = archivedPatients) {
    const container = document.getElementById('archivosContainer');
    
    if (!patientsToRender || patientsToRender.length === 0) {
        container.innerHTML = '<p class="no-data">No se encontraron pacientes archivados</p>';
        return;
    }
    
    // Crear tabla para mejor visualización de datos históricos
    let html = `
        <table class="archived-table">
            <thead>
                <tr>
                    <th onclick="sortArchivedByColumn('name')" style="cursor: pointer; user-select: none;">
                        Nombre <span id="sort-name" style="font-size: 12px;"></span>
                    </th>
                    <th>RUT</th>
                    <th>Edad</th>
                    <th onclick="sortArchivedByColumn('admission')" style="cursor: pointer; user-select: none;">
                        Fecha Ingreso <span id="sort-admission" style="font-size: 12px;"></span>
                    </th>
                    <th onclick="sortArchivedByColumn('discharge')" style="cursor: pointer; user-select: none;">
                        Fecha Alta <span id="sort-discharge" style="font-size: 12px;"></span>
                    </th>
                    <th>Diagnóstico</th>
                    <th onclick="sortArchivedByColumn('days')" style="cursor: pointer; user-select: none;">
                        Días <span id="sort-days" style="font-size: 12px;"></span>
                    </th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Limitar a 25 registros
    const limitedPatients = patientsToRender.slice(0, 25);
    
    limitedPatients.forEach(patient => {
        // Tomar la última admisión (más reciente)
        const lastAdmission = patient.admissions[0];
        const days = calculateDaysBetween(lastAdmission.admissionDate, lastAdmission.dischargeDate);
        
        html += `
            <tr>
                <td>${patient.name}</td>
                <td>${patient.rut || 'Sin RUT'}</td>
                <td>${patient.age}</td>
                <td>${formatDate(lastAdmission.admissionDate)}</td>
                <td>${formatDate(lastAdmission.dischargeDate)}</td>
                <td>${lastAdmission.diagnosisText}</td>
                <td>${days}</td>
                <td>
        <a href="ficha-archivo.html?id=${patient.id}" class="btn btn-small btn-primary">
                        Ver Ficha
        </a>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Buscar en archivos
function searchArchivos() {
    const searchTerm = document.getElementById('searchArchivos').value.toLowerCase();
    const dateFilter = document.getElementById('filterDate').value;
    
    let filtered = archivedPatients;
    
    // Filtrar por búsqueda de texto
    if (searchTerm) {
        filtered = filtered.filter(patient => 
            patient.name.toLowerCase().includes(searchTerm) ||
            (patient.rut && patient.rut.includes(searchTerm))
        );
    }
    
    // Filtrar por fecha
    if (dateFilter) {
        filtered = filtered.filter(patient => {
            const lastAdmission = patient.admissions[0];
            return lastAdmission.dischargeDate === dateFilter;
        });
    }
    
    renderArchivedPatients(filtered);
}

// Ver ficha de paciente archivado
async function viewArchivedPatient(patientId) {
    try {
        const response = await apiRequest(`/patients/${patientId}/history`);
        showArchivedPatientModal(response);
    } catch (error) {
        console.error('Error cargando historial:', error);
        
        // TEMPORAL: Usar datos locales
        const patient = archivedPatients.find(p => p.id === patientId);
        if (patient) {
            showArchivedPatientModal(patient);
        } else {
            alert('Error al cargar la información del paciente');
        }
    }
}

// Mostrar modal con datos del paciente
// Mostrar modal con datos del paciente
function showArchivedPatientModal(patientData) {
    console.log('=== DEBUG showArchivedPatientModal ===');
    console.log('Datos recibidos:', patientData);
    
    if (!patientData) {
        console.error('No se recibieron datos del paciente');
        return;
    }
    
    currentPatientData = patientData;
    
    // Verificar que los elementos existan antes de usarlos
    const elements = {
        modalPatientName: document.getElementById('modalPatientName'),
        modalName: document.getElementById('modalName'),
        modalRut: document.getElementById('modalRut'),
        modalAge: document.getElementById('modalAge'),
        modalPhone: document.getElementById('modalPhone')
    };
    
    console.log('Elementos encontrados:', elements);
    
    // Llenar datos personales solo si los elementos existen
    if (elements.modalPatientName) elements.modalPatientName.textContent = patientData.name;
    if (elements.modalName) elements.modalName.textContent = patientData.name;
    if (elements.modalRut) elements.modalRut.textContent = patientData.rut || 'Sin RUT';
    if (elements.modalAge) elements.modalAge.textContent = patientData.age + ' años';
    
    // Mostrar historial de admisiones
    if (patientData.admissions) {
        console.log('Admisiones:', patientData.admissions);
        renderAdmissionsHistory(patientData.admissions);
    }
    
    // Resetear tabs
    showTab('datos');
    
    // Resetear botones del footer
    const footer = document.querySelector('.modal-footer');
    if (footer) {
        footer.innerHTML = `
            <button onclick="editPatientData()" class="btn btn-secondary">Editar Datos</button>
            <button onclick="closeArchivedModal()" class="btn btn-secondary">Cerrar</button>
        `;
    }
    
    // Mostrar modal
    const modal = document.getElementById('archivedPatientModal');
    if (modal) {
        modal.classList.add('active');
        console.log('Modal activado');
    } else {
        console.error('No se encontró el modal');
    }
}
// Renderizar historial de admisiones
function renderAdmissionsHistory(admissions) {
    const container = document.getElementById('admissionsHistory');
    
    if (!admissions || admissions.length === 0) {
        container.innerHTML = '<p>No hay admisiones registradas</p>';
        return;
    }
    
    let html = '<div class="admissions-timeline">';
    
    admissions.forEach((admission, index) => {
        const days = calculateDaysBetween(admission.admissionDate, admission.dischargeDate);
        
        html += `
            <div class="admission-card">
                <div class="admission-header">
                    <h4>Admisión #${admissions.length - index}</h4>
                    <span class="admission-dates">${formatDate(admission.admissionDate)} - ${formatDate(admission.dischargeDate)}</span>
                </div>
                <div class="admission-body">
                    <p><strong>Diagnóstico:</strong> ${admission.diagnosisText} (${admission.diagnosis})</p>
                    <p><strong>Detalles:</strong> ${admission.diagnosisDetails || 'Sin detalles'}</p>
                    <p><strong>Días hospitalizado:</strong> ${days}</p>
                    <p><strong>Escala Rankin al alta:</strong> ${admission.ranking || 'No especificado'}</p>
                    <p><strong>Dado de alta por:</strong> ${admission.dischargedBy}</p>
                    ${admission.allergies ? `<p><strong>Alergias:</strong> ${admission.allergies}</p>` : ''}
                </div>
                <div class="admission-footer">
                    <button onclick="loadObservations(${admission.admissionId})" class="btn btn-small btn-primary">
                        Ver Observaciones
                    </button>
                    
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Cargar observaciones de una admisión específica
async function loadObservations(admissionId) {
    try {
        // Cambiar a tab de observaciones
        showTab('observaciones');
        
        const container = document.getElementById('observationsHistory');
        container.innerHTML = '<p>Cargando observaciones...</p>';
        
        // Llamar al endpoint
        const response = await apiRequest(`/patients/admission/${admissionId}/observations`);
        
        if (!response || response.length === 0) {
            container.innerHTML = '<p>No hay observaciones para esta admisión</p>';
            return;
        }
        
        let html = '<div class="observations-list">';
        response.forEach(obs => {
            html += `
                <div class="observation-item">
                    <div class="observation-header">
                        <span class="observation-date">${formatDateTime(obs.created_at)}</span>
                        <span class="observation-author">${obs.created_by}</span>
                    </div>
                    <div class="observation-text">${obs.observation}</div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando observaciones:', error);
        
        // TEMPORAL: Mostrar mensaje sin observaciones
        document.getElementById('observationsHistory').innerHTML = 
            '<p>No hay observaciones disponibles para esta admisión</p>';
    }
}

// Cambiar entre tabs
function showTab(tabName) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar tab seleccionado
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // Marcar el botón activo si fue clickeado
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Si no hay evento (llamada programática), marcar el botón correcto
        document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    }
}

// Cerrar modal
function closeArchivedModal() {
    document.getElementById('archivedPatientModal').classList.remove('active');
    currentPatientData = null;
}

// Editar datos del paciente
function editPatientData() {
    // Habilitar campos para edición
    const modal = document.getElementById('archivedPatientModal');
    
    // Cambiar spans por inputs
    document.getElementById('modalName').innerHTML = 
        `<input type="text" id="editName" value="${currentPatientData.name}" class="form-control">`;
    
    document.getElementById('modalRut').innerHTML = 
        `<input type="text" id="editRut" value="${currentPatientData.rut || ''}" class="form-control">`;
    
    document.getElementById('modalAge').innerHTML = 
        `<input type="number" id="editAge" value="${currentPatientData.age}" class="form-control" min="1" max="150">`;
    
    document.getElementById('modalPhone').innerHTML = 
        `<input type="text" id="editPhone" value="${currentPatientData.phone || ''}" class="form-control">`;
    
    // Cambiar botones del footer
    const footer = modal.querySelector('.modal-footer');
    footer.innerHTML = `
        <button onclick="savePatientData()" class="btn btn-success">Guardar Cambios</button>
        <button onclick="cancelEdit()" class="btn btn-secondary">Cancelar</button>
    `;
}

// Guardar cambios del paciente
async function savePatientData() {
    const updatedData = {
        name: document.getElementById('editName').value,
        rut: document.getElementById('editRut').value,
        age: parseInt(document.getElementById('editAge').value),
        phone: document.getElementById('editPhone').value
    };
    
    try {
        await apiRequest(`/patients/${currentPatientData.id}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });
        
        // Actualizar datos locales
        currentPatientData = { ...currentPatientData, ...updatedData };
        
        // Actualizar en la lista
        const patientIndex = archivedPatients.findIndex(p => p.id === currentPatientData.id);
        if (patientIndex !== -1) {
            archivedPatients[patientIndex] = { ...archivedPatients[patientIndex], ...updatedData };
        }
        
        // Mostrar mensaje de éxito
        alert('Datos actualizados correctamente');
        
        // Volver a mostrar en modo lectura
        showArchivedPatientModal(currentPatientData);
        
        // Actualizar la tabla
        renderArchivedPatients();
        
    } catch (error) {
        console.error('Error actualizando paciente:', error);
        alert('Error al actualizar los datos');
    }
}

// Cancelar edición
function cancelEdit() {
    // Volver a mostrar en modo lectura
    showArchivedPatientModal(currentPatientData);
}

// Exportar a Excel (placeholder)
function exportToExcel() {
    // Verificar que hay datos
    if (!archivedPatients || archivedPatients.length === 0) {
        showToast('No hay datos para exportar', 'warning');
        return;
    }
    
    try {
        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        
        // Preparar datos para Excel
        const excelData = [
            // Encabezados
            ['LISTADO DE PACIENTES ARCHIVADOS - INTRANEURO'],
            ['Fecha de generación:', new Date().toLocaleString('es-CL')],
            [''], // Línea vacía
            ['Nombre', 'RUT', 'Edad', 'Fecha Ingreso', 'Fecha Egreso', 'Días Hospitalizado', 'Diagnóstico Ingreso', 'Diagnóstico Egreso', 'Ranking', 'Médico de Alta']
        ];
        
        // Agregar datos de cada paciente
        archivedPatients.forEach(patient => {
            // Obtener última admisión
            const lastAdmission = patient.admissions && patient.admissions.length > 0 
                ? patient.admissions[patient.admissions.length - 1] 
                : {};
            
            const days = lastAdmission.admissionDate && lastAdmission.dischargeDate
                ? calculateDaysBetween(lastAdmission.admissionDate, lastAdmission.dischargeDate)
                : 0;
            
            excelData.push([
                patient.name || '-',
                patient.rut || 'Sin RUT',
                patient.age || '-',
                formatDate(lastAdmission.admissionDate) || '-',
                formatDate(lastAdmission.dischargeDate) || '-',
                days,
                `${lastAdmission.diagnosis || ''} - ${lastAdmission.diagnosisText || ''}`,
                lastAdmission.dischargeDiagnosis || '-',
                lastAdmission.ranking !== undefined ? `${lastAdmission.ranking} - ${getRankinDescription(lastAdmission.ranking)}` : '-',
                lastAdmission.dischargedBy || '-'
            ]);
        });
        
        // Agregar resumen al final
        excelData.push([]);
        excelData.push(['RESUMEN']);
        excelData.push(['Total de pacientes archivados:', archivedPatients.length]);
        
        // Crear hoja
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Ajustar anchos de columna
        ws['!cols'] = [
            { wch: 30 }, // Nombre
            { wch: 15 }, // RUT
            { wch: 8 },  // Edad
            { wch: 15 }, // Teléfono
            { wch: 15 }, // F. Ingreso
            { wch: 15 }, // F. Egreso
            { wch: 10 }, // Días
            { wch: 40 }, // Diagnóstico Ingreso
            { wch: 40 }, // Diagnóstico Egreso
            { wch: 25 }, // Ranking
            { wch: 25 }  // Médico
        ];
        
        // Combinar celdas para el título
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },  // Título principal
            { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }   // Fecha
        ];
        
        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(wb, ws, 'Pacientes Archivados');
        
        // Generar archivo
        const fileName = `pacientes_archivados_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('Excel exportado correctamente', 'success');
        
    } catch (error) {
        console.error('Error exportando Excel:', error);
        showToast('Error al exportar Excel', 'error');
    }
}

// Función auxiliar para calcular días (agregar si no existe)
function calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
}

// Función auxiliar para descripción Rankin (agregar si no existe)
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

// Funciones auxiliares
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL');
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('es-CL');
}

function calculateDaysBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Variables para controlar el ordenamiento
let currentArchiveSortColumn = null;
let archiveSortDirection = 'asc';

// Función para ordenar columnas en archivos
function sortArchivedByColumn(column) {
    // Si es la misma columna, cambiar dirección
    if (currentArchiveSortColumn === column) {
        archiveSortDirection = archiveSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentArchiveSortColumn = column;
        archiveSortDirection = 'asc';
    }
    
    // Obtener el contenedor y guardar posición del scroll
    const container = document.getElementById('archivosContainer');
    const currentTable = container.querySelector('.archived-table');
    let scrollLeft = 0;
    let scrollTop = container.scrollTop;
    
    if (currentTable) {
        scrollLeft = currentTable.scrollLeft;
    }
    
    // Ordenar los pacientes archivados
    const sortedPatients = [...archivedPatients].sort((a, b) => {
        let valueA, valueB;
        
        // Usar la última admisión de cada paciente
        const admissionA = a.admissions[0];
        const admissionB = b.admissions[0];
        
        switch(column) {
            case 'name':
                valueA = a.name.toLowerCase();
                valueB = b.name.toLowerCase();
                break;
            case 'admission':
                valueA = new Date(admissionA.admissionDate);
                valueB = new Date(admissionB.admissionDate);
                break;
            case 'discharge':
                valueA = new Date(admissionA.dischargeDate);
                valueB = new Date(admissionB.dischargeDate);
                break;
            case 'days':
                valueA = calculateDaysBetween(admissionA.admissionDate, admissionA.dischargeDate);
                valueB = calculateDaysBetween(admissionB.admissionDate, admissionB.dischargeDate);
                break;
            default:
                return 0;
        }
        
        // Comparar valores
        if (valueA < valueB) return archiveSortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return archiveSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Re-renderizar con los datos ordenados
    renderArchivedPatients(sortedPatients);
    
    // Restaurar la posición del scroll
    const newTable = container.querySelector('.archived-table');
    if (newTable) {
        newTable.scrollLeft = scrollLeft;
    }
    container.scrollTop = scrollTop;
    
    // Actualizar indicadores visuales
    updateArchiveSortIndicators(column);
}

// Función para actualizar indicadores de ordenamiento
function updateArchiveSortIndicators(column) {
    // Limpiar todos los indicadores
    ['name', 'admission', 'discharge', 'days'].forEach(col => {
        const indicator = document.getElementById(`sort-${col}`);
        if (indicator) {
            indicator.textContent = '';
        }
    });
    
    // Agregar indicador a la columna actual
    const currentIndicator = document.getElementById(`sort-${column}`);
    if (currentIndicator) {
        currentIndicator.textContent = archiveSortDirection === 'asc' ? '▲' : '▼';
    }
}