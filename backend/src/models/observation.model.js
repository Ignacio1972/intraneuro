// Archivo: /backend/src/models/observation.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Observation = sequelize.define('Observation', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    admission_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'admissions',
            key: 'id'
        }
    },
    observation: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    created_by: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'observations',
    timestamps: true,
    underscored: true,
    updatedAt: false  // Solo necesitamos created_at
});

module.exports = Observation;