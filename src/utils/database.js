// src/utils/database.js
const { Sequelize } = require('sequelize');
const config = require('../../config');
const logger = require('./logger');

// Inicializar Sequelize con la configuración de PostgreSQL
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    dialect: config.database.dialect,
    port: config.database.port,
    logging: msg => logger.debug(msg),
    pool: config.database.pool
  }
);

// Cargar modelos
const Device = require('../models/device')(sequelize);
const Task = require('../models/task')(sequelize);
const ActivityLog = require('../models/activityLog')(sequelize);
const Stat = require('../models/stats')(sequelize);

// Definir relaciones
Task.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });
Device.hasMany(Task, { foreignKey: 'deviceId', as: 'tasks' });
ActivityLog.belongsTo(Device, { foreignKey: 'deviceId', as: 'device' });
ActivityLog.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// Función para sincronizar modelos con la base de datos
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Conexión a PostgreSQL establecida con éxito');
    
    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    logger.info('Modelos sincronizados con la base de datos');
    
    return true;
  } catch (error) {
    logger.error(`Error al conectar con PostgreSQL: ${error.message}`);
    return false;
  }
};

module.exports = {
  sequelize,
  syncDatabase,
  models: {
    Device,
    Task,
    ActivityLog,
    Stat
  }
};