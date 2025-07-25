const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TimelineEvent = sequelize.define('TimelineEvent', {
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
    event_type: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    event_description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    created_by: {
        type: DataTypes.STRING(100)
    }
}, {
    tableName: 'timeline_events',
    timestamps: true,
    underscored: true,
    updatedAt: false
});

module.exports = TimelineEvent;