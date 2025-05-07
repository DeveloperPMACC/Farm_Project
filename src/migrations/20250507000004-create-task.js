'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      appId: {
        type: Sequelize.UUID,
        references: {
          model: 'apps',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      deviceId: {
        type: Sequelize.UUID,
        references: {
          model: 'devices',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'running', 'completed', 'failed'),
        defaultValue: 'pending'
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      settings: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      startTime: {
        type: Sequelize.DATE
      },
      endTime: {
        type: Sequelize.DATE
      },
      results: {
        type: Sequelize.JSONB,
        defaultValue: {}
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
    await queryInterface.dropTable('tasks');
  }
};