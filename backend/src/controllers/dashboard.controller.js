const { Op } = require('sequelize');
const Admission = require('../models/admission.model');
const Patient = require('../models/patient.model');

exports.getStats = async (req, res) => {
    try {
        // Contar PACIENTES ÚNICOS activos, no admisiones
        const activePatients = await Patient.count({
            include: [{
                model: Admission,
                as: 'admissions',
                where: { status: 'active' },
                required: true
            }],
            distinct: true
        });
        
        // Altas programadas
        const scheduledDischarges = await Admission.count({
            where: {
                status: 'active',
                scheduled_discharge: true
            }
        });
        
        // Ingresos última semana
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weekAdmissions = await Admission.count({
            where: {
                admission_date: {
                    [Op.gte]: oneWeekAgo
                }
            }
        });
        
        // Log para debug
        console.log('Dashboard stats:', {
            activePatients,
            scheduledDischarges,
            weekAdmissions
        });
        
        res.json({
            activePatients,
            scheduledDischarges,
            weekAdmissions
        });
        
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};