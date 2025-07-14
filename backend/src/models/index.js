const sequelize = require('../config/database');
const User = require('./user.model');
const Patient = require('./patient.model');
const Admission = require('./admission.model');

// Definir relaciones
Patient.hasMany(Admission, { foreignKey: 'patient_id' });
Admission.belongsTo(Patient, { foreignKey: 'patient_id' });

// Sincronizar modelos con la base de datos
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: false });
        console.log('✅ Modelos sincronizados con la base de datos');
    } catch (error) {
        console.error('❌ Error sincronizando modelos:', error);
    }
};

module.exports = {
    sequelize,
    User,
    Patient,
    Admission,
    syncDatabase
};
