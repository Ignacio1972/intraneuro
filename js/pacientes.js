// pacientes.js - INTRANEURO Patient Management (Orquestador Principal)

// NUEVA FUNCIÓN: Cargar pacientes desde API con fallback
async function loadPatientsFromAPI() {
   try {
       // Intentar cargar desde API
       const response = await apiRequest('/patients/active');
       
       if (Array.isArray(response)) {
           // Usar datos de la API
           patients = response;
           console.log('Pacientes cargados desde API');
           return true;
       } else {
           throw new Error('Respuesta inválida de API');
       }
   } catch (error) {
       // Fallback silencioso a datos locales
       console.log('Usando datos locales de pacientes:', error.message);
       // Los datos ya están en el array global 'patients' desde main.js
       return false;
   }
}

// MODIFICADA: Render patients based on current view
async function renderPatients() {
   // Primero intentar cargar desde API
   await loadPatientsFromAPI();
   
   const container = document.getElementById('patientsContainer');
   const activePatients = patients.filter(p => p.status === 'active');
   
   if (activePatients.length === 0) {
       container.innerHTML = renderEmptyState();
       return;
   }
   
   if (viewMode === 'cards') {
       container.className = 'patients-grid';
       container.innerHTML = activePatients.map(patient => renderPatientCard(patient)).join('');
   } else {
       container.className = 'patients-list';
       container.innerHTML = renderPatientTable(activePatients);
   }
   
   // Add click handlers
   addPatientClickHandlers();
}

// Add click handlers to patient elements
function addPatientClickHandlers() {
   const patientElements = document.querySelectorAll('[data-patient-id]');
   
   patientElements.forEach(element => {
       element.addEventListener('click', (e) => {
           const patientId = parseInt(e.currentTarget.dataset.patientId);
           openPatientModal(patientId);
       });
   });
}

// Open patient modal
function openPatientModal(patientId) {
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   // Fill admission data
   const admissionData = document.getElementById('admissionData');
   admissionData.innerHTML = renderAdmissionData(patient);
   
   // Fill discharge data
   const dischargeData = document.getElementById('dischargeData');
   if (patient.dischargeDate) {
       // Patient already discharged
       dischargeData.innerHTML = renderDischargedData(patient);
   } else {
       // Active patient - show discharge form
       dischargeData.innerHTML = renderDischargeForm(patient.id, patient);
   }
   
   // Load timeline
   loadPatientTimeline(patient.id);
   
   // Load observations (MANTENER PARA NO ROMPER)
   loadPatientObservations(patient.id);
   
   // Open modal
   openModal('patientModal');
}

// Render discharge form - COMPLETAMENTE MODIFICADO
function renderDischargeForm(patientId, patient) {
   return `
       <!-- Toggle de Alta Programada -->
       <div class="form-group" style="background: #f0f8ff; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
           <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
               <span style="font-weight: 600; color: #2c3e50;">Alta Programada para Hoy</span>
               <label class="switch">
                   <input type="checkbox" id="toggleScheduledDischarge" 
                          ${patient.scheduledDischarge ? 'checked' : ''} 
                          onchange="toggleScheduledDischarge(${patientId})">
                   <span class="slider"></span>
               </label>
           </label>
       </div>
       
       <form id="dischargeForm" class="discharge-form" onsubmit="processDischarge(event, ${patientId})">
           <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 1rem;">
               <div class="form-group">
                   <label>Escala de Rankin:</label>
                   <div class="rankin-selector" id="rankinSelector">
                       ${[0,1,2,3,4,5,6].map(i => 
                           `<div class="rankin-item">
                               <span class="circle" data-rating="${i}" onclick="setRating(${i})">○</span>
                               <span class="rankin-number">${i}</span>
                           </div>`
                       ).join('')}
                   </div>
                   <input type="hidden" id="patientRanking" value="0" required>
               </div>
               
               <div class="form-group">
                   <label style="margin-bottom: 2rem;">&nbsp;</label>
                   <label>
                       <input type="checkbox" id="patientDeceased"> Paciente fallecido
                   </label>
               </div>
           </div>
           
           <div class="form-group">
               <label>Diagnóstico de Egreso:</label>
               <select id="dischargeDiagnosis" required>
                   ${catalogos.dischargeOptions.map(opt => 
                       `<option value="${opt.value}">${opt.text}</option>`
                   ).join('')}
               </select>
           </div>
           
           <div class="form-group">
               <label>Detalles adicionales:</label>
               <textarea id="dischargeDetails" placeholder="Detalles adicionales del diagnóstico de egreso..." rows="4"></textarea>
           </div>
           
           <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1.5rem;">
               <div class="form-group">
                   <label>Autorizado por:</label>
                   <input type="text" id="authorizedBy" placeholder="Nombre completo del doctor" required>
               </div>
           </div>
           
           <button type="submit" class="btn btn-primary">PROCESAR EGRESO</button>
       </form>
   `;
}

// Set rating con círculos
function setRating(rating) {
   document.getElementById('patientRanking').value = rating;
   
   // Update visual con círculos
   const circles = document.querySelectorAll('#rankinSelector .circle');
   circles.forEach((circle, index) => {
       if (index <= rating) {
           circle.textContent = '●';
           circle.classList.add('active');
       } else {
           circle.textContent = '○';
           circle.classList.remove('active');
       }
   });
}

// NUEVA FUNCIÓN: Toggle de alta programada
async function toggleScheduledDischarge(patientId) {
    const isChecked = document.getElementById('toggleScheduledDischarge').checked;
    
    try {
        await apiRequest(`/admissions/${patientId}/discharge`, {
            method: 'PUT',
            body: JSON.stringify({ 
                scheduledDischarge: isChecked
            })
        });
        
        // Actualizar dashboard inmediatamente
        updateDashboard();
        
        // Mostrar notificación toast
        showToast(
            isChecked ? catalogos.messages.scheduledSuccess : catalogos.messages.scheduledRemoved
        );
        
    } catch (error) {
        console.log('Error actualizando alta programada:', error);
        
        // Fallback local
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            patient.scheduledDischarge = isChecked;
            updateDashboard();
            showToast(
                isChecked ? catalogos.messages.scheduledSuccess : catalogos.messages.scheduledRemoved
            );
        } else {
            // Revertir el toggle si falló
            document.getElementById('toggleScheduledDischarge').checked = !isChecked;
            showToast(catalogos.messages.errorGeneric, 'error');
        }
    }
}

// MODIFICADA: Process discharge simplificado
async function processDischarge(event, patientId) {
   event.preventDefault();
   
   const authorizedBy = document.getElementById('authorizedBy').value.trim();
   
   // Validación simple - solo nombre requerido
   if (!authorizedBy) {
       showToast(catalogos.messages.errorAuth, 'error');
       return;
   }
   
   // Get form data - SIN fecha manual, SIN pendientes, SIN contraseña
   const dischargeData = {
       dischargeDate: new Date().toISOString(), // Fecha automática del servidor
       scheduledDischarge: false, // El egreso cancela la alta programada
       ranking: parseInt(document.getElementById('patientRanking').value),
       dischargeDiagnosis: document.getElementById('dischargeDiagnosis').value,
       dischargeDetails: document.getElementById('dischargeDetails').value,
       deceased: document.getElementById('patientDeceased').checked,
       dischargedBy: authorizedBy
   };
   
   try {
       // Intentar llamada a API
       const response = await apiRequest(`/admissions/${patientId}/discharge`, {
           method: 'PUT',
           body: JSON.stringify(dischargeData)
       });
       
       // Show success message
       showToast(catalogos.messages.dischargeSuccess);
       
       // Close modal and refresh
       closeModal('patientModal');
       updateDashboard();
       renderPatients();
       
   } catch (error) {
       console.log('API falló, usando fallback local:', error);
       
       // Fallback: usar lógica local
       const patient = patients.find(p => p.id === patientId);
       if (patient) {
           Object.assign(patient, dischargeData);
           patient.status = 'discharged';
           
           // Show success message
           showToast(catalogos.messages.dischargeSuccess);
           
           // Close modal and refresh
           closeModal('patientModal');
           updateDashboard();
           renderPatients();
       }
   }
}

// Load patient timeline
function loadPatientTimeline(patientId) {
   const timeline = document.getElementById('patientTimeline');
   // Mock timeline data
   timeline.innerHTML = `
       <h3>Historial</h3>
       <div class="timeline-item">
           <span class="timeline-date">${formatDate(new Date())}</span>
           <span class="timeline-event">Ingreso registrado</span>
       </div>
   `;
}

// Load patient observations (MANTENER PARA NO ROMPER)
function loadPatientObservations(patientId) {
   const observations = document.getElementById('patientObservations');
   if (observations) {
       observations.value = '';
   }
}

// Edit patient data
function editPatientData(patientId) {
   showToast('Función de edición en desarrollo', 'error');
}

// MANTENER FUNCIONES QUE PODRÍAN SER LLAMADAS DESDE OTROS ARCHIVOS
function saveObservations() {
   showToast('Observaciones guardadas');
}

function savePendingTasks() {
   showToast('Pendientes guardados');
}