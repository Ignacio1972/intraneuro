const Patient = require('../models/patient.model');
const Admission = require('../models/admission.model');
const Observation = require('../models/observation.model');
const PendingTask = require('../models/pending-task.model');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const TimelineEvent = require('../models/timeline-event.model');

// Obtener tareas pendientes de una admisión
exports.getAdmissionTasks = async (req, res) => {
    try {
        const patientId = req.params.id;
        
        // Buscar la admisión activa del paciente
        const admission = await Admission.findOne({
            where: { 
                patient_id: patientId,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión no encontrada' });
        }
        
        // Obtener tareas de esa admisión
        const tasks = await PendingTask.findAll({
            where: { admission_id: admission.id },
            order: [['created_at', 'ASC']]
        });
        
        res.json(tasks);
        
    } catch (error) {
        console.error('Error obteniendo tareas:', error);
        res.status(500).json({ error: 'Error al obtener tareas pendientes' });
    }
};

// Crear nueva tarea
exports.createTask = async (req, res) => {
    try {
        const patientId = req.params.id;
        const { task } = req.body;
        const created_by = req.user?.full_name || 'Sistema';
        
        if (!task || task.trim() === '') {
            return res.status(400).json({ error: 'La tarea no puede estar vacía' });
        }
        
        // Buscar admisión activa del paciente
        const admission = await Admission.findOne({
            where: { 
                patient_id: patientId,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión no encontrada o paciente ya egresado' });
        }
        
        // Crear tarea
        const newTask = await PendingTask.create({
            admission_id: admission.id,
            task: task.trim(),
            created_by: created_by
        });
        
        res.status(201).json(newTask);
        
    } catch (error) {
        console.error('Error creando tarea:', error);
        res.status(500).json({ error: 'Error al crear tarea pendiente' });
    }
};

// Listar pacientes activos
exports.getActivePatients = async (req, res) => {
    try {
        const patients = await Patient.findAll({
            include: [{
                model: Admission,
                as: 'admissions',
                where: { status: 'active' },
                required: true
            }],
            order: [[{ model: Admission, as: 'admissions' }, 'admission_date', 'DESC']]
        });
        
        // Formatear respuesta para coincidir con frontend
        const formattedPatients = patients.map(p => {
            const admission = p.admissions[0];
            return {
                id: p.id,
                admissionId: admission.id,
                name: p.name,
                age: p.age,
                rut: p.rut,
                phone: p.phone,
                bed: admission.bed || 'Sin asignar',
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
                as: 'admissions',
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
    const transaction = await sequelize.transaction();
    
    try {
        const {
            name, age, rut, phone, bed,
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
            bed: bed || 'Sin asignar',
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

// Función auxiliar
function calculateDays(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Buscar por RUT
exports.searchByRut = async (req, res) => {
    try {
        const { rut } = req.query;
        
        const patient = await Patient.findOne({
            where: { rut },
            include: [{
                model: Admission,
                as: 'admissions',
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
            previousAdmissions: patient.admissions || []
        });
        
    } catch (error) {
        console.error('Error buscando paciente:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar alta programada o procesar egreso completo
exports.updateDischarge = async (req, res) => {
    const transaction = await sequelize.transaction();
    
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
        
        // Buscar admisión activa del paciente
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        // Si solo es actualización de alta programada
        if (scheduledDischarge !== undefined && !dischargeDate) {
            admission.scheduled_discharge = scheduledDischarge;
            await admission.save({ transaction });
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
        }
        
        await transaction.commit();
        
        res.json({ 
            success: true, 
            scheduledDischarge: admission.scheduled_discharge,
            status: admission.status
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error actualizando discharge:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar cama de paciente
exports.updateBed = async (req, res) => {
    try {
        const { id } = req.params;
        const { bed } = req.body;
        
        // Buscar admisión activa
        const admission = await Admission.findOne({
            where: { 
                patient_id: id,
                status: 'active'
            }
        });
        
        if (!admission) {
            return res.status(404).json({ error: 'Admisión activa no encontrada' });
        }
        
        admission.bed = bed || 'Sin asignar';
        await admission.save();
        
        res.json({ 
            success: true, 
            bed: admission.bed 
        });
        
    } catch (error) {
        console.error('Error actualizando cama:', error);
        res.status(500).json({ error: 'Error al actualizar cama' });
    }
};

// Obtener observaciones de una admisión
exports.getObservations = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar admisión activa del paciente
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
        
        // Validar datos
        if (!observation || !observation.trim()) {
            return res.status(400).json({ error: 'La observación no puede estar vacía' });
        }
        
        // Buscar admisión activa del paciente
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
        
        res.status(201).json(newObservation);
    } catch (error) {
        console.error('Error creando observación:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Obtener pacientes archivados (dados de alta)
exports.getArchivedPatients = async (req, res) => {
    try {
        const patients = await Patient.findAll({
            include: [{
                model: Admission,
                as: 'admissions',
                where: { status: 'discharged' },
                required: true,
                order: [['discharge_date', 'DESC']]
            }],
            order: [[{ model: Admission, as: 'admissions' }, 'discharge_date', 'DESC']]
        });
        
        // Formatear respuesta para el frontend
        const formattedPatients = patients.map(patient => ({
            id: patient.id,
            name: patient.name,
            age: patient.age,
            rut: patient.rut,
            phone: patient.phone,
            admissions: patient.admissions.map(admission => ({
                admissionId: admission.id,
                admissionDate: admission.admission_date,
                dischargeDate: admission.discharge_date,
                diagnosis: admission.diagnosis_code,
                diagnosisText: admission.diagnosis_text,
                diagnosisDetails: admission.diagnosis_details,
                allergies: admission.allergies,
                bed: admission.bed,
                ranking: admission.ranking,
                dischargedBy: admission.discharged_by,
                deceased: admission.deceased
            }))
        }));
        
        res.json(formattedPatients);
    } catch (error) {
        console.error('Error obteniendo pacientes archivados:', error);
        res.status(500).json({ error: 'Error al obtener pacientes archivados' });
    }
};

// Obtener historial completo del paciente
exports.getPatientHistory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const patient = await Patient.findByPk(id, {
            include: [{
                model: Admission,
                as: 'admissions',
                order: [['admission_date', 'DESC']]
            }]
        });
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Formatear respuesta
        const formattedResponse = {
            id: patient.id,
            name: patient.name,
            age: patient.age,
            rut: patient.rut,
            phone: patient.phone,
    admissions: patient.admissions.map(admission => ({
    admissionId: admission.id,
    admissionDate: admission.admission_date,
    dischargeDate: admission.discharge_date,
    diagnosis: admission.diagnosis_code,
    diagnosisText: admission.diagnosis_text,
    diagnosisDetails: admission.diagnosis_details,
    dischargeDiagnosis: admission.discharge_diagnosis,  // ← ESTA ES LA LÍNEA QUE HAY QUE AGREGAR
    dischargeDetails: admission.discharge_details,      // ← ESTA YA EXISTE
    allergies: admission.allergies,
    bed: admission.bed,
    ranking: admission.ranking,
    status: admission.status,
    admittedBy: admission.admitted_by,
    dischargedBy: admission.discharged_by,
    deceased: admission.deceased
}))
        };
        
        res.json(formattedResponse);
    } catch (error) {
        console.error('Error obteniendo historial del paciente:', error);
        res.status(500).json({ error: 'Error al obtener historial del paciente' });
    }
};

// Reingresar paciente
exports.reAdmitPatient = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { readmittedBy } = req.body;
        
        // Verificar que el paciente existe
        const patient = await Patient.findByPk(id);
        if (!patient) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Verificar que no tenga una admisión activa
        const activeAdmission = await Admission.findOne({
            where: {
                patient_id: id,
                status: 'active'
            }
        });
        
        if (activeAdmission) {
            await transaction.rollback();
            return res.status(400).json({ error: 'El paciente ya tiene una admisión activa' });
        }
        
        // Crear nueva admisión
        const newAdmission = await Admission.create({
            patient_id: id,
            admission_date: new Date(),
            bed: 'Sin asignar',
            diagnosis_code: 'Z00.0',
            diagnosis_text: 'Reingreso - Diagnóstico pendiente',
            diagnosis_details: 'Paciente reingresado, evaluación inicial pendiente',
            admitted_by: readmittedBy || req.user?.full_name || 'Sistema',
            status: 'active'
        }, { transaction });
        
        await transaction.commit();
        
        res.json({
            success: true,
            message: 'Paciente reingresado exitosamente',
            admissionId: newAdmission.id
        });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error reingresando paciente:', error);
        res.status(500).json({ error: 'Error al reingresar paciente' });
    }
};

// Obtener observaciones por admissionId
exports.getObservationsByAdmission = async (req, res) => {
    try {
        const { admissionId } = req.params;
        
        const observations = await Observation.findAll({
            where: { admission_id: admissionId },
            order: [['created_at', 'DESC']]
        });
        
        res.json(observations);
    } catch (error) {
        console.error('Error obteniendo observaciones:', error);
        res.status(500).json({ error: 'Error al obtener observaciones' });
    }
};

// Actualizar datos del paciente
exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, rut, age, phone } = req.body;
        
        const patient = await Patient.findByPk(id);
        
        if (!patient) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Actualizar solo campos enviados
        if (name !== undefined) patient.name = name;
        if (rut !== undefined) patient.rut = rut;
        if (age !== undefined) patient.age = age;
        if (phone !== undefined) patient.phone = phone;
        
        await patient.save();
        
        res.json({
            success: true,
            patient
        });
        
    } catch (error) {
        console.error('Error actualizando paciente:', error);
        res.status(500).json({ error: 'Error al actualizar paciente' });
    }
};  // ← ESTA LLAVE FALTABA

// Eliminar paciente completo
// Eliminar paciente completo - VERSIÓN SIMPLE
exports.deletePatient = async (req, res) => {
    const sequelize = require('../config/database');
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        
        // Buscar paciente
        const patient = await Patient.findByPk(id, { transaction });
        if (!patient) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        
        // Borrar todo con queries SQL directas para evitar problemas
        await sequelize.query(
            `DELETE FROM observations WHERE admission_id IN (SELECT id FROM admissions WHERE patient_id = :patientId)`,
            { replacements: { patientId: id }, transaction }
        );
        
        await sequelize.query(
            `DELETE FROM pending_tasks WHERE admission_id IN (SELECT id FROM admissions WHERE patient_id = :patientId)`,
            { replacements: { patientId: id }, transaction }
        );
        
        // Intentar borrar timeline_events solo si existe
        try {
            await sequelize.query(
                `DELETE FROM timeline_events WHERE admission_id IN (SELECT id FROM admissions WHERE patient_id = :patientId)`,
                { replacements: { patientId: id }, transaction }
            );
        } catch (e) {
            // Ignorar si no existe
        }
        
        await sequelize.query(
            `DELETE FROM admissions WHERE patient_id = :patientId`,
            { replacements: { patientId: id }, transaction }
        );
        
        await sequelize.query(
            `DELETE FROM patients WHERE id = :patientId`,
            { replacements: { patientId: id }, transaction }
        );
        
        await transaction.commit();
        
        console.log(`✅ Paciente ${id} eliminado correctamente con SQL directo`);
        res.json({ message: 'Paciente eliminado correctamente' });
        
    } catch (error) {
        await transaction.rollback();
        console.error('Error eliminando paciente:', error);
        res.status(500).json({ error: 'Error al eliminar paciente' });
    }
};