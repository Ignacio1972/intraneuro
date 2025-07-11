// validaciones.js - INTRANEURO Validation Functions

// Validate Chilean RUT
function validateRut(rut) {
    // Remove dots and hyphen
    rut = rut.replace(/\./g, '').replace(/-/g, '');
    
    // Check format
    if (!/^\d{7,8}[0-9kK]$/.test(rut)) {
        return false;
    }
    
    // Split number and verifier
    const rutNumber = rut.slice(0, -1);
    const verifier = rut.slice(-1).toUpperCase();
    
    // Calculate verifier digit
    let sum = 0;
    let multiplier = 2;
    
    for (let i = rutNumber.length - 1; i >= 0; i--) {
        sum += parseInt(rutNumber[i]) * multiplier;
        multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const expectedVerifier = 11 - (sum % 11);
    let calculatedVerifier;
    
    if (expectedVerifier === 11) {
        calculatedVerifier = '0';
    } else if (expectedVerifier === 10) {
        calculatedVerifier = 'K';
    } else {
        calculatedVerifier = expectedVerifier.toString();
    }
    
    return verifier === calculatedVerifier;
}

// Format RUT input
function formatRut(rut) {
    // Remove all non-numeric characters except K
    rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    
    if (rut.length < 2) return rut;
    
    // Split into groups
    const verifier = rut.slice(-1);
    const numbers = rut.slice(0, -1);
    
    // Add dots
    let formatted = '';
    for (let i = numbers.length - 1, j = 0; i >= 0; i--, j++) {
        if (j > 0 && j % 3 === 0) {
            formatted = '.' + formatted;
        }
        formatted = numbers[i] + formatted;
    }
    
    return formatted + '-' + verifier;
}

// Auto-format RUT on input
document.addEventListener('DOMContentLoaded', () => {
    const rutInputs = document.querySelectorAll('input[id*="Rut"]');
    
    rutInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const newValue = formatRut(oldValue);
            
            e.target.value = newValue;
            
            // Maintain cursor position
            const diff = newValue.length - oldValue.length;
            e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
        });
        
        input.addEventListener('blur', (e) => {
            if (e.target.value && !e.target.disabled) {
                const isValid = validateRut(e.target.value);
                e.target.style.borderColor = isValid ? '' : 'var(--danger-color)';
                
                if (!isValid && e.target.value.length > 0) {
                    showFieldError(e.target, 'RUT inválido');
                } else {
                    clearFieldError(e.target);
                }
            }
        });
    });
});

// Validate phone number
function validatePhone(phone) {
    // Chilean phone format: +56 9 XXXX XXXX
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 8 && cleanPhone.length <= 12;
}

// Format phone number
function formatPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
        // Mobile number without country code
        return `+56 9 ${cleanPhone.slice(1, 5)} ${cleanPhone.slice(5)}`;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('569')) {
        // Mobile with country code
        return `+56 9 ${cleanPhone.slice(3, 7)} ${cleanPhone.slice(7)}`;
    }
    
    return phone; // Return original if doesn't match patterns
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

// Age validation
function validateAge(age) {
    const numAge = parseInt(age);
    return numAge >= 1 && numAge <= 120;
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

// Phone input formatting
document.addEventListener('DOMContentLoaded', () => {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('blur', (e) => {
            if (e.target.value) {
                e.target.value = formatPhone(e.target.value);
            }
        });
    });
});

// Form validation on submit
function addFormValidation(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        // Validate all required fields
        if (!validateRequiredFields(formId)) {
            e.preventDefault();
            return false;
        }
        
        // Specific validations
        const ageField = form.querySelector('input[type="number"][id*="Age"]');
        if (ageField && !validateAge(ageField.value)) {
            e.preventDefault();
            showFieldError(ageField, 'Edad debe estar entre 1 y 120 años');
            return false;
        }
        
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