// Archivo: /backend/src/models/task.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
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
    task: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    created_by: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'pending_tasks',
    timestamps: true,
    underscored: true,
    updatedAt: false
});

module.exports = Task;