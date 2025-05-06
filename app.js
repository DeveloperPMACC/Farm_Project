// app.js - Archivo principal de la aplicación
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const config = require('./config');
const logger = require('./src/utils/logger');

// Importar utilidades
const deviceManager = require('./src/utils/deviceManager');
const actionExecutor = require('./src/utils/actionExecutor');

// Importar rutas
const deviceRoutes = require('./src/routes/deviceRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const statsRoutes = require('./src/routes/statsRoutes');
const apiRoutes = require('./src/routes/apiRoutes');

// Inicializar aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Configurar motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Conectar a MongoDB
mongoose.connect(config.database.url, config.database.options)
  .then(() => {
    logger.info('Conectado a MongoDB');
  })
  .catch(err => {
    logger.error(`Error al conectar a MongoDB: ${err.message}`);
    process.exit(1);
  });

// Socket.io para actualizaciones en tiempo real
io.on('connection', (socket) => {
  logger.debug('Nuevo cliente conectado a Socket.IO');
  
  // Enviar configuración inicial
  socket.emit('config', {
    apps: config.apps.supported.map(app => ({
      packageName: app.packageName,
      appName: app.appName
    }))
  });
  
  // Manejar desconexión
  socket.on('disconnect', () => {
    logger.debug('Cliente desconectado de Socket.IO');
  });
});

// Middleware para pasar io a las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/devices', deviceRoutes);
app.use('/tasks', taskRoutes);
app.use('/stats', statsRoutes);
app.use('/api', apiRoutes);

// Ruta principal - Dashboard
app.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'View Farm Dashboard',
    config: {
      apps: config.apps.supported
    }
  });
});

// Manejador de errores
app.use((err, req, res, next) => {
  logger.error(`Error en la aplicación: ${err.message}`);
  res.status(500).render('error', {
    title: 'Error',
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Inicializar componentes
const initComponents = async () => {
  try {
    // Inicializar gestor de dispositivos
    await deviceManager.initialize();
    
    // Escuchar eventos del gestor de dispositivos
    deviceManager.on('deviceAdded', (device) => {
      io.emit('deviceUpdate', { type: 'added', device });
    });
    
    deviceManager.on('deviceRemoved', (device) => {
      io.emit('deviceUpdate', { type: 'removed', device });
    });
    
    deviceManager.on('deviceUpdated', (device) => {
      io.emit('deviceUpdate', { type: 'updated', device });
    });
    
    // Inicializar ejecutor de acciones
    await actionExecutor.initialize();
    
    logger.info('Componentes inicializados correctamente');
  } catch (error) {
    logger.error(`Error al inicializar componentes: ${error.message}`);
    process.exit(1);
  }
};

// Iniciar servidor
server.listen(config.server.port, config.server.host, async () => {
  logger.info(`Servidor iniciado en http://${config.server.host}:${config.server.port}`);
  await initComponents();
});

// Manejar señales de terminación
process.on('SIGTERM', () => {
  logger.info('Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('Conexión a MongoDB cerrada');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('Recibida señal SIGINT, cerrando servidor...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('Conexión a MongoDB cerrada');
      process.exit(0);
    });
  });
});

module.exports = app;
