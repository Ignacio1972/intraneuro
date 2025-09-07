// pacientes.js - INTRANEURO Patient Management (Orquestador Principal)

// NUEVA FUNCIÓN: Cargar pacientes desde API con fallback
// En /var/www/intraneuro/js/pacientes.js
// Modifica la función loadPatientsFromAPI:

async function loadPatientsFromAPI() {
   try {
       // AGREGAR timestamp para evitar caché
       const timestamp = Date.now();
       const response = await apiRequest(`/patients/active?_t=${timestamp}`);
       
       if (Array.isArray(response)) {
           // Usar datos de la API
           patients = response;
           console.log('Pacientes cargados desde API:', patients.length);
           return true;
       } else {
           throw new Error('Respuesta inválida de API');
       }
   } catch (error) {
       // Fallback silencioso a datos locales
       console.log('Usando datos locales de pacientes:', error.message);
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
   
   // Open modal
   openModal('patientModal');
   
   // Establecer ID del paciente actual para tracking
   currentPatientId = patientId;
   
   // Agregar entrada al historial para interceptar botón back en mobile
   history.pushState({patientModal: true, patientId: patientId}, '', '#patient-' + patientId);
   
   // Inicializar tracking de cambios
   initializeChangeTracking();
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
           <!-- ESCALA RANKIN TEMPORALMENTE DESHABILITADA - 08/08/2025 -->
           <input type="hidden" id="patientRanking" value="0">
           
           <div class="form-group">
               <label>
                   <input type="checkbox" id="patientDeceased"> Paciente fallecido
               </label>
           </div>
           
           <div class="form-group">
               <label>Diagnóstico de Egreso:</label>
               <input type="text" id="dischargeDiagnosis" placeholder="Ingrese el diagnóstico de egreso..." required>
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
// FUNCIÓN RANKIN TEMPORALMENTE DESHABILITADA - 08/08/2025
/*
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
*/

// NUEVA FUNCIÓN: Toggle de alta programada - CORREGIDA
async function toggleScheduledDischarge(patientId) {
    const isChecked = document.getElementById('toggleScheduledDischarge').checked;
    
    console.log(`[TOGGLE] Patient ${patientId}: ${isChecked ? 'Activando' : 'Desactivando'} alta programada`);
    
    try {
        // CAMBIO: usar /patients en lugar de /admissions
        const response = await apiRequest(`/patients/${patientId}/discharge`, {
            method: 'PUT',
            body: JSON.stringify({ 
                scheduledDischarge: isChecked
            })
        });
        
        console.log(`[TOGGLE] Respuesta API:`, response);
        
        // Actualizar el paciente en el array local
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            patient.scheduledDischarge = isChecked;
            console.log(`[TOGGLE] Array local actualizado`);
        }
        
        // Actualizar dashboard inmediatamente
        updateDashboardFromAPI();
        
        // Actualizar badges inmediatamente
        renderPatients();
        
        // Mostrar notificación toast
        showToast(
            isChecked ? catalogos.messages.scheduledSuccess : catalogos.messages.scheduledRemoved
        );
        
    } catch (error) {
        console.error('[TOGGLE] Error actualizando alta programada:', error);
        
        // Fallback local
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            patient.scheduledDischarge = isChecked;
            updateDashboardFromAPI();
            renderPatients();
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
       const response = await apiRequest(`/patients/${patientId}/discharge`, {
           method: 'PUT',
           body: JSON.stringify(dischargeData)
       });
       
       // Show success message
       showToast(catalogos.messages.dischargeSuccess);
       
       // Close modal and refresh
       closeModal('patientModal');
       updateDashboardFromAPI();
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
           updateDashboardFromAPI();
           renderPatients();
       }
   }
}

// Edit patient data
function editPatientData(patientId) {
   showToast('Función de edición en desarrollo', 'error');
}

// NUEVA FUNCIÓN: Guardar observaciones y pendientes juntos
// REEMPLAZAR la función saveObservationsAndTasks completa
async function saveObservationsAndTasks(patientId) {
    const observations = document.getElementById('patientObservations').value;
    const pendingTasks = document.getElementById('patientPendingTasks').value;
    
    try {
        // Usar patientId directamente ya que el backend lo maneja
        if (observations.trim()) {
            await apiRequest(`/patients/${patientId}/admission/observations`, {
                method: 'POST',
                body: JSON.stringify({ 
                    observation: observations,
                    created_by: currentUser
                })
            });
        }
        
        if (pendingTasks.trim()) {
            await apiRequest(`/patients/${patientId}/admission/tasks`, {
                method: 'POST',
                body: JSON.stringify({ 
                    task: pendingTasks,
                    created_by: currentUser
                })
            });
        }
        
        // Actualizar array local
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            patient.observations = observations;
            patient.pendingTasks = pendingTasks;
        }
        
        showToast('Información guardada correctamente');
        
        // Resetear el estado de cambios no guardados
        resetUnsavedChanges();
        
        // Actualizar valores iniciales
        initialObservations = observations;
        initialPendingTasks = pendingTasks;
        
        // Actualizar botón
        updateSaveButtonState();
        
    } catch (error) {
        console.error('Error guardando información:', error);
        
        // Fallback local
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
            patient.observations = observations;
            patient.pendingTasks = pendingTasks;
            showToast('Información guardada localmente');
            
            // Resetear el estado de cambios no guardados también en fallback
            resetUnsavedChanges();
            initialObservations = observations;
            initialPendingTasks = pendingTasks;
            updateSaveButtonState();
        } else {
            showToast('Error al guardar', 'error');
        }
    }
}

// MANTENER FUNCIONES QUE PODRÍAN SER LLAMADAS DESDE OTROS ARCHIVOS
function saveObservations() {
   showToast('Observaciones guardadas');
}

function savePendingTasks() {
   showToast('Pendientes guardados');
}

// Función para exportar pacientes activos a Excel - VERSIÓN FINAL CORREGIDA
async function exportActivePatientsToExcel() {
    // Verificar que hay datos
    if (!patients || patients.length === 0) {
        showToast('No hay pacientes activos para exportar', 'warning');
        return;
    }
    
    showToast('Preparando exportación...', 'success');
    
    try {
        // Crear libro de Excel
        const wb = XLSX.utils.book_new();
        
        // Preparar datos para Excel
        const excelData = [
            ['LISTADO DE PACIENTES ACTIVOS - INTRANEURO'],
            ['Fecha de generación:', new Date().toLocaleString('es-CL')],
            [''],
            ['Fecha Ingreso', 'Nombre Paciente', 'Cama', 'Edad', 'Diagnóstico', 'Descripción', 'Historia', 'Pendientes', 'Estado', 'Días Hospitalizados']
        ];
        
        // Cargar datos completos de cada paciente
        for (const patient of patients) {
            const daysInHospital = patient.admissionDate 
                ? Math.ceil((new Date() - new Date(patient.admissionDate)) / (1000 * 60 * 60 * 24))
                : 0;
            
            // Cargar observaciones usando ID del paciente (CORREGIDO)
            let historia = 'Sin observaciones';
            if (patient.id) {
                try {
                    const obsResponse = await apiRequest(`/patients/${patient.id}/admission/observations`);
                    
                    if (obsResponse && obsResponse.length > 0) {
                        historia = obsResponse.map(obs => {
                            // Usar createdAt (formato correcto)
                            let fecha = 'Sin fecha';
                            if (obs.createdAt) {
                                try {
                                    fecha = new Date(obs.createdAt).toLocaleDateString('es-CL');
                                } catch (e) {
                                    fecha = 'Fecha inválida';
                                }
                            }
                            
                            // Formatear observación con saltos de línea si es muy larga
                            const texto = obs.observation || 'Sin texto';
                            const textoFormateado = texto.length > 80 
                                ? texto.match(/.{1,80}/g).join('\n    ') 
                                : texto;
                            
                            return `[${fecha}] ${textoFormateado}`;
                        }).join('\n\n'); // Doble salto entre observaciones
                    }
                } catch (error) {
                    console.error(`Error cargando observaciones de ${patient.name}:`, error);
                }
            }
            
            // Cargar pendientes usando ID del paciente (CORREGIDO)
            let pendientes = 'Sin pendientes';
            if (patient.id) {
                try {
                    const tasksResponse = await apiRequest(`/patients/${patient.id}/admission/tasks`);
                    
                    if (tasksResponse && Array.isArray(tasksResponse) && tasksResponse.length > 0) {
                        pendientes = tasksResponse.map((task, index) => {
                            const texto = task.task || task.text || task.descripcion || task;
                            return `${index + 1}. ${texto}`;
                        }).join('\n');
                    }
                } catch (error) {
                    // Si es 404, es normal - no hay tareas
                    if (error.message && error.message.includes('404')) {
                        pendientes = 'Sin pendientes';
                    } else {
                        console.error(`Error inesperado cargando pendientes:`, error);
                    }
                }
            }
            
            // Estado del paciente
            const estado = patient.scheduledDischarge ? 'ALTA PROGRAMADA' : 'Activo';
            
            // Diagnóstico con saltos de línea si es largo
            const diagnosticoCodigo = patient.diagnosis || '';
            const diagnosticoTexto = patient.diagnosisText || '';
            const diagnosticoCompleto = `${diagnosticoCodigo} - ${diagnosticoTexto}`;
            const diagnosticoFormateado = diagnosticoCompleto.length > 50 
                ? diagnosticoCompleto.match(/.{1,50}/g).join('\n') 
                : diagnosticoCompleto;
            
            // Descripción con saltos de línea si es larga
            const descripcion = patient.diagnosisDetails || '';
            const descripcionFormateada = descripcion.length > 80 
                ? descripcion.match(/.{1,80}/g).join('\n') 
                : descripcion || '-';
            
            excelData.push([
                formatDate(patient.admissionDate) || '-',
                patient.name || '-',
                patient.bed || 'Sin asignar',
                patient.age || '-',
                diagnosticoFormateado,
                descripcionFormateada,
                historia,
                pendientes,
                estado,
                daysInHospital
            ]);
        }
        
        // Agregar resumen
        excelData.push([]);
        excelData.push(['RESUMEN']);
        excelData.push(['Total de pacientes activos:', patients.length]);
        
        const scheduledDischarges = patients.filter(p => p.scheduledDischarge).length;
        excelData.push(['Altas programadas para hoy:', scheduledDischarges]);
        
        // Crear hoja
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Ajustar anchos
        ws['!cols'] = [
            { wch: 15 }, // Fecha Ingreso
            { wch: 30 }, // Nombre
            { wch: 10 }, // Cama
            { wch: 8 },  // Edad
            { wch: 25 }, // Alergias
            { wch: 35 }, // Diagnóstico
            { wch: 45 }, // Descripción
            { wch: 60 }, // Historia
            { wch: 40 }, // Pendientes
            { wch: 20 }, // Estado
            { wch: 18 }  // Días Hospitalizados
        ];
        
        // Combinar celdas del título
        ws['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 10 } }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'Pacientes Activos');
        
        // HOJA 2: Pacientes con Alta Programada (si hay)
        const scheduledPatients = patients.filter(p => p.scheduledDischarge);
        if (scheduledPatients.length > 0) {
            const altasData = [
                ['PACIENTES CON ALTA PROGRAMADA PARA HOY'],
                [''],
                ['Fecha Ingreso', 'Nombre', 'Cama', 'Edad', 'Diagnóstico', 'Días Hospitalizado', 'Médico Tratante']
            ];
            
            scheduledPatients.forEach(patient => {
                const days = patient.admissionDate 
                    ? Math.ceil((new Date() - new Date(patient.admissionDate)) / (1000 * 60 * 60 * 24))
                    : 0;
                
                altasData.push([
                    formatDate(patient.admissionDate),
                    patient.name,
                    patient.bed || 'Sin asignar',
                    patient.age,
                    `${patient.diagnosis} - ${patient.diagnosisText}`,
                    days,
                    patient.admittedBy || '-'
                ]);
            });
            
            const ws2 = XLSX.utils.aoa_to_sheet(altasData);
            ws2['!cols'] = [
                { wch: 15 },
                { wch: 30 },
                { wch: 10 },
                { wch: 8 },
                { wch: 50 },
                { wch: 15 },
                { wch: 25 }
            ];
            
            XLSX.utils.book_append_sheet(wb, ws2, 'Altas Programadas');
        }
        
        // Generar archivo
        const fileName = `pacientes_activos_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('Excel exportado correctamente', 'success');
        
    } catch (error) {
        console.error('Error exportando Excel:', error);
        showToast('Error al exportar Excel', 'error');
    }
}

// Función formatDate si no existe en pacientes.js
function formatDate(dateString) {
    if (!dateString) return '-';
    // FIX: Agregar T12:00:00 para evitar problemas de timezone
    const date = new Date(dateString + 'T12:00:00');
    return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
// Función para imprimir lista de pacientes activos
async function printActivePatients() {
    showToast('Preparando impresión...', 'success');
    
    const activePatients = patients.filter(p => p.status === 'active');
    
    if (activePatients.length === 0) {
        showToast('No hay pacientes activos para imprimir', 'warning');
        return;
    }
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Cargar detalles de cada paciente
    const patientsWithDetails = [];
    for (const patient of activePatients) {
        let observations = 'Sin observaciones';
        let tasks = 'Sin pendientes';
        
        try {
            const obsResponse = await apiRequest(`/patients/${patient.id}/admission/observations`);
            if (obsResponse && obsResponse.length > 0) {
                observations = obsResponse.slice(0, 3)
                    .map(obs => {
                        const fecha = obs.createdAt ? new Date(obs.createdAt).toLocaleDateString('es-CL') : '';
                        return `${fecha}: ${obs.observation}`;
                    }).join(' | ');
            }
            
            const tasksResponse = await apiRequest(`/patients/${patient.id}/admission/tasks`);
            if (tasksResponse && tasksResponse.length > 0) {
                tasks = tasksResponse.slice(0, 3)
                    .map((task, i) => `${i+1}. ${task.task}`)
                    .join(' | ');
            }
        } catch (error) {
            console.log('Error cargando detalles:', error);
        }
        
        patientsWithDetails.push({
            ...patient,
            observationsText: observations,
            tasksText: tasks
        });
    }
    
    // HTML simplificado usando clases CSS
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Pacientes Activos - INTRANEURO</title>
            <link rel="stylesheet" href="${window.location.origin}/css/pacientes-print.css">
        </head>
        <body>
            <div class="print-container">
                <div class="print-header">
                    <h1>INTRANEURO - Sistema de Gestión Clínica</h1>
                    <p>Listado de Pacientes Activos</p>
                    <p>${new Date().toLocaleString('es-CL')}</p>
                </div>
                
                <div class="print-summary">
                    <strong>Resumen:</strong> 
                    ${patientsWithDetails.length} pacientes activos | 
                    ${patientsWithDetails.filter(p => p.scheduledDischarge).length} con alta programada
                </div>
                
                ${patientsWithDetails.map((p, index) => `
                    <div class="print-patient">
                        <div class="print-patient-header">
                            <span class="print-patient-name">${index + 1}. ${p.name} - Cama ${p.bed || 'Sin asignar'}</span>
                            ${p.scheduledDischarge ? '<span class="print-alta-hoy">ALTA HOY</span>' : ''}
                        </div>
                        
                        <div class="print-field">
                            <span class="print-field-label">Edad:</span> ${p.age} años | 
                            <span class="print-field-label">Días:</span> ${p.daysInHospital}
                        </div>
                        
                        <div class="print-diagnosis">
                            <strong>Diagnóstico:</strong> ${p.diagnosis} - ${p.diagnosisText}
                        </div>
                        
                        <div class="print-observations">
                            <strong>Observaciones:</strong> ${p.observationsText}
                        </div>
                        
                        <div class="print-tasks">
                            <strong>Pendientes:</strong> ${p.tasksText}
                        </div>
                    </div>
                `).join('')}
                
                <div class="print-footer">
                    <p>Documento generado por INTRANEURO - ${new Date().toLocaleDateString('es-CL')}</p>
                    <p>Este documento contiene información confidencial</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
        showToast('Vista de impresión lista', 'success');
    };
}
// Función para editar cama
async function editBed(event, patientId) {
   event.stopPropagation(); // Evitar abrir el modal del paciente
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentBed = patient.bed || 'Sin asignar';
   
   const newBed = prompt(`Cambiar cama del paciente ${patient.name}:\n\nCama actual: ${currentBed}`, currentBed);
   
   if (newBed !== null && newBed !== currentBed) {
       try {
           const response = await apiRequest(`/patients/${patientId}/bed`, {
               method: 'PUT',
               body: JSON.stringify({ bed: newBed })
           });
           
           if (response.success) {
               // Actualizar array local
               patient.bed = newBed || 'Sin asignar';
               
               // Re-renderizar pacientes
               renderPatients();
               
               showToast('Cama actualizada correctamente');
           }
       } catch (error) {
           console.error('Error actualizando cama:', error);
           showToast('Error al actualizar cama', 'error');
       }
   }
}

// Editar médico tratante
async function editAdmittedBy(event, patientId) {
   event.stopPropagation(); // Evitar abrir el modal del paciente
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentDoctor = patient.admittedBy || 'Sin asignar';
   
   const newDoctor = prompt(`Cambiar médico tratante del paciente ${patient.name}:\n\nMédico actual: ${currentDoctor}`, currentDoctor);
   
   if (newDoctor !== null && newDoctor !== currentDoctor) {
       try {
           const response = await apiRequest(`/patients/${patientId}/admittedBy`, {
               method: 'PUT',
               body: JSON.stringify({ admittedBy: newDoctor })
           });
           
           if (response.success) {
               // Actualizar array local
               patient.admittedBy = newDoctor || 'Sin asignar';
               
               // Re-renderizar pacientes
               renderPatients();
               
               showToast('Médico tratante actualizado correctamente');
           }
       } catch (error) {
           console.error('Error actualizando médico tratante:', error);
           showToast('Error al actualizar médico tratante', 'error');
       }
   }
}

// Editar edad del paciente
async function editPatientAge(event, patientId) {
   event.stopPropagation();
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentAge = patient.age;
   const newAge = prompt(
       `Editar edad del paciente:\n\n` +
       `Edad actual: ${currentAge} años\n\n` +
       `Ingrese la nueva edad (1-120):`,
       currentAge
   );
   
   if (newAge !== null && newAge !== '') {
       const ageNum = parseInt(newAge);
       
       if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
           showToast('La edad debe ser un número entre 1 y 120', 'error');
           return;
       }
       
       try {
           const response = await apiRequest(`/patients/${patientId}`, {
               method: 'PUT',
               body: JSON.stringify({ age: ageNum })
           });
           
           if (response.success) {
               patient.age = ageNum;
               document.getElementById(`age-${patientId}`).textContent = `${ageNum} años`;
               renderPatients();
               showToast('Edad actualizada correctamente');
           }
       } catch (error) {
           console.error('Error actualizando edad:', error);
           showToast('Error al actualizar edad', 'error');
       }
   }
}

// Editar RUT del paciente
async function editPatientRut(event, patientId) {
   event.stopPropagation();
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentRut = patient.rut || '';
   const newRut = prompt(
       `Editar RUT del paciente:\n\n` +
       `RUT actual: ${currentRut || 'Sin RUT'}\n\n` +
       `Ingrese el nuevo RUT (formato: 12345678-9):`,
       currentRut
   );
   
   if (newRut !== null) {
       // Permitir RUT vacío o validar formato
       if (newRut && !validarRUT(newRut)) {
           showToast('RUT inválido. Use formato 12345678-9', 'error');
           return;
       }
       
       try {
           const response = await apiRequest(`/patients/${patientId}`, {
               method: 'PUT',
               body: JSON.stringify({ rut: newRut || null })
           });
           
           if (response.success) {
               patient.rut = newRut || null;
               document.getElementById(`rut-${patientId}`).textContent = newRut || 'Sin RUT';
               renderPatients();
               showToast('RUT actualizado correctamente');
           }
       } catch (error) {
           console.error('Error actualizando RUT:', error);
           showToast('Error al actualizar RUT', 'error');
       }
   }
}

// Editar cama del paciente
async function editPatientBed(event, patientId) {
   event.stopPropagation();
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentBed = patient.bed || '';
   const newBed = prompt(
       `Editar cama del paciente:\n\n` +
       `Cama actual: ${currentBed || 'Sin asignar'}\n\n` +
       `Ingrese la nueva cama:`,
       currentBed
   );
   
   if (newBed !== null) {
       try {
           const response = await apiRequest(`/patients/${patientId}/bed`, {
               method: 'PUT',
               body: JSON.stringify({ bed: newBed || 'Sin asignar' })
           });
           
           if (response.success) {
               patient.bed = newBed || 'Sin asignar';
               document.getElementById(`bed-${patientId}`).textContent = newBed || 'Sin asignar';
               renderPatients();
               showToast('Cama actualizada correctamente');
           }
       } catch (error) {
           console.error('Error actualizando cama:', error);
           showToast('Error al actualizar cama', 'error');
       }
   }
}

// Editar fecha de ingreso
async function editAdmissionDate(event, patientId) {
   event.stopPropagation();
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentDate = patient.admissionDate.split('T')[0];
   const newDate = prompt(
       `Editar fecha de ingreso:\n\n` +
       `Fecha actual: ${formatDate(patient.admissionDate)}\n\n` +
       `Ingrese la nueva fecha (YYYY-MM-DD):`,
       currentDate
   );
   
   if (newDate !== null && newDate !== '') {
       // Validar formato de fecha
       const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
       if (!dateRegex.test(newDate)) {
           showToast('Formato de fecha inválido. Use YYYY-MM-DD', 'error');
           return;
       }
       
       try {
           const response = await apiRequest(`/patients/${patientId}/admission`, {
               method: 'PUT',
               body: JSON.stringify({ admission_date: newDate })
           });
           
           if (response.success) {
               patient.admissionDate = newDate;
               document.getElementById(`admission-date-${patientId}`).textContent = formatDate(newDate);
               // Recalcular días en hospital
               patient.daysInHospital = calculateDaysInHospital(newDate);
               renderPatients();
               showToast('Fecha de ingreso actualizada correctamente');
           }
       } catch (error) {
           console.error('Error actualizando fecha:', error);
           showToast('Error al actualizar fecha de ingreso', 'error');
       }
   }
}

// Editar diagnóstico
async function editPatientDiagnosis(event, patientId) {
   event.stopPropagation();
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentDiagnosis = patient.diagnosis || '';
   const newDiagnosis = prompt(
       `Editar diagnóstico del paciente:\n\n` +
       `Diagnóstico actual: ${catalogos.getDiagnosisText(currentDiagnosis)}\n\n` +
       `Ingrese el nuevo diagnóstico:`,
       currentDiagnosis
   );
   
   if (newDiagnosis !== null && newDiagnosis !== '') {
       try {
           const response = await apiRequest(`/patients/${patientId}/admission`, {
               method: 'PUT',
               body: JSON.stringify({ 
                   diagnosis_code: newDiagnosis,
                   diagnosis_text: newDiagnosis
               })
           });
           
           if (response.success) {
               patient.diagnosis = newDiagnosis;
               patient.diagnosisText = newDiagnosis;
               document.getElementById(`diagnosis-${patientId}`).textContent = newDiagnosis;
               renderPatients();
               showToast('Diagnóstico actualizado correctamente');
           }
       } catch (error) {
           console.error('Error actualizando diagnóstico:', error);
           showToast('Error al actualizar diagnóstico', 'error');
       }
   }
}

// Editar médico tratante - función mejorada
async function editAdmittedBy(event, patientId) {
   event.stopPropagation();
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentDoctor = patient.admittedBy || '';
   const newDoctor = prompt(
       `Editar médico tratante:\n\n` +
       `Médico actual: ${currentDoctor || 'Sin asignar'}\n\n` +
       `Ingrese el nombre del nuevo médico tratante:`,
       currentDoctor
   );
   
   if (newDoctor !== null && newDoctor !== '') {
       try {
           const response = await apiRequest(`/patients/${patientId}/admittedBy`, {
               method: 'PUT',
               body: JSON.stringify({ admittedBy: newDoctor })
           });
           
           if (response.success) {
               patient.admittedBy = newDoctor;
               document.getElementById(`admitted-by-${patientId}`).textContent = newDoctor;
               renderPatients();
               showToast('Médico tratante actualizado correctamente');
           }
       } catch (error) {
           console.error('Error actualizando médico:', error);
           showToast('Error al actualizar médico tratante', 'error');
       }
   }
}

// Editar nombre del paciente
async function editPatientName(event, patientId) {
   event.stopPropagation(); // Evitar cerrar o interferir con el modal
   
   const patient = patients.find(p => p.id === patientId);
   if (!patient) return;
   
   const currentName = patient.name;
   
   // Prompt para nuevo nombre con validaciones claras
   const newName = prompt(
       `Editar nombre del paciente:\n\n` +
       `Nombre actual: ${currentName}\n\n` +
       `Ingrese el nuevo nombre (mínimo 3 caracteres):`,
       currentName
   );
   
   // Validaciones
   if (newName === null) return; // Canceló
   
   const trimmedName = newName.trim();
   
   if (trimmedName === currentName) return; // Sin cambios
   
   if (trimmedName.length < 3) {
       showToast('El nombre debe tener al menos 3 caracteres', 'error');
       return;
   }
   
   if (trimmedName.length > 100) {
       showToast('El nombre no puede superar los 100 caracteres', 'error');
       return;
   }
   
   // Validar que solo contenga letras, espacios y caracteres latinos
   if (!/^[a-zA-ZÀ-ÿÑñ\s]+$/.test(trimmedName)) {
       showToast('El nombre solo puede contener letras y espacios', 'error');
       return;
   }
   
   try {
       // Llamar al endpoint updatePatient existente
       const response = await apiRequest(`/patients/${patientId}`, {
           method: 'PUT',
           body: JSON.stringify({ name: trimmedName })
       });
       
       if (response.success) {
           // Actualizar en memoria local
           patient.name = trimmedName;
           
           // Re-renderizar el modal con los datos actualizados
           const admissionData = document.getElementById('admissionData');
           if (admissionData) {
               admissionData.innerHTML = renderAdmissionData(patient);
           }
           
           // Re-renderizar la lista de pacientes
           renderPatients();
           
           showToast('Nombre actualizado correctamente', 'success');
       } else {
           showToast('Error al actualizar el nombre', 'error');
       }
   } catch (error) {
       console.error('Error actualizando nombre:', error);
       showToast('Error al actualizar el nombre del paciente', 'error');
   }
}

// Interceptor del botón back en mobile para modal de pacientes
window.addEventListener('popstate', function(e) {
    const patientModal = document.getElementById('patientModal');
    
    // Si el modal está abierto y el usuario presiona back
    if (patientModal && patientModal.classList.contains('active')) {
        e.preventDefault();
        
        // Mostrar confirmación
        if (confirm('¿Cerrar información del paciente y volver a la lista?')) {
            // Usuario confirma: cerrar modal
            closeModal('patientModal');
            // Limpiar URL
            history.replaceState(null, '', window.location.pathname);
        } else {
            // Usuario cancela: mantener modal abierto
            const currentState = e.state || {};
            history.pushState({
                patientModal: true, 
                patientId: currentState.patientId || currentPatientId
            }, '', '#patient-' + (currentState.patientId || currentPatientId));
        }
    }
});