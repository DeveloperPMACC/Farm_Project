'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('statistics', {
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
      taskId: {
        type: Sequelize.UUID,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      viewTime: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      interactions: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      details: {
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
    await queryInterface.dropTable('statistics');
  }
};