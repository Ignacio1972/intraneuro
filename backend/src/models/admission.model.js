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

module.exports = Admission;
