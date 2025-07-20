// main.js - INTRANEURO Main Functions

// Global state
let currentUser = null;
let patients = [];
let viewMode = 'list';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        showMainApp();
    }
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Load mock data for testing (remove in production)
    loadMockData();
});

// Initialize all event listeners
function initializeEventListeners() {
    // View toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            if (view) { // Solo si tiene data-view (evita el botón Imágenes)
                switchView(view);
            }
        });
    });
    
    // New admission button
    const newAdmissionBtn = document.getElementById('newAdmissionBtn');
    if (newAdmissionBtn) {
        newAdmissionBtn.addEventListener('click', () => {
            openModal('admissionModal');
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Archive link
    const archiveLink = document.getElementById('archiveLink');
    if (archiveLink) {
        archiveLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'archive.html';
        });
    }
    
    // Allergy radio buttons
    const allergyRadios = document.querySelectorAll('input[name="allergies"]');
    allergyRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            const allergyDetails = document.getElementById('allergyDetails');
            if (e.target.value === 'yes') {
                allergyDetails.style.display = 'block';
                allergyDetails.required = true;
            } else {
                allergyDetails.style.display = 'none';
                allergyDetails.required = false;
                allergyDetails.value = '';
            }
        });
    });
    
    // Diagnosis select
    const diagnosisSelect = document.getElementById('diagnosis');
    if (diagnosisSelect) {
        diagnosisSelect.addEventListener('change', (e) => {
            const detailsField = document.getElementById('diagnosisDetails');
            if (e.target.value === 'other') {
                detailsField.placeholder = 'Especifique el diagnóstico...';
                detailsField.required = true;
            } else {
                detailsField.placeholder = 'Descripción adicional...';
                detailsField.required = false;
            }
        });
    }
}

// Show main application
function showMainApp() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('currentUser').textContent = `Usuario: ${currentUser}`;
    // MODIFICADO: Usar la nueva función con API
    updateDashboardFromAPI();
    renderPatients();
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// View switching
function switchView(view) {
    viewMode = view;
    
    // Update buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Re-render patients
    renderPatients();
}

// Update dashboard (función original mantenida como fallback)
function updateDashboard() {
    const activePatients = patients.filter(p => p.status === 'active');
    
    // Update patient count (RESTAURADO - dinámico)
    const countElement = document.querySelector('.patient-count');
    if (countElement) {
        countElement.textContent = activePatients.length;
    }
    
    // Calculate scheduled discharges (CORREGIDO - busca scheduledDischarge)
    const scheduledDischarges = activePatients.filter(patient => {
        return patient.scheduledDischarge === true;
    }).length;
    
    document.getElementById("avgStay").textContent = scheduledDischarges;
    
    // Week admissions (RESTAURADO - dinámico)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekAdmissions = patients.filter(patient => {
        const admissionDate = new Date(patient.admissionDate);
        return admissionDate >= oneWeekAgo;
    }).length;
    
    document.getElementById('weekAdmissions').textContent = weekAdmissions;
}

// NUEVA FUNCIÓN: Actualizar dashboard desde API con fallback
async function updateDashboardFromAPI() {
    try {
        console.log('Intentando actualizar dashboard desde API...');
        const stats = await apiRequest('/dashboard/stats');
        
        // Actualizar contadores con datos reales
        document.querySelector('.patient-count').textContent = stats.activePatients;
        document.getElementById("avgStay").textContent = stats.scheduledDischarges;
        document.getElementById('weekAdmissions').textContent = stats.weekAdmissions;
        
        console.log('✅ Dashboard actualizado desde API:', stats);
        
    } catch (error) {
        console.error('⚠️ Error actualizando dashboard desde API:', error);
        console.log('Usando fallback con datos locales...');
        // Fallback a función original
        updateDashboard();
    }
}

// Set date field to today
function setToday(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.value = new Date().toISOString().split('T')[0];
    }
}

// Calculate days between dates
function calculateDays(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('es-CL', options);
}

// Get patient initials
function getInitials(name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
}

// Load mock data for testing (MANTENER SOLO PARA DESARROLLO)
function loadMockData() {
    patients = [
        {
            id: 1,
            name: 'Juan Pérez González',
            age: 45,
            rut: '12.345.678-9',
            phone: '+56912345678',
            admissionDate: '2024-12-28',
            diagnosis: 'F32.1',
            diagnosisText: 'Episodio depresivo moderado',
            diagnosisDetails: 'Presenta síntomas de tristeza persistente y anhedonia',
            allergies: 'Penicilina',
            admittedBy: 'Dr. María Silva',
            status: 'active',
            daysInHospital: calculateDays('2024-12-28'),
            scheduledDischarge: false // CORREGIDO: cambié expectedDischargeDate por scheduledDischarge
        },
        {
            id: 2,
            name: 'María García López',
            age: 62,
            rut: '8.765.432-1',
            phone: '+56987654321',
            admissionDate: '2025-01-08',
            diagnosis: 'F41.1',
            diagnosisText: 'Trastorno de ansiedad generalizada',
            diagnosisDetails: 'Ansiedad persistente con síntomas somáticos',
            allergies: null,
            admittedBy: 'Dr. Carlos Mendoza',
            status: 'active',
            daysInHospital: calculateDays('2025-01-08'),
            scheduledDischarge: false // CORREGIDO
        },
        {
            id: 3,
            name: 'Pedro Sánchez Muñoz',
            age: 38,
            rut: '15.987.654-3',
            phone: '+56956789012',
            admissionDate: '2024-12-16',
            diagnosis: 'F20.0',
            diagnosisText: 'Esquizofrenia paranoide',
            diagnosisDetails: 'Episodio agudo con ideación delirante',
            allergies: 'Lactosa',
            admittedBy: 'Dr. Ana Rodríguez',
            status: 'active',
            daysInHospital: calculateDays('2024-12-16'),
            scheduledDischarge: false // CORREGIDO
        }
    ];
}

// Save observations
function saveObservations() {
    const observations = document.getElementById('patientObservations').value;
    // Here would save to database
    alert('Observaciones guardadas correctamente');
}

// Export functions
function exportToExcel() {
    // Implement Excel export
    alert('Exportando a Excel...');
}

function exportToCSV() {
    // Implement CSV export
    alert('Exportando a CSV...');
}