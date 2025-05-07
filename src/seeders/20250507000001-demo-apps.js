'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('apps', [
      {
        id: uuidv4(),
        name: 'YouTube',
        packageName: 'com.google.android.youtube',
        version: 'latest',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'TikTok',
        packageName: 'com.zhiliaoapp.musically',
        version: 'latest',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Snapchat',
        packageName: 'com.snapchat.android',
        version: 'latest',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('apps', null, {});
  }
};