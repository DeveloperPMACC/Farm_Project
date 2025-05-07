'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('DeviceApps', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      deviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'devices',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      appId: {
        type: Sequelize.UUID,
        references: {
          model: 'apps',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('DeviceApps');
  }
};