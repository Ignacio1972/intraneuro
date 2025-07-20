const { Op } = require('sequelize');
const { Patient, Admission, Observation, Task } = require('../models');

// Listar pacientes activos
exports.getActivePatients = async (req, res) => {
    try {
        
        const patients = await Patient.findAll({
            include: [{
                model: Admission,
                where: { status: 'active' },
                required: true
            }],
            order: [[Admission, 'admission_date', 'DESC']]
        });
        
        // Formatear respuesta para coincidir con frontend
        const formattedPatients = patients.map(p => {
            const admission = p.Admissions[0];
            return {
                id: p.id,
                admissionId: admission.id,  // ← AGREGADO: admission_id para futuras funcionalidades
                name: p.name,
                age: p.age,
                rut: p.rut,
                phone: p.phone,
                admissionDate: admission.admission_date,
                diagnosis: admission.diagnosis_code,
                diagnosisText: admission.diagnosis_text,
                diagnosisDetails: admission.diagnosis_details,
                allergies: admission.allergies,
                admittedBy: admission.admitted_by,
                status: 'active',
                daysInHospital: calculateDays(admission.admission_date),
                scheduledDischarge: admission.scheduled_discharge
            };
        });
        
        console.log(`[PATIENTS] Retornando ${formattedPatients.length} pacientes activos con admissionId`);
        
        res.json(formattedPatients);
    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener detalle de paciente
exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const patient = await Patient.findByPk(id, {
            include: [{
                model: Admission,
                where: { status: 'active' },
                required: false
            }]
        });
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        res.json(patient);
    } catch (error) {
        console.error('Error obteniendo paciente:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Crear paciente con admisión
exports.createPatient = async (req, res) => {
    const transaction = await Patient.sequelize.transaction();
    
    try {
        const {
            name, age, rut, phone,
            admissionDate, diagnosis, diagnosisText, 
            diagnosisDetails, allergies, admittedBy
        } = req.body;
        
        // Buscar si existe paciente con ese RUT
        let patient = null;
        if (rut) {
            patient = await Patient.findOne({ where: { rut } });
        }
        
        // Si no existe, crear
        if (!patient) {
            patient = await Patient.create({
                name, age, rut, phone
            }, { transaction });
        }
        
        // Crear admisión
        const admission = await Admission.create({
            patient_id: patient.id,
            admission_date: admissionDate,
            diagnosis_code: diagnosis,
            diagnosis_text: diagnosisText,
            diagnosis_details: diagnosisDetails,
            allergies: allergies,
            admitted_by: admittedBy,
            status: 'active'
        }, { transaction });
        
        await transaction.commit();
        
        res.status(201).json({
            patient,
            admission,
            message: 'Paciente ingresado correctamente'
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error creando paciente:', error);
        res.status(500).json({ error: 'Error al crear paciente' });
    }
};

// Buscar por RUT
exports.searchByRut = async (req, res) => {
    try {
        const { rut } = req.query;
        
        const patient = await Patient.findOne({
            where: { rut },
            include: [{
                model: Admission,
                where: { status: 'discharged' },
                required: false,
                order: [['discharge_date', 'DESC']]
            }]
        });
        
        if (!patient) {
            return res.json({ found: false });
        }
        
        res.json({
            found: true,
            patient,
            previousAdmissions: patient.Admissions || []
        });
        
    } catch (error) {
        console.error('Error buscando paciente:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar alta programada o procesar egreso completo
exports.updateDischarge = async (req, res) => {
    const transaction = await Patient.sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { 
            scheduledDischarge, 
            dischargeDate,
            ranking,
            dischargeDiagnosis,
            dischargeDetails,
            deceased,
            dischargedBy 
        } = req.body;
        
        console.log(`[DISCHARGE] Patient ID: ${id}`, req.body);
        
        // IMPORTANTE: 'id' aquí es patient_id, no admission_id
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        console.log(`[DISCHARGE] Admission found: ${admission ? admission.id : 'NOT FOUND'}`);
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        // Si solo es actualización de alta programada
        if (scheduledDischarge !== undefined && !dischargeDate) {
            admission.scheduled_discharge = scheduledDischarge;
            await admission.save({ transaction });
            console.log(`[DISCHARGE] Alta programada actualizada a: ${scheduledDischarge}`);
        } 
        // Si es egreso completo
        else if (dischargeDate) {
            admission.discharge_date = dischargeDate;
            admission.discharge_diagnosis = dischargeDiagnosis;
            admission.discharge_details = dischargeDetails;
            admission.ranking = ranking;
            admission.deceased = deceased;
            admission.discharged_by = dischargedBy;
            admission.scheduled_discharge = false;
            admission.status = 'discharged';
            
            await admission.save({ transaction });
            console.log(`[DISCHARGE] Egreso completo procesado`);
        }
        
        await transaction.commit();
        
        res.json({ 
            success: true, 
            scheduledDischarge: admission.scheduled_discharge,
            status: admission.status
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('[DISCHARGE] Error:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// ========== NUEVOS MÉTODOS PARA OBSERVACIONES Y TAREAS ==========

// Obtener observaciones de una admisión
exports.getObservations = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar admission_id basado en patient_id
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        const observations = await Observation.findAll({
            where: { admission_id: admission.id },
            order: [['created_at', 'DESC']]
        });
        
        console.log(`[OBSERVATIONS] Encontradas ${observations.length} observaciones para admission ${admission.id}`);
        
        res.json(observations);
    } catch (error) {
        console.error('Error obteniendo observaciones:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Crear observación
exports.createObservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { observation, created_by } = req.body;
        
        console.log(`[OBSERVATIONS] Creando observación para patient ${id}`);
        
        // Validar datos
        if (!observation || !observation.trim()) {
            return res.status(400).json({ error: 'La observación no puede estar vacía' });
        }
        
        // Buscar admission_id basado en patient_id
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        const newObservation = await Observation.create({
            admission_id: admission.id,
            observation: observation.trim(),
            created_by: created_by || req.user?.full_name || 'Sistema'
        });
        
        console.log(`[OBSERVATIONS] Observación creada con ID ${newObservation.id}`);
        
        res.status(201).json(newObservation);
    } catch (error) {
        console.error('Error creando observación:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener tareas de una admisión
exports.getTasks = async (req, res) => {
    try {
        const { id } = req.params;
        
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        const tasks = await Task.findAll({
            where: { admission_id: admission.id },
            order: [['created_at', 'DESC']]
        });
        
        console.log(`[TASKS] Encontradas ${tasks.length} tareas para admission ${admission.id}`);
        
        res.json(tasks);
    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Crear tarea
exports.createTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { task, created_by } = req.body;
        
        console.log(`[TASKS] Creando tarea para patient ${id}`);
        
        // Validar datos
        if (!task || !task.trim()) {
            return res.status(400).json({ error: 'La tarea no puede estar vacía' });
        }
        
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        const newTask = await Task.create({
            admission_id: admission.id,
            task: task.trim(),
            created_by: created_by || req.user?.full_name || 'Sistema'
        });
        
        console.log(`[TASKS] Tarea creada con ID ${newTask.id}`);
        
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Función auxiliar
function calculateDays(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}