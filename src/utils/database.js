// src/utils/database.js
const { Sequelize } = require('sequelize');
const config = require('../config/index.js');
const logger = require('./logger.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = require('../config/database.js')[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging ? msg => logger.debug(msg) : false,
    define: {
      timestamps: true
    }
  }
);

/**
 * Prueba la conexión a la base de datos
 * @returns {Promise<boolean>} true si la conexión es exitosa, false en caso contrario
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    logger.error('Error al conectar a la base de datos:', error);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection
};