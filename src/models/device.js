'use strict';

module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define('Device', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    serial: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'working', 'error'),
      defaultValue: 'offline'
    },
    lastConnection: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        viewingTime: 60,
        interactionProbability: 0.3,
        account: ''
      }
    }
  }, {
    timestamps: true,
    tableName: 'devices'
  });

  Device.associate = function (models) {
    // Relaciones con otros modelos
    Device.belongsToMany(models.App, {
      through: 'DeviceApps',
      foreignKey: 'deviceId',
      as: 'installedApps'
    });

    Device.hasMany(models.Task, {
      foreignKey: 'deviceId',
      as: 'tasks'
    });
  };

  return Device;
};