const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 150
        }
    },
    rut: {
        type: DataTypes.STRING(15),
        unique: true,
        allowNull: true
    }
}, {
    tableName: 'patients',
    timestamps: true,
    underscored: true
});

// Definir asociaciones
Patient.associate = (models) => {
    Patient.hasMany(models.Admission, {
        foreignKey: 'patient_id',
        as: 'Admissions'
    });
};

module.exports = Patient;