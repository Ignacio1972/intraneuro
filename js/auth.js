// auth.js - INTRANEURO Authentication Functions

// Mock users for testing
const users = [
    { username: 'admin', password: 'admin123', name: 'Administrador' },
    { username: 'doctor1', password: 'doctor123', name: 'Dr. María Silva' },
    { username: 'doctor2', password: 'doctor123', name: 'Dr. Carlos Mendoza' },
    { username: 'enfermera', password: 'enfermera123', name: 'Enf. Ana Rodríguez' }
];

// Initialize login form
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const form = e.target;
    
    // Add loading state
    form.classList.add('loading');
    
    // Simulate API call
    setTimeout(() => {
        const user = authenticateUser(username, password);
        
        if (user) {
            // Success
            showLoginMessage('¡Bienvenido!', 'success');
            sessionStorage.setItem('currentUser', user.name);
            currentUser = user.name;
            
            setTimeout(() => {
                form.classList.remove('loading');
                showMainApp();
            }, 1000);
        } else {
            // Error
            form.classList.remove('loading');
            showLoginMessage('Usuario o contraseña incorrectos', 'error');
            
            // Clear password field
            document.getElementById('password').value = '';
        }
    }, 1000);
}

// Authenticate user
function authenticateUser(username, password) {
    return users.find(u => u.username === username && u.password === password);
}

// Validate authorization
function validateAuthorization(name, password) {
    const user = users.find(u => u.name === name && u.password === password);
    return user !== null;
}

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

// Handle logout
function handleLogout() {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
        sessionStorage.removeItem('currentUser');
        currentUser = null;
        
        // Hide main app
        document.getElementById('mainApp').style.display = 'none';
        
        // Show login modal
        document.getElementById('loginModal').classList.add('active');
        
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        
        // Clear any patient data
        patients = [];
    }
}

// Check session
function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (!savedUser) {
        handleLogout();
        return false;
    }
    return true;
}

// Session timeout (30 minutes)
let sessionTimeout;
function resetSessionTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        if (currentUser) {
            alert('Su sesión ha expirado por inactividad');
            handleLogout();
        }
    }, 30 * 60 * 1000); // 30 minutes
}

// Reset timeout on user activity
document.addEventListener('click', resetSessionTimeout);
document.addEventListener('keypress', resetSessionTimeout);

// Initialize session timeout
resetSessionTimeout();