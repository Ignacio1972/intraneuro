// data-catalogos.js - INTRANEURO Catálogos y Datos Estáticos

// Mapping de códigos CIE-10 a texto descriptivo
const diagnosisMapping = {
    'F32.1': 'Episodio depresivo moderado',
    'F41.1': 'Trastorno de ansiedad generalizada',
    'F20.0': 'Esquizofrenia paranoide',
    'F31.1': 'Trastorno bipolar, episodio maníaco',
    'F10.2': 'Dependencia del alcohol',
    'F43.1': 'Trastorno de estrés post-traumático',
    'F60.3': 'Trastorno límite de la personalidad',
    'F84.0': 'Autismo infantil',
    'F90.0': 'Trastorno por déficit de atención con hiperactividad',
    'F50.0': 'Anorexia nerviosa'
};

// Descripciones de la Escala de Rankin
const rankinDescriptions = {
    0: 'Sin síntomas',
    1: 'Sin incapacidad significativa',
    2: 'Incapacidad leve',
    3: 'Incapacidad moderada',
    4: 'Incapacidad moderadamente severa',
    5: 'Incapacidad severa',
    6: 'Muerte'
};

// Opciones de diagnóstico de egreso
const dischargeOptions = [
    { value: '', text: 'Seleccione...' },
    { value: 'alta', text: 'Alta médica' },
    { value: 'F32.1', text: 'Episodio depresivo moderado' },
    { value: 'F41.1', text: 'Trastorno de ansiedad generalizada' },
    { value: 'F20.0', text: 'Esquizofrenia paranoide' },
    { value: 'F31.1', text: 'Trastorno bipolar' },
    { value: 'F10.2', text: 'Dependencia del alcohol' },
    { value: 'other', text: 'Otro...' }
];

// Colores para badges y estados
const statusColors = {
    active: '#28a745',
    discharged: '#6c757d',
    scheduled: '#007bff',
    deceased: '#dc3545'
};

// Mensajes del sistema
const systemMessages = {
    dischargeSuccess: 'Egreso procesado correctamente',
    scheduledSuccess: 'Alta programada para hoy',
    scheduledRemoved: 'Alta programada cancelada',
    errorGeneric: 'Error al procesar la solicitud',
    errorAuth: 'Por favor ingrese su nombre completo',
    confirmDischarge: '¿Está seguro de procesar el egreso?'
};

// Función helper para obtener texto del diagnóstico
function getDiagnosisText(code) {
    return diagnosisMapping[code] || code;
}

// Función helper para obtener descripción de Rankin
function getRankinDescription(score) {
    return rankinDescriptions[score] || 'No especificado';
}

// Exportar para uso global
window.catalogos = {
    diagnosis: diagnosisMapping,
    rankin: rankinDescriptions,
    dischargeOptions: dischargeOptions,
    colors: statusColors,
    messages: systemMessages,
    // Funciones helper
    getDiagnosisText,
    getRankinDescription
};