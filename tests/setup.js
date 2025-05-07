// tests/setup.js
const sinon = require('sinon');
const { sequelize } = require('../src/models');

// Exportar una función que será ejecutada por Mocha
module.exports = {
  mochaHooks: {
    beforeAll() {
      // Mockear los métodos de Sequelize para evitar conexiones reales
      sinon.stub(sequelize, 'authenticate').resolves();
      sinon.stub(sequelize, 'sync').resolves();
    },
    
    afterAll() {
      // Restaurar los stubs después de todas las pruebas
      sinon.restore();
    }
  }
};

// Esta función es útil para crear mocks de los modelos de Sequelize
global.createModelMock = (modelName, methods = {}) => {
  // Crear un objeto base con los métodos comunes
  const mockModel = {
    findAll: sinon.stub().resolves([]),
    findOne: sinon.stub().resolves(null),
    findByPk: sinon.stub().resolves(null),
    create: sinon.stub().resolves({}),
    update: sinon.stub().resolves([1]),
    destroy: sinon.stub().resolves(1),
    ...methods
  };
  
  return mockModel;
};

// Función para crear mocks de instancias de modelos
global.createInstanceMock = (data = {}, methods = {}) => {
  return {
    ...data,
    save: sinon.stub().resolves(data),
    update: sinon.stub().resolves(data),
    destroy: sinon.stub().resolves(true),
    ...methods
  };
};