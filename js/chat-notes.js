// Sistema de Notas tipo Chat para Seguimiento de Pacientes
// =========================================================

// Estado global para el chat
var currentChatTab = 'historia';
var chatNotesData = {};

// Inicializar el sistema de chat cuando se abre el modal
function initializeChatNotes(patientId) {
    console.log('Inicializando chat para paciente:', patientId);
    
    // Cargar notas existentes
    loadChatNotes(patientId);
    
    // Establecer tab por defecto
    currentChatTab = 'historia';
    
    // Configurar el estado inicial
    setTimeout(() => {
        const chatMessages = document.getElementById(`chat-messages-${patientId}`);
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 100);
}

// Cargar notas existentes del paciente
async function loadChatNotes(patientId) {
    try {
        // Primero intentar cargar datos frescos del servidor
        if (typeof apiRequest === 'function') {
            try {
                // Obtener observaciones actualizadas
                const obsResponse = await apiRequest(`/patients/${patientId}/admission/observations`);
                // Obtener tareas actualizadas
                const tasksResponse = await apiRequest(`/patients/${patientId}/admission/tasks`);
                
                // Actualizar el paciente local con datos frescos
                const patient = patients.find(p => p.id === patientId);
                if (patient) {
                    // Si la respuesta es un array, tomar el último elemento
                    if (Array.isArray(obsResponse) && obsResponse.length > 0) {
                        patient.observations = obsResponse[obsResponse.length - 1].observation || '';
                    }
                    if (Array.isArray(tasksResponse) && tasksResponse.length > 0) {
                        patient.pendingTasks = tasksResponse[tasksResponse.length - 1].task || '';
                    }
                }
            } catch (apiError) {
                console.log('No se pudieron cargar datos frescos del servidor, usando caché local');
            }
        }
        
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        
        // Siempre recargar desde los datos del paciente (no usar caché de chatNotesData)
        chatNotesData[patientId] = {
            historia: parseExistingNotes(patient.observations || ''),
            pendientes: parseExistingNotes(patient.pendingTasks || '')
        };
        
        // Renderizar las notas
        renderChatMessages(patientId, currentChatTab);
        
    } catch (error) {
        console.error('Error cargando notas:', error);
    }
}

// Parsear notas existentes (texto plano) a formato chat
function parseExistingNotes(text) {
    if (!text || text.trim() === '') return [];
    
    // Si ya es un JSON válido, parsearlo
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed;
    } catch (e) {
        // No es JSON, convertir texto plano
    }
    
    // Convertir texto plano a formato de mensaje
    // Primero intentar dividir por párrafos dobles (bloques de texto)
    const blocks = text.split(/\n\s*\n/).filter(block => block.trim());
    const messages = [];
    
    if (blocks.length > 1) {
        // Si hay múltiples bloques, cada uno es un mensaje separado
        blocks.forEach((block, index) => {
            const lines = block.trim().split('\n');
            const firstLine = lines[0];
            
            // Intentar detectar fecha en la primera línea
            const dateMatch = firstLine.match(/^\[?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(\d{1,2}:\d{2})?\]?/);
            
            if (dateMatch) {
                // Si tiene fecha, usar esa fecha
                const dateStr = dateMatch[1] + (dateMatch[2] ? ' ' + dateMatch[2] : '');
                const textContent = lines.slice(1).join('\n') || firstLine.replace(dateMatch[0], '').trim();
                messages.push({
                    id: Date.now() + Math.random() + index,
                    text: textContent,
                    timestamp: dateStr,
                    author: 'Registro anterior',
                    type: 'received'
                });
            } else {
                // Sin fecha, agregar con fecha de importación
                messages.push({
                    id: Date.now() + Math.random() + index,
                    text: block.trim(),
                    timestamp: new Date(Date.now() - (blocks.length - index) * 86400000).toLocaleString('es-CL'),
                    author: 'Registro anterior',
                    type: 'received'
                });
            }
        });
    } else {
        // Si es un solo bloque, dividir por líneas
        const lines = text.split('\n').filter(line => line.trim());
        
        lines.forEach((line, index) => {
            // Intentar detectar si tiene formato de fecha/hora existente
            const dateMatch = line.match(/^\[?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\s*(\d{1,2}:\d{2})?\]?/);
            
            if (dateMatch) {
                const dateStr = dateMatch[1] + (dateMatch[2] ? ' ' + dateMatch[2] : '');
                const textContent = line.replace(dateMatch[0], '').trim();
                if (textContent) {
                    messages.push({
                        id: Date.now() + Math.random() + index,
                        text: textContent,
                        timestamp: dateStr,
                        author: 'Registro anterior',
                        type: 'received'
                    });
                }
            } else if (line.trim()) {
                // Agregar como mensaje sin formato
                messages.push({
                    id: Date.now() + Math.random() + index,
                    text: line,
                    timestamp: new Date(Date.now() - (lines.length - index) * 3600000).toLocaleString('es-CL'),
                    author: 'Registro anterior',
                    type: 'received'
                });
            }
        });
    }
    
    return messages;
}

// Cambiar entre tabs
function switchChatTab(patientId, tab) {
    currentChatTab = tab;
    
    // Actualizar estado visual de los tabs
    const tabs = document.querySelectorAll('.chat-tab');
    tabs.forEach(t => {
        if (t.textContent.toLowerCase().includes(tab)) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });
    
    // Actualizar placeholder del input
    const input = document.getElementById(`chat-input-${patientId}`);
    if (input) {
        input.placeholder = tab === 'historia' 
            ? 'Escribe una nota sobre la historia clínica...'
            : 'Escribe una tarea pendiente...';
    }
    
    // Renderizar mensajes del tab seleccionado
    renderChatMessages(patientId, tab);
}

// Renderizar mensajes en el chat
function renderChatMessages(patientId, tab) {
    const messagesContainer = document.getElementById(`chat-messages-${patientId}`);
    if (!messagesContainer) return;
    
    const messages = chatNotesData[patientId]?.[tab] || [];
    
    if (messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="chat-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>No hay ${tab === 'historia' ? 'notas en la historia' : 'tareas pendientes'}</p>
                <small>Escribe tu primera nota</small>
            </div>
        `;
        return;
    }
    
    let html = '';
    let lastDate = '';
    
    messages.forEach(msg => {
        // Agregar separador de fecha si es un día diferente
        const msgDate = msg.timestamp.split(' ')[0] || msg.timestamp.split(',')[0];
        if (msgDate !== lastDate) {
            html += `
                <div class="chat-date-divider">
                    <span>${formatDateDivider(msgDate)}</span>
                </div>
            `;
            lastDate = msgDate;
        }
        
        // Agregar mensaje
        const messageClass = msg.type === 'sent' ? 'sent' : '';
        html += `
            <div class="chat-message ${messageClass}" data-message-id="${msg.id}">
                <div class="chat-bubble">
                    <button class="chat-delete-btn" onclick="deleteMessage(${patientId}, '${tab}', ${msg.id})" title="Eliminar mensaje">
                        ✕
                    </button>
                    <p class="chat-message-text">${escapeHtml(msg.text)}</p>
                    <div class="chat-message-time">
                        <span>${msg.author}</span>
                        <span>•</span>
                        <span>${formatTime(msg.timestamp)}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    messagesContainer.innerHTML = html;
    
    // Scroll al final
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 10);
}

// Enviar nueva nota
async function sendChatNote(patientId) {
    const input = document.getElementById(`chat-input-${patientId}`);
    if (!input || !input.value.trim()) return;
    
    const text = input.value.trim();
    const now = new Date();
    
    // Crear nuevo mensaje
    const newMessage = {
        id: Date.now(),
        text: text,
        timestamp: now.toLocaleString('es-CL'),
        author: currentUser || 'Usuario',
        type: 'sent'
    };
    
    // Inicializar estructura si no existe
    if (!chatNotesData[patientId]) {
        chatNotesData[patientId] = {
            historia: [],
            pendientes: []
        };
    }
    
    // Agregar mensaje al array correspondiente
    chatNotesData[patientId][currentChatTab].push(newMessage);
    
    // Limpiar input
    input.value = '';
    autoResizeChatInput(input);
    
    // Renderizar mensajes actualizados
    renderChatMessages(patientId, currentChatTab);
    
    // Guardar en el backend
    await saveChatNotes(patientId);
    
    // Mostrar confirmación
    if (typeof showToast === 'function') {
        showToast('Nota agregada', 'success');
    }
}

// Guardar notas en el backend
async function saveChatNotes(patientId) {
    try {
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;
        
        // Convertir a JSON para guardar
        const historiaJson = JSON.stringify(chatNotesData[patientId]?.historia || []);
        const pendientesJson = JSON.stringify(chatNotesData[patientId]?.pendientes || []);
        
        // Actualizar campos ocultos para compatibilidad
        const obsField = document.getElementById('patientObservations');
        const tasksField = document.getElementById('patientPendingTasks');
        
        if (obsField) obsField.value = historiaJson;
        if (tasksField) tasksField.value = pendientesJson;
        
        // Guardar en el backend usando la función existente
        if (typeof saveObservationsAndTasks === 'function') {
            await saveObservationsAndTasks(patientId);
        } else {
            // Fallback: guardar directamente
            patient.observations = historiaJson;
            patient.pendingTasks = pendientesJson;
            
            // Llamar al API si existe
            if (typeof apiRequest === 'function') {
                // Guardar observaciones
                await apiRequest(`/patients/${patientId}/admission/observations`, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        observations: historiaJson,
                        created_by: currentUser
                    })
                });
                
                // Guardar tareas
                await apiRequest(`/patients/${patientId}/admission/tasks`, {
                    method: 'POST',
                    body: JSON.stringify({ 
                        task: pendientesJson,
                        created_by: currentUser
                    })
                });
            }
        }
        
    } catch (error) {
        console.error('Error guardando notas:', error);
        if (typeof showToast === 'function') {
            showToast('Error al guardar las notas', 'error');
        }
    }
}

// Manejar tecla Enter en el input
function handleChatKeydown(event, patientId) {
    // Enter sin Shift envía el mensaje
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendChatNote(patientId);
    }
}

// Auto-resize del textarea
function autoResizeChatInput(textarea) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = newHeight + 'px';
}

// Formatear fecha para el divisor
function formatDateDivider(dateStr) {
    const today = new Date().toLocaleDateString('es-CL');
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('es-CL');
    
    if (dateStr === today) return 'Hoy';
    if (dateStr === yesterday) return 'Ayer';
    
    return dateStr;
}

// Formatear hora del mensaje
function formatTime(timestamp) {
    if (timestamp.includes(' ')) {
        return timestamp.split(' ')[1];
    }
    if (timestamp.includes(',')) {
        // Formato es-CL típico: "10-09-2025, 4:36:41 p. m."
        const parts = timestamp.split(',');
        if (parts[1]) return parts[1].trim();
    }
    return timestamp;
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    return text.replace(/[&<>"'/]/g, char => map[char]);
}

// Eliminar un mensaje específico
async function deleteMessage(patientId, tab, messageId) {
    // Confirmación antes de eliminar
    if (!confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
        return;
    }
    
    try {
        // Buscar y eliminar el mensaje del array
        if (chatNotesData[patientId] && chatNotesData[patientId][tab]) {
            const index = chatNotesData[patientId][tab].findIndex(msg => msg.id === messageId);
            
            if (index !== -1) {
                // Eliminar el mensaje del array
                chatNotesData[patientId][tab].splice(index, 1);
                
                // Renderizar nuevamente los mensajes
                renderChatMessages(patientId, tab);
                
                // Guardar los cambios en el backend
                await saveChatNotes(patientId);
                
                // Mostrar confirmación
                if (typeof showToast === 'function') {
                    showToast('Nota eliminada', 'success');
                }
            }
        }
    } catch (error) {
        console.error('Error eliminando mensaje:', error);
        if (typeof showToast === 'function') {
            showToast('Error al eliminar la nota', 'error');
        }
    }
}

// Limpiar todas las notas de un tab (función adicional útil)
async function clearAllMessages(patientId, tab) {
    // Confirmación antes de eliminar todo
    const tabName = tab === 'historia' ? 'la historia clínica' : 'las tareas pendientes';
    if (!confirm(`¿Estás seguro de que deseas eliminar TODAS las notas de ${tabName}? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        // Limpiar el array correspondiente
        if (!chatNotesData[patientId]) {
            chatNotesData[patientId] = {};
        }
        chatNotesData[patientId][tab] = [];
        
        // Renderizar nuevamente (mostrará el estado vacío)
        renderChatMessages(patientId, tab);
        
        // Guardar los cambios en el backend
        await saveChatNotes(patientId);
        
        // Mostrar confirmación
        if (typeof showToast === 'function') {
            showToast('Todas las notas han sido eliminadas', 'success');
        }
    } catch (error) {
        console.error('Error limpiando mensajes:', error);
        if (typeof showToast === 'function') {
            showToast('Error al limpiar las notas', 'error');
        }
    }
}

// Asegurar que las funciones estén disponibles globalmente
window.initializeChatNotes = initializeChatNotes;
window.switchChatTab = switchChatTab;
window.sendChatNote = sendChatNote;
window.handleChatKeydown = handleChatKeydown;
window.autoResizeChatInput = autoResizeChatInput;
window.loadChatNotes = loadChatNotes;
window.renderChatMessages = renderChatMessages;
window.deleteMessage = deleteMessage;
window.clearAllMessages = clearAllMessages;

console.log('chat-notes.js cargado correctamente');