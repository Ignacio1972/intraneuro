const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Admission = sequelize.define('Admission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patient_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'patients',
            key: 'id'
        }
    },
    admission_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    diagnosis_code: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    diagnosis_text: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    diagnosis_details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    allergies: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    admitted_by: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    bed: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'Sin asignar'
    },
    discharge_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    discharge_diagnosis: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    discharge_details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    ranking: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 0,
            max: 6
        }
    },
    deceased: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    discharged_by: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    scheduled_discharge: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('active', 'discharged'),
        defaultValue: 'active'
    }
}, {
    tableName: 'admissions',
    timestamps: true,
    underscored: true
});

// Importar modelos relacionados después de la definición
// para evitar dependencias circulares
const setupAssociations = () => {
    const Patient = require('./patient.model');
    const Observation = require('./observation.model');
    const PendingTask = require('./pending-task.model');
    const TimelineEvent = require('./timeline-event.model');

    // Relación con Patient
    Admission.belongsTo(Patient, {
        foreignKey: 'patient_id',
        as: 'patient'
    });

    // Relación con Observations
    Admission.hasMany(Observation, {
        foreignKey: 'admission_id',
        as: 'observations',
        onDelete: 'CASCADE'
    });

    // Relación con PendingTasks
    Admission.hasMany(PendingTask, {
        foreignKey: 'admission_id',
        as: 'pendingTasks',
        onDelete: 'CASCADE'
    });

    // Relación con TimelineEvents
    Admission.hasMany(TimelineEvent, {
        foreignKey: 'admission_id',
        as: 'timelineEvents',
        onDelete: 'CASCADE'
    });
};

// Método de instancia para obtener resumen
Admission.prototype.getSummary = async function() {
    const observationsCount = await this.countObservations();
    const pendingTasksCount = await this.countPendingTasks({
        where: { status: 'pending' }
    });
    
    return {
        id: this.id,
        patient_id: this.patient_id,
        admission_date: this.admission_date,
        diagnosis: `${this.diagnosis_code} - ${this.diagnosis_text}`,
        status: this.status,
        scheduled_discharge: this.scheduled_discharge,
        bed: this.bed,
        days_hospitalized: this.getDaysHospitalized(),
        observations_count: observationsCount,
        pending_tasks_count: pendingTasksCount
    };
};

// Método para calcular días hospitalizado
Admission.prototype.getDaysHospitalized = function() {
    const start = new Date(this.admission_date);
    const end = this.discharge_date ? new Date(this.discharge_date) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
};

// Exportar el modelo
module.exports = Admission;

// Exportar función para configurar asociaciones
module.exports.setupAssociations = setupAssociations;