'use strict';

module.exports = (sequelize, DataTypes) => {
  const App = sequelize.define('App', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    version: {
      type: DataTypes.STRING
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    timestamps: true,
    tableName: 'apps'
  });

  App.associate = function (models) {
    App.belongsToMany(models.Device, {
      through: 'DeviceApps',
      foreignKey: 'appId',
      as: 'devices'
    });
  };

  return App;
};