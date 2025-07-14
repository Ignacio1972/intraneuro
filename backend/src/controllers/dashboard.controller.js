const { Op } = require('sequelize');
const Admission = require('../models/admission.model');

exports.getStats = async (req, res) => {
    try {
        // Pacientes activos
        const activePatients = await Admission.count({
            where: { status: 'active' }
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