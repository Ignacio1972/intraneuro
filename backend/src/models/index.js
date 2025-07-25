const sequelize = require('../config/database');

// Importar todos los modelos
const User = require('./user.model');
const Patient = require('./patient.model');
const Admission = require('./admission.model');
const Observation = require('./observation.model');
const PendingTask = require('./pending-task.model');  // Nombre correcto del modelo
const TimelineEvent = require('./timeline-event.model'); // Agregar este modelo si existe

// Configurar todas las asociaciones
const setupAssociations = () => {
    // Asociaciones de Patient
    Patient.hasMany(Admission, {
        foreignKey: 'patient_id',
        as: 'admissions',
        onDelete: 'CASCADE'
    });
    Admission.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
    });

    // Asociaciones de Admission con Observations
    Admission.hasMany(Observation, {
        foreignKey: 'admission_id',
        as: 'observations',
        onDelete: 'CASCADE'
    });
    Observation.belongsTo(Admission, {
        foreignKey: 'admission_id',
        as: 'admission'
    });

    // Asociaciones de Admission con PendingTasks
    Admission.hasMany(PendingTask, {
        foreignKey: 'admission_id',
        as: 'pendingTasks',
        onDelete: 'CASCADE'
    });
    PendingTask.belongsTo(Admission, {
        foreignKey: 'admission_id',
        as: 'admission'
    });

    // Asociaciones de Admission con TimelineEvent (si existe)
    if (TimelineEvent) {
        Admission.hasMany(TimelineEvent, {
            foreignKey: 'admission_id',
            as: 'timelineEvents',
            onDelete: 'CASCADE'
        });
        TimelineEvent.belongsTo(Admission, {
            foreignKey: 'admission_id',
            as: 'admission'
        });
    }
};

// Sincronizar modelos con la base de datos
const syncDatabase = async (options = {}) => {
    try {
        // Configurar asociaciones primero
        setupAssociations();
        
        // Opciones por defecto
        const syncOptions = {
            alter: false,  // No alterar tablas existentes por defecto
            logging: false, // Desactivar logs SQL en producción
            ...options     // Permitir sobrescribir opciones
        };
        
        // Sincronizar
        await sequelize.sync(syncOptions);
        console.log('✅ Modelos sincronizados con la base de datos');
        console.log('✅ Asociaciones configuradas correctamente');
        
        return true;
    } catch (error) {
        console.error('❌ Error sincronizando modelos:', error);
        throw error; // Re-lanzar el error para manejo superior
    }
};

// Función helper para verificar conexión
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida correctamente');
        return true;
    } catch (error) {
        console.error('❌ No se pudo conectar a la base de datos:', error);
        return false;
    }
};

// Exportar todo
module.exports = {
    sequelize,
    User,
    Patient,
    Admission,
    Observation,
    PendingTask,    // Cambiar de Task a PendingTask
    TimelineEvent,  // Agregar si existe
    setupAssociations,
    syncDatabase,
    testConnection  // Función helper útil
};