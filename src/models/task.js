'use strict';

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    appId: {
      type: DataTypes.UUID,
      references: {
        model: 'App',
        key: 'id'
      }
    },
    deviceId: {
      type: DataTypes.UUID,
      references: {
        model: 'Device',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'completed', 'failed'),
      defaultValue: 'pending'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    startTime: {
      type: DataTypes.DATE
    },
    endTime: {
      type: DataTypes.DATE
    },
    results: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    tableName: 'tasks'
  });

  Task.associate = function (models) {
    Task.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      as: 'device'
    });

    Task.belongsTo(models.App, {
      foreignKey: 'appId',
      as: 'app'
    });
  };

  return Task;
};