const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar configuración
const config = require('./src/config');

// Importar utilidades
const logger = require('./src/utils/logger');
const { testConnection } = require('./src/utils/database.js');

// Importar rutas
const deviceRoutes = require('./src/routes/device.routes');
const taskRoutes = require('./src/routes/task.routes');
const statisticsRoutes = require('./src/routes/statistics.routes');
const authRoutes = require('./src/routes/auth.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statisticsRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error(err.stack);

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('No se pudo conectar a la base de datos. Saliendo...');
      process.exit(1);
    }

    const PORT = config.app.port;
    app.listen(PORT, () => {
      logger.info(`Servidor ejecutándose en puerto ${PORT}`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;