// ARCHIVO: /var/www/intraneuro/js/api.js

const API_CONFIG = {
    baseURL: '/api',
    timeout: 30000,
    
    // Obtener token guardado
    getToken: () => localStorage.getItem('token'),
    
    // Guardar token
    setToken: (token) => localStorage.setItem('token', token),
    
    // Eliminar token
    removeToken: () => localStorage.removeItem('token'),
    
    // Headers por defecto
    getHeaders: () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_CONFIG.getToken()}`
    })
};

// Variable para trackear si la API está disponible
let apiAvailable = true;

// Función helper principal para peticiones
async function apiRequest(endpoint, options = {}) {
    // Si sabemos que la API no está disponible, fallar rápido
    if (!apiAvailable && !options.retry) {
        throw new Error('API no disponible');
    }
    
    try {
        const config = {
            ...options,
            headers: {
                ...API_CONFIG.getHeaders(),
                ...options.headers,
                // AGREGAR HEADERS ANTI-CACHÉ
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        };
        
        // AGREGAR timestamp a las peticiones GET para evitar caché
        let url = `${API_CONFIG.baseURL}${endpoint}`;
        if (!options.method || options.method === 'GET') {
            const separator = endpoint.includes('?') ? '&' : '?';
            url += `${separator}_t=${Date.now()}`;
        }
        
        // Agregar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
        config.signal = controller.signal;
        
        const response = await fetch(url, config); // Usar URL modificada
        clearTimeout(timeoutId);
        
        // Manejar errores HTTP
        if (!response.ok) {
            if (response.status === 401) {
                // Token expirado - limpiar y recargar
                API_CONFIG.removeToken();
                sessionStorage.removeItem('currentUser');
                console.error('TOKEN EXPIRADO - Endpoint:', endpoint);
                console.error('Response:', response);
                window.location.reload();
                return;
            }
            
            const error = new Error(`Error ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
        }
        
        // Marcar API como disponible
        apiAvailable = true;
        
        // Retornar JSON parseado
        return await response.json();
        
    } catch (error) {
        // Si es error de red, marcar API como no disponible
        if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
            apiAvailable = false;
            console.warn('API no disponible, activando modo offline');
        }
        
        console.error('Error en petición API:', error);
        throw error;
    }
}

// Función para verificar si la API está disponible
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_CONFIG.baseURL}/health?_t=${Date.now()}`, { 
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
            apiAvailable = true;
            return true;
        }
        
        apiAvailable = false;
        return false;
    } catch {
        apiAvailable = false;
        return false;
    }
}

// Verificar estado de API al cargar
window.addEventListener('load', () => {
    checkAPIStatus().then(status => {
        console.log(`API ${status ? 'disponible' : 'no disponible'}`);
    });
});

// Intentar reconectar cada 30 segundos si API no está disponible
setInterval(() => {
    if (!apiAvailable) {
        checkAPIStatus();
    }
}, 30000);

// Función helper para obtener datos con fallback
async function apiRequestWithFallback(endpoint, options, fallbackFunction) {
    try {
        return await apiRequest(endpoint, options);
    } catch (error) {
        console.warn(`Error en API ${endpoint}, usando fallback:`, error.message);
        if (fallbackFunction && typeof fallbackFunction === 'function') {
            return fallbackFunction();
        }
        throw error;
    }
}

// Función para forzar recarga sin caché
async function forceRefresh(endpoint, options = {}) {
    // Forzar nueva petición ignorando cualquier caché
    return await apiRequest(endpoint, {
        ...options,
        headers: {
            ...options.headers,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    });
}

// Exportar para debugging en consola
window.API_DEBUG = {
    config: API_CONFIG,
    status: () => apiAvailable,
    checkStatus: checkAPIStatus,
    request: apiRequest,
    forceRefresh: forceRefresh
};

console.log('✅ API Helper cargado correctamente - v2.0 con anti-caché');
