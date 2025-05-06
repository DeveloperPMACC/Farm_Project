// src/models/device.js (Sequelize)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Device = sequelize.define('Device', {
    deviceId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    model: {
      type: DataTypes.STRING,
      defaultValue: 'Unknown'
    },
    androidVersion: {
      type: DataTypes.STRING,
      defaultValue: 'Unknown'
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('idle', 'busy', 'disconnected', 'error', 'battery_critical'),
      defaultValue: 'idle'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastSeen: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    errorMessage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastTaskTime: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    indexes: [
      { fields: ['status', 'isActive'] },
      { fields: ['lastSeen'] }
    ]
  });

  return Device;
};