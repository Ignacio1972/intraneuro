// validaciones.js - INTRANEURO Validation Functions

// MODIFICADO: Validate Chilean RUT - Ahora acepta cualquier formato
function validateRut(rut) {
    // Si no hay RUT o está vacío, es válido (no obligatorio)
    if (!rut || rut.trim() === '') {
        return true;
    }
    
    // Acepta cualquier formato con al menos 3 caracteres
    return rut.trim().length >= 3;
}

// MODIFICADO: Format RUT input - Simplificado, solo limpia espacios
function formatRut(rut) {
    // Solo quitar espacios al inicio y final
    return rut ? rut.trim() : '';
}

// MODIFICADO: Auto-format RUT on input - Deshabilitado validación estricta
document.addEventListener('DOMContentLoaded', () => {
    const rutInputs = document.querySelectorAll('input[id*="Rut"]');
    
    rutInputs.forEach(input => {
        // Solo limpiar espacios, no formatear
        input.addEventListener('blur', (e) => {
            if (e.target.value) {
                e.target.value = e.target.value.trim();
            }
            // No mostrar errores de validación
            clearFieldError(e.target);
        });
    });
});

// MODIFICADO: Validate phone number - Ahora más permisivo
function validatePhone(phone) {
    // Acepta cualquier formato con al menos 6 caracteres
    if (!phone || phone.trim() === '') {
        return true; // Teléfono vacío es válido
    }
    return phone.trim().length >= 6;
}

// MODIFICADO: Format phone number - Solo limpia espacios
function formatPhone(phone) {
    return phone ? phone.trim() : '';
}

// Show field error
function showFieldError(field, message) {
    // Remove existing error
    clearFieldError(field);
    
    // Create error element
    const error = document.createElement('span');
    error.className = 'field-error';
    error.textContent = message;
    error.style.cssText = `
        color: var(--danger-color);
        font-size: 0.8rem;
        margin-top: 0.25rem;
        display: block;
    `;
    
    // Insert after field
    field.parentNode.insertBefore(error, field.nextSibling);
}

// Clear field error
function clearFieldError(field) {
    const error = field.parentNode.querySelector('.field-error');
    if (error) {
        error.remove();
    }
    field.style.borderColor = '';
}

// Validate required fields
function validateRequiredFields(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.disabled && !field.value.trim()) {
            showFieldError(field, 'Este campo es obligatorio');
            isValid = false;
        } else {
            clearFieldError(field);
        }
    });
    
    return isValid;
}

// MODIFICADO: Age validation - Más permisivo
function validateAge(age) {
    const numAge = parseInt(age);
    return numAge >= 1 && numAge <= 150; // Aumentado el límite
}

// Date validation
function validateDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return false;
    }
    
    // Check if date is not in the future
    return date <= today;
}

// MODIFICADO: Phone input formatting - Simplificado
document.addEventListener('DOMContentLoaded', () => {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('blur', (e) => {
            if (e.target.value) {
                e.target.value = e.target.value.trim();
            }
        });
    });
});

// MODIFICADO: Form validation on submit - Menos restrictivo
function addFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        // Validate all required fields
        if (!validateRequiredFields(formId)) {
            e.preventDefault();
            return false;
        }
        
        // MODIFICADO: Validaciones específicas más permisivas
        const ageField = form.querySelector('input[type="number"][id*="Age"]');
        if (ageField && ageField.value && !validateAge(ageField.value)) {
            e.preventDefault();
            showFieldError(ageField, 'Edad debe estar entre 1 y 150 años');
            return false;
        }
        
        // Validación de fechas sigue igual (es razonable)
        const dateFields = form.querySelectorAll('input[type="date"]');
        dateFields.forEach(field => {
            if (field.value && !validateDate(field.value)) {
                e.preventDefault();
                showFieldError(field, 'Fecha inválida o futura');
                return false;
            }
        });
    });
}

// Initialize form validations
document.addEventListener('DOMContentLoaded', () => {
    addFormValidation('admissionForm');
    addFormValidation('dischargeForm');
    addFormValidation('loginForm');
});

// Export validation functions for use in other modules
window.validations = {
    validateRut,
    formatRut,
    validatePhone,
    formatPhone,
    validateAge,
    validateDate,
    validateRequiredFields,
    showFieldError,
    clearFieldError
};