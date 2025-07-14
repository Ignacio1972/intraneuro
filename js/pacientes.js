// pacientes.js - INTRANEURO Patient Management

// Mapping de códigos F a texto descriptivo
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

// Función para obtener texto del diagnóstico
function getDiagnosisText(code) {
   return diagnosisMapping[code] || code;
}

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

// Render patient card
function renderPatientCard(patient) {
   const initials = getInitials(patient.name);
   const days = patient.daysInHospital;
   const diagnosisText = getDiagnosisText(patient.diagnosis);
   
   return `
       <div class="patient-card" data-patient-id="${patient.id}">
           <div class="patient-header">
               <div class="patient-avatar">${initials}</div>
               <div class="patient-basic-info">
                   <div class="patient-name">${patient.name}</div>
                   <div class="patient-age">${patient.age} años</div>
               </div>
           </div>
           <div class="stay-duration">
               <span class="days">${days}</span> días
           </div>
           <div class="diagnosis-code">${diagnosisText}</div>
           <div class="tooltip">${patient.diagnosisText}</div>
       </div>
   `;
}

// Render patient table (CORREGIDO - parámetro renombrado)
function renderPatientTable(activePatients) {
   return `
       <table class="patients-table">
           <thead>
               <tr>
                   <th>Nombre</th>
                   <th>Edad</th>
                   <th>Días</th>
                   <th>Diagnóstico</th>
                   <th>Ingresado</th>
               </tr>
           </thead>
           <tbody>
               ${activePatients.map(patient => `
                   <tr data-patient-id="${patient.id}">
                       <td>${patient.name}</td>
                       <td>${patient.age} años</td>
                       <td>${patient.daysInHospital}</td>
                       <td>${getDiagnosisText(patient.diagnosis)}</td>
                       <td>${formatDate(patient.admissionDate)}</td>
                   </tr>
               `).join('')}
           </tbody>
       </table>
   `;
}

// Render empty state
function renderEmptyState() {
   return `
       <div class="empty-state">
           <div class="empty-state-icon">🏥</div>
           <h3>No hay pacientes activos</h3>
           <p>Haga clic en "Nuevo Ingreso" para registrar un paciente</p>
       </div>
   `;
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
   
   // Fill admission data con layout eficiente y bien formateado
   const admissionData = document.getElementById('admissionData');
   const diagnosisText = getDiagnosisText(patient.diagnosis);
   
   admissionData.innerHTML = `
       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1rem;">
           <div class="grid-info-row">
               <div class="patient-info-row">
                   <span class="info-label">Nombre:</span>
                   <span class="info-value">${patient.name}</span>
               </div>
           </div>
           <div class="grid-info-row">
               <div class="patient-info-row">
                   <span class="info-label">Edad:</span>
                   <span class="info-value">${patient.age} años</span>
               </div>
           </div>
       </div>
       <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1rem;">
           <div class="grid-info-row">
               <div class="patient-info-row">
                   <span class="info-label">Teléfono:</span>
                   <span class="info-value">${patient.phone || 'No registrado'}</span>
               </div>
           </div>
           <div class="grid-info-row">
               <div class="patient-info-row">
                   <span class="info-label">RUT:</span>
                   <span class="info-value">${patient.rut || 'Sin RUT'}</span>
               </div>
           </div>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Fecha Ingreso:</span>
           <span class="info-value">${formatDate(patient.admissionDate)}</span>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Diagnóstico:</span>
           <span class="info-value">${diagnosisText}</span>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Descripción:</span>
           <span class="info-value">${patient.diagnosisDetails || 'presenta intenso dolor de cabeza'}</span>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Alergias:</span>
           <span class="info-value">${patient.allergies || 'No presenta'}</span>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Ingresado por:</span>
           <span class="info-value">${patient.admittedBy}</span>
       </div>
   `;
   
   // Fill discharge data
   const dischargeData = document.getElementById('dischargeData');
   if (patient.dischargeDate) {
       // Patient already discharged
       dischargeData.innerHTML = renderDischargedData(patient);
   } else {
       // Active patient - show discharge form
       dischargeData.innerHTML = renderDischargeForm(patient.id);
   }
   
   // Load timeline
   loadPatientTimeline(patient.id);
   
   // Load observations (MANTENER PARA NO ROMPER)
   loadPatientObservations(patient.id);
   
   // Open modal
   openModal('patientModal');
}

// Render discharge form con mejoras de layout
function renderDischargeForm(patientId) {
   return `
       <form id="dischargeForm" class="discharge-form" onsubmit="processDischarge(event, ${patientId})">
           <div class="form-group">
               <label>Fecha de Egreso:</label>
               <div class="date-input-group">
                   <input type="date" id="dischargeDate" required>
                   <button type="button" class="btn-today" onclick="setToday('dischargeDate')">HOY</button>
               </div>
           </div>
           
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
                   <option value="">Seleccione...</option>
                   <option value="alta">Alta médica</option>
                   <option value="F32.1">Episodio depresivo moderado</option>
                   <option value="F41.1">Trastorno de ansiedad generalizada</option>
                   <option value="F20.0">Esquizofrenia paranoide</option>
                   <option value="F31.1">Trastorno bipolar</option>
                   <option value="F10.2">Dependencia del alcohol</option>
                   <option value="other">Otro...</option>
               </select>
           </div>
           
           <div class="form-group">
               <label>Detalles adicionales:</label>
               <textarea id="dischargeDetails" placeholder="Detalles adicionales del diagnóstico de egreso..." rows="4"></textarea>
           </div>
           
           <div class="form-group">
               <label>Pendientes:</label>
               <textarea id="dischargePendingTasks" placeholder="Tareas o procedimientos pendientes para el egreso..." rows="3"></textarea>
           </div>
           
           <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1.5rem;">
               <div class="form-group">
                   <label>Autorizado por:</label>
                   <input type="text" id="authorizedBy" required>
               </div>
               <div class="form-group">
                   <label>Contraseña:</label>
                   <input type="password" id="dischargePassword" required>
               </div>
           </div>
           
           <button type="submit" class="btn btn-primary">PROCESAR EGRESO</button>
       </form>
   `;
}

// Render discharged data
function renderDischargedData(patient) {
   const circles = Array.from({length: 7}, (_, i) => 
       i <= patient.ranking ? '●' : '○'
   ).join(' ');
   
   return `
       <div class="patient-info-row">
           <span class="info-label">Fecha Egreso:</span>
           <span class="info-value">${formatDate(patient.dischargeDate)}</span>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Escala de Rankin:</span>
           <span class="info-value">${circles} (${patient.ranking})</span>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Diagnóstico Egreso:</span>
           <span class="info-value">${patient.dischargeDiagnosis}</span>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Autorizado por:</span>
           <span class="info-value">${patient.dischargedBy}</span>
       </div>
       <div class="patient-info-row">
           <span class="info-label">Estado:</span>
           <span class="info-value">${patient.deceased ? '✝️ Fallecido' : 'Egresado'}</span>
       </div>
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

// MODIFICADA: Process discharge para usar API
async function processDischarge(event, patientId) {
   event.preventDefault();
   
   const authorizedBy = document.getElementById('authorizedBy').value;
   const password = document.getElementById('dischargePassword').value;
   
   // Validate authorization
   if (!validateAuthorization(authorizedBy, password)) {
       alert('Contraseña incorrecta para el usuario especificado');
       return;
   }
   
   // Get form data
   const dischargeData = {
       dischargeDate: document.getElementById('dischargeDate').value,
       ranking: parseInt(document.getElementById('patientRanking').value),
       dischargeDiagnosis: document.getElementById('dischargeDiagnosis').value,
       dischargeDetails: document.getElementById('dischargeDetails').value,
       dischargePendingTasks: document.getElementById('dischargePendingTasks').value,
       deceased: document.getElementById('patientDeceased').checked,
       dischargedBy: authorizedBy
   };
   
   try {
       // TODO: Implementar llamada a API cuando esté el endpoint
       // const response = await apiRequest(`/admissions/${patientId}/discharge`, {
       //     method: 'PUT',
       //     body: JSON.stringify(dischargeData)
       // });
       
       // Por ahora, usar lógica local
       const patient = patients.find(p => p.id === patientId);
       if (patient) {
           Object.assign(patient, dischargeData);
           patient.status = 'discharged';
           
           // Show success message
           alert('Egreso procesado correctamente');
           
           // Close modal and refresh
           closeModal('patientModal');
           updateDashboard(); // CRÍTICO: Actualizar dashboard después del egreso
           renderPatients();
       }
   } catch (error) {
       console.error('Error procesando egreso:', error);
       alert('Error al procesar el egreso. Intente nuevamente.');
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
   alert('Función de edición en desarrollo');
}

// MANTENER FUNCIONES QUE PODRÍAN SER LLAMADAS DESDE OTROS ARCHIVOS
function saveObservations() {
   alert('Observaciones guardadas');
}

function savePendingTasks() {
   alert('Pendientes guardados');
}