// auth.js - INTRANEURO Authentication Functions

// CAMBIO 1: Usuarios de prueba comentados por seguridad
// DATOS DE PRUEBA - DESACTIVADOS POR SEGURIDAD
// Solo descomentar en ambiente de desarrollo sin conexión a API
/*
const users = [
    { username: 'admin', password: 'admin123', name: 'Administrador' },
    { username: 'doctor1', password: 'doctor123', name: 'Dr. Intraneuro' },
    { username: 'doctor2', password: 'doctor123', name: 'Dr. Carlos Mendoza' },
    { username: 'enfermera', password: 'enfermera123', name: 'Enf. Ana Rodríguez' }
];
*/

// Initialize login form
document.addEventListener('DOMContentLoaded', () => {
    // CAMBIO 2: Verificar estado de autenticación al cargar
    verifyAuthenticationStatus();
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // CAMBIO 3: Prevenir cierre del modal de login
    preventLoginModalClose();
});

// NUEVA FUNCIÓN: Verificar estado de autenticación
async function verifyAuthenticationStatus() {
    const token = localStorage.getItem('token');
    const savedUser = sessionStorage.getItem('currentUser');
    
    if (!token || !savedUser) {
        return false; // No hay sesión
    }
    
    try {
        // Usar apiRequest que ya tiene la URL correcta
        const response = await apiRequest('/verify-token');
        
        if (response && response.valid) {
            console.log('✅ Sesión válida restaurada');
            currentUser = savedUser; // Restaurar variable global
            return true;
        }
    } catch (error) {
        // Si es 404 o error de red, NO limpiar automáticamente
        if (error.message && error.message.includes('404')) {
            console.warn('Endpoint verify-token no disponible, manteniendo sesión local');
            currentUser = savedUser; // Mantener sesión local
            return true; // Confiar en el token local
        }
    }
    
    // Solo limpiar si el token es realmente inválido (401)
    console.log('Token inválido, limpiando sesión');
    clearAuthData();
    return false;
}
// NUEVA FUNCIÓN: Prevenir cierre del modal de login
function preventLoginModalClose() {
    const loginModal = document.getElementById('loginModal');
    if (!loginModal) return;
    
    // Prevenir click fuera del modal
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            e.stopPropagation();
            console.log('Sistema de uso exclusivo para personal autorizado');
        }
    });
    
    // Prevenir ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && loginModal.classList.contains('active')) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

// Handle login - MEJORADO - SOLO CLAVE
async function handleLogin(e) {
    e.preventDefault();
    
    // Siempre usar 'sistema' como usuario
    const username = 'sistema';
    const password = document.getElementById('password').value;
    const form = e.target;
    
    // Preservar parámetros de URL (como ?paciente=123)
    const urlParams = new URLSearchParams(window.location.search);
    const patientId = urlParams.get('paciente');
    
    // Add loading state
    form.classList.add('loading');
    
    try {
        // Usar API
        const response = await apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (response.token) {
            // Guardar token
            API_CONFIG.setToken(response.token);
            
            // Guardar usuario
            sessionStorage.setItem('currentUser', response.user.full_name);
            currentUser = response.user.full_name;
            
            showLoginMessage('¡Bienvenido!', 'success');
            
            // Si hay un paciente en la URL, guardarlo temporalmente
            if (patientId) {
                sessionStorage.setItem('pendingPatientId', patientId);
            }
            
            setTimeout(() => {
                form.classList.remove('loading');
                // showMainApp está en main.js que se carga después
                if (typeof showMainApp === 'function') {
                    showMainApp();
                } else {
                    // Fallback: mostrar app manualmente
                    const loginSection = document.getElementById('loginSection');
                    const mainApp = document.getElementById('mainApp');
                    if (loginSection) loginSection.style.display = 'none';
                    if (mainApp) mainApp.style.display = 'block';
                    if (typeof renderPatients === 'function') {
                        renderPatients();
                    }
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Error en login:', error);
        form.classList.remove('loading');
        
        // CAMBIO 4: NO usar fallback con usuarios locales
        // Mostrar error de conexión en lugar de intentar login local
        if (error.message && error.message.includes('Failed to fetch')) {
            showLoginMessage('Sistema temporalmente no disponible. Por favor intente más tarde.', 'error');
        } else {
            showLoginMessage('Clave de acceso incorrecta', 'error');
        }
        
        document.getElementById('password').value = '';
    }
}

// CAMBIO 5: Función de autenticación local DESACTIVADA
/*
function authenticateUser(username, password) {
    return users.find(u => u.username === username && u.password === password);
}
*/

// CAMBIO 6: Función de validación DESACTIVADA
/*
function validateAuthorization(name, password) {
    const user = users.find(u => u.name === name && u.password === password);
    return user !== null;
}
*/

// Show login message
function showLoginMessage(message, type) {
    // Remove existing messages
    const existingMsg = document.querySelector('.login-error, .login-success');
    if (existingMsg) {
        existingMsg.remove();
    }
    
    // Create new message
    const msgDiv = document.createElement('div');
    msgDiv.className = type === 'error' ? 'login-error' : 'login-success';
    msgDiv.textContent = message;
    
    // Insert after form
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(msgDiv, form.nextSibling);
    
    // Remove after 3 seconds
    setTimeout(() => {
        msgDiv.remove();
    }, 3000);
}

// NUEVA FUNCIÓN: Limpiar todos los datos de autenticación
function clearAuthData() {
    // Limpiar localStorage
    localStorage.removeItem('token');
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar variables globales
    if (typeof currentUser !== 'undefined') {
        currentUser = null;
    }
    if (typeof patients !== 'undefined') {
        patients = [];
    }
    
    // Limpiar cualquier dato en memoria
    if (typeof API_CONFIG !== 'undefined' && API_CONFIG.removeToken) {
        API_CONFIG.removeToken();
    }
}

// Handle logout - MEJORADO
function handleLogout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        // CAMBIO 7: Limpieza completa
        clearAuthData();
        
        // Forzar recarga completa de la página para limpiar todo
        window.location.reload(true);
    }
}

// Check session - MEJORADO
async function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (!savedUser || !token) {
        clearAuthData();
        return false;
    }
    
    // CAMBIO 8: Verificar token con API
    try {
        const response = await fetch('/api/verify-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            clearAuthData();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        clearAuthData();
        return false;
    }
}

// Session timeout (30 minutes)
let sessionTimeout;
function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        if (currentUser) {
            alert('Su sesión ha expirado por inactividad');
            clearAuthData();
            window.location.reload(true);
        }
    }, 30 * 60 * 1000); // 30 minutes
}

// Reset timeout on user activity
document.addEventListener('click', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);

// Initialize session timeout
resetSessionTimeout();



// CAMBIO 10: Interceptar intentos de navegación sin autenticación
window.addEventListener('popstate', async (e) => {
    const hasValidSession = await checkSession();
    if (!hasValidSession) {
        e.preventDefault();
        window.location.reload(true);
    }
});