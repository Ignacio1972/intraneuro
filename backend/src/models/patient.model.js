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
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    }
}, {
    tableName: 'patients',
    timestamps: true,
    underscored: true
});

module.exports = Patient;
