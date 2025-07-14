const { Op } = require('sequelize');
const { Patient, Admission } = require('../models');

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

// Función auxiliar
function calculateDays(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
