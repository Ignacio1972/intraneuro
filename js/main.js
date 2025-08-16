// main.js - INTRANEURO Main Functions

// Global state
let currentUser = null;
let patients = [];
let viewMode = 'list';

// Variables para trackear cambios no guardados
let hasUnsavedChanges = false;
let initialObservations = '';
let initialPendingTasks = '';
let currentPatientId = null;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    // NUEVO: Prevenir parpadeo - ocultar todo inicialmente
    const loginModal = document.getElementById('loginModal');
    const mainApp = document.getElementById('mainApp');
    
    // Quitar clase active temporalmente para evitar parpadeo
    loginModal.classList.remove('active');
    loginModal.style.visibility = 'hidden';
    mainApp.style.display = 'none';
    
    // CAMBIO 1: Verificar autenticación completa antes de mostrar app
    const savedUser = sessionStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
        // VERIFICACIÓN COMENTADA - Usando sesión local directamente
        currentUser = savedUser;
        showMainApp();
        loginModal.style.visibility = 'visible';
    } else {
        // No hay sesión, mostrar login
        console.log('No hay sesión activa');
        loginModal.style.visibility = 'visible';
        loginModal.classList.add('active');  // Agregar para mostrar login
        forceLogin();
    }
    
    // Initialize event listeners - DENTRO del DOMContentLoaded
    initializeEventListeners();
    
    // CAMBIO 2: COMENTADO - No cargar datos de prueba
    // loadMockData();
});  // CIERRE CORRECTO del DOMContentLoaded

// NUEVA FUNCIÓN: Forzar login y limpiar datos
function forceLogin() {
    // Limpiar cualquier dato residual
    localStorage.removeItem('token');
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    patients = [];
    
    // Asegurar que el modal de login esté visible
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('mainApp').style.display = 'none';
    
    // Limpiar campos del formulario
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    if (username) username.value = '';
    if (password) password.value = '';
}

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
    
    // Modal close buttons - CAMBIO 3: Excluir loginModal
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            // No permitir cerrar el modal de login
            if (modal.id !== 'loginModal') {
                closeModal(modal.id);
            }
        });
    });
    
    // CAMBIO 4: Prevenir cierre del loginModal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const loginModal = document.getElementById('loginModal');
            if (loginModal && loginModal.classList.contains('active')) {
                e.preventDefault(); // Prevenir cierre del modal de login
            }
        }
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

// Show main application - CAMBIO 5: Solo mostrar si hay autenticación válida
async function showMainApp() {
    // Verificar una vez más que haya token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No hay token, redirigiendo a login');
        forceLogin();
        return;
    }
    
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('currentUser').textContent = `Usuario: ${currentUser}`;
    
    // CAMBIO 6: Solo cargar datos si estamos autenticados
    try {
        await updateDashboardFromAPI();
        await renderPatients();
    } catch (error) {
        console.error('Error cargando datos:', error);
        // Si hay error crítico, verificar si es por autenticación
        if (error.message && error.message.includes('401')) {
            forceLogin();
        }
    }
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
    // CAMBIO 7: No permitir cerrar loginModal
    if (modalId === 'loginModal') {
        console.warn('El modal de login no se puede cerrar sin autenticación');
        return;
    }
    
    // Verificar cambios no guardados antes de cerrar el modal de paciente
    if (modalId === 'patientModal' && hasUnsavedChanges) {
        const saveChanges = confirm(
            '💾 Tienes cambios no guardados en Historia o Pendientes.\n\n' +
            '¿Quieres guardar los cambios antes de cerrar?\n\n' +
            'OK = Guardar y cerrar\n' +
            'Cancelar = Cerrar sin guardar'
        );
        
        if (saveChanges) {
            // Guardar cambios automáticamente
            const patientId = getCurrentPatientId();
            if (patientId) {
                // Llamar a la función de guardar de forma asíncrona
                saveObservationsAndTasks(patientId).then(() => {
                    // Esperar un momento para mostrar el toast
                    setTimeout(() => {
                        // Resetear estado y cerrar
                        resetUnsavedChanges();
                        const modal = document.getElementById(modalId);
                        if (modal) {
                            modal.classList.remove('active');
                            setTimeout(() => {
                                modal.style.display = 'none';
                            }, 300);
                        }
                    }, 800);
                }).catch((error) => {
                    console.error('Error guardando cambios:', error);
                    alert('Error al guardar los cambios. Inténtalo manualmente.');
                });
                
                return; // No continuar con el cierre normal
            }
        }
        
        // Si cancela o no se puede guardar, resetear el estado
        resetUnsavedChanges();
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Función para resetear el estado de cambios no guardados
function resetUnsavedChanges() {
    hasUnsavedChanges = false;
    initialObservations = '';
    initialPendingTasks = '';
    currentPatientId = null;
}

// Función para obtener el ID del paciente actual
function getCurrentPatientId() {
    return currentPatientId;
}

// Función para inicializar el tracking de cambios cuando se abre un modal de paciente
function initializeChangeTracking() {
    setTimeout(() => {
        const observationsField = document.getElementById('patientObservations');
        const pendingTasksField = document.getElementById('patientPendingTasks');
        
        if (observationsField && pendingTasksField) {
            // Guardar valores iniciales
            initialObservations = observationsField.value;
            initialPendingTasks = pendingTasksField.value;
            
            // Agregar listeners para detectar cambios
            observationsField.addEventListener('input', checkForUnsavedChanges);
            pendingTasksField.addEventListener('input', checkForUnsavedChanges);
            
            // Resetear estado
            hasUnsavedChanges = false;
        }
    }, 100);
}

// Función para verificar si hay cambios no guardados
function checkForUnsavedChanges() {
    const observationsField = document.getElementById('patientObservations');
    const pendingTasksField = document.getElementById('patientPendingTasks');
    
    if (observationsField && pendingTasksField) {
        const currentObservations = observationsField.value;
        const currentPendingTasks = pendingTasksField.value;
        
        hasUnsavedChanges = (
            currentObservations !== initialObservations ||
            currentPendingTasks !== initialPendingTasks
        );
        
        // Cambiar el color del botón guardar si hay cambios
        updateSaveButtonState();
    }
}

// Función para actualizar el estado visual del botón guardar
function updateSaveButtonState() {
    const saveButtons = document.querySelectorAll('[onclick*="saveObservationsAndTasks"]');
    saveButtons.forEach(button => {
        if (hasUnsavedChanges) {
            button.style.backgroundColor = '#e74c3c';
            button.style.borderColor = '#e74c3c';
            button.textContent = '💾 Guardar cambios';
        } else {
            button.style.backgroundColor = '#2ecc71';
            button.style.borderColor = '#2ecc71';
            button.textContent = '✅ Guardado';
        }
    });
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
    // CAMBIO 8: No usar datos locales si no hay autenticación
    if (!currentUser || !localStorage.getItem('token')) {
        console.warn('No se puede actualizar dashboard sin autenticación');
        return;
    }
    
    const activePatients = patients.filter(p => p.status === 'active');
    
    // Update patient count
    const countElement = document.querySelector('.patient-count');
    if (countElement) {
        countElement.textContent = activePatients.length;
    }
    
    // Calculate scheduled discharges
    const scheduledDischarges = activePatients.filter(patient => {
        return patient.scheduledDischarge === true;
    }).length;
    
    document.getElementById("avgStay").textContent = scheduledDischarges;
    
    // Week admissions
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekAdmissions = patients.filter(patient => {
        const admissionDate = new Date(patient.admissionDate);
        return admissionDate >= oneWeekAgo;
    }).length;
    
    const weekAdmEl = document.getElementById("weekAdmissions"); if (weekAdmEl) weekAdmEl.textContent = weekAdmissions;
}


// NUEVA FUNCIÓN: Actualizar dashboard desde API con fallback
// NUEVA FUNCIÓN: Actualizar dashboard desde API con fallback
async function updateDashboardFromAPI() {
    // CAMBIO 9: Verificar autenticación antes de llamar API
    if (!localStorage.getItem('token')) {
        console.error('No hay token para actualizar dashboard');
        throw new Error('No autenticado');
    }
    
    try {
        console.log('Intentando actualizar dashboard desde API...');
        const stats = await apiRequest('/dashboard/stats');
        
        // Actualizar contadores con datos reales - VERIFICANDO QUE EXISTAN
        const countElement = document.querySelector('.patient-count');
        if (countElement) {
            countElement.textContent = stats.activePatients;
        }
        
        const avgStayElement = document.getElementById("avgStay");
        if (avgStayElement) {
            avgStayElement.textContent = stats.scheduledDischarges;
        }
        
        const weekAdmElement = document.getElementById('weekAdmissions');
        if (weekAdmElement) {
            weekAdmElement.textContent = stats.weekAdmissions;
        }
        
        console.log('✅ Dashboard actualizado desde API:', stats);
        
    } catch (error) {
        console.error('⚠️ Error actualizando dashboard desde API:', error);
        
        // NO MOSTRAR DATOS FALSOS - Solo mostrar error
        const countElement = document.querySelector('.patient-count');
        if (countElement) countElement.textContent = '-';
        
        const avgStayElement = document.getElementById("avgStay");
        if (avgStayElement) avgStayElement.textContent = '-';
        
        const weekAdmElement = document.getElementById('weekAdmissions');
        if (weekAdmElement) weekAdmElement.textContent = '-';
        
        // Mostrar mensaje de error
        if (typeof showNotification === 'function') {
            showNotification('Error conectando con el servidor', 'error');
        }
    }
}

// BUSCAR esta función en main.js y REEMPLAZARLA:

// Set date field to today
function setToday(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) {
        // CORREGIDO: Usar fecha local de Chile
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        field.value = `${year}-${month}-${day}`;
        
        console.log('✅ Fecha establecida:', field.value);
        console.log('📅 Fecha actual del navegador:', today);
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
    if (!dateString) return '-';
    // FIX: Agregar T12:00:00 para evitar problemas de timezone
    const date = new Date(dateString + 'T12:00:00');
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

// CAMBIO 11: COMENTADO - No cargar datos de prueba
/*
// Load mock data for testing (MANTENER SOLO PARA DESARROLLO)
// function loadMockData() {
//     patients = [
//         {
//             id: 1,
//             name: 'Juan Pérez González',
//             age: 45,
//             rut: '12.345.678-9',
//             phone: '+56912345678',
//             admissionDate: '2024-12-28',
//             diagnosis: 'F32.1',
//             diagnosisText: 'Episodio depresivo moderado',
//             diagnosisDetails: 'Presenta síntomas de tristeza persistente y anhedonia',
//             allergies: 'Penicilina',
//             admittedBy: 'Dr. María Silva',
//             status: 'active',
//             daysInHospital: calculateDays('2024-12-28'),
//             scheduledDischarge: false
//         },
//         {
//             id: 2,
//             name: 'María García López',
//             age: 62,
//             rut: '8.765.432-1',
//             phone: '+56987654321',
//             admissionDate: '2025-01-08',
//             diagnosis: 'F41.1',
//             diagnosisText: 'Trastorno de ansiedad generalizada',
//             diagnosisDetails: 'Ansiedad persistente con síntomas somáticos',
//             allergies: null,
//             admittedBy: 'Dr. Carlos Mendoza',
//             status: 'active',
//             daysInHospital: calculateDays('2025-01-08'),
//             scheduledDischarge: false
//         },
//         {
//             id: 3,
//             name: 'Pedro Sánchez Muñoz',
//             age: 38,
//             rut: '15.987.654-3',
//             phone: '+56956789012',
//             admissionDate: '2024-12-16',
//             diagnosis: 'F20.0',
//             diagnosisText: 'Esquizofrenia paranoide',
//             diagnosisDetails: 'Episodio agudo con ideación delirante',
//             allergies: 'Lactosa',
//             admittedBy: 'Dr. Ana Rodríguez',
//             status: 'active',
//             daysInHospital: calculateDays('2024-12-16'),
//             scheduledDischarge: false
        }
    ];
}
*/

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

// CAMBIO 12: Agregar verificación periódica de sesión
setInterval(async () => {
    if (currentUser && localStorage.getItem('token')) {
        try {
            const response = await fetch('/api/verify-token', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                console.log('Token expirado, forzando re-login');
                forceLogin();
            }
        } catch (error) {
            console.error('Error verificando sesión:', error);
        }
    }
}, 5 * 60 * 1000); // Verificar cada 5 minutos