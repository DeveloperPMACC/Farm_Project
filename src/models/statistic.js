'use strict';

module.exports = (sequelize, DataTypes) => {
  const Statistic = sequelize.define('Statistic', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    deviceId: {
      type: DataTypes.UUID,
      references: {
        model: 'Device',
        key: 'id'
      }
    },
    appId: {
      type: DataTypes.UUID,
      references: {
        model: 'App',
        key: 'id'
      }
    },
    taskId: {
      type: DataTypes.UUID,
      references: {
        model: 'Task',
        key: 'id'
      }
    },
    viewTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    interactions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    details: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    tableName: 'statistics'
  });

  Statistic.associate = function (models) {
    Statistic.belongsTo(models.Device, {
      foreignKey: 'deviceId',
      as: 'device'
    });

    Statistic.belongsTo(models.App, {
      foreignKey: 'appId',
      as: 'app'
    });

    Statistic.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task'
    });
  };

  return Statistic;
};