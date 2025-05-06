// src/routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

// Rutas para dispositivos
router.get('/', deviceController.getDevices);
router.get('/active', deviceController.getActiveDevices);
router.get('/:id', deviceController.getDeviceById);
router.post('/:id/action', deviceController.performDeviceAction);
router.get('/:id/logs', deviceController.getDeviceLogs);
router.get('/:id/screenshot', deviceController.takeScreenshot);
router.put('/:id', deviceController.updateDevice);
router.delete('/:id', deviceController.removeDevice);

module.exports = router;

// src/routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Rutas para tareas
router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.get('/status/:status', taskController.getTasksByStatus);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/retry', taskController.retryTask);
router.post('/batch', taskController.createBatchTasks);

module.exports = router;

// src/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// Rutas para estadísticas
router.get('/', statsController.getStats);
router.get('/daily', statsController.getDailyStats);
router.get('/weekly', statsController.getWeeklyStats);
router.get('/monthly', statsController.getMonthlyStats);
router.get('/by-app', statsController.getStatsByApp);
router.get('/performance', statsController.getPerformanceMetrics);

module.exports = router;

// src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');

// Rutas de API públicas 
router.get('/status', apiController.getSystemStatus);
router.get('/config/apps', apiController.getSupportedApps);
router.post('/tasks/add', apiController.addTask);
router.get('/devices', apiController.getDevices);
router.get('/tasks', apiController.getTasks);
router.get('/logs', apiController.getLogs);
router.post('/device/:id/command', apiController.executeDeviceCommand);
router.get('/stats/summary', apiController.getStatsSummary);

module.exports = router;

// src/controllers/deviceController.js
const Device = require('../models/device');
const ActivityLog = require('../models/activityLog');
const deviceManager = require('../utils/deviceManager');
const logger = require('../utils/logger');

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find().sort({ lastSeen: -1 });
    res.render('devices/index', { 
      title: 'Dispositivos', 
      devices 
    });
  } catch (error) {
    logger.error(`Error al obtener dispositivos: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveDevices = async (req, res) => {
  try {
    const devices = await Device.find({ 
      isActive: true 
    }).sort({ lastSeen: -1 });
    
    res.json(devices);
  } catch (error) {
    logger.error(`Error al obtener dispositivos activos: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getDeviceById = async (req, res) => {
  try {
    const device = await Device.findOne({ deviceId: req.params.id });
    
    if (!device) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    
    res.render('devices/detail', { 
      title: `Dispositivo ${device.deviceId}`, 
      device 
    });
  } catch (error) {
    logger.error(`Error al obtener dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.performDeviceAction = async (req, res) => {
  try {
    const { action } = req.body;
    const deviceId = req.params.id;
    
    if (!action) {
      return res.status(400).json({ error: 'Acción no especificada' });
    }
    
    let result;
    
    switch (action) {
      case 'unlock':
        result = await deviceManager.unlockScreen(deviceId);
        break;
      case 'reboot':
        result = await deviceManager.executeShellCommand(
          deviceId, 'reboot'
        );
        break;
      case 'home':
        result = await deviceManager.executeShellCommand(
          deviceId, 'input keyevent KEYCODE_HOME'
        );
        break;
      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }
    
    if (result) {
      res.json({ success: true, message: `Acción ${action} ejecutada` });
    } else {
      res.status(500).json({ error: 'Error al ejecutar acción' });
    }
  } catch (error) {
    logger.error(`Error al ejecutar acción en dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getDeviceLogs = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const logs = await ActivityLog.find({ deviceId })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json(logs);
  } catch (error) {
    logger.error(`Error al obtener logs de dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.takeScreenshot = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const screenshotPath = await deviceManager.takeScreenshot(deviceId);
    
    if (!screenshotPath) {
      return res.status(500).json({ error: 'Error al tomar captura de pantalla' });
    }
    
    res.sendFile(screenshotPath);
  } catch (error) {
    logger.error(`Error al tomar captura de pantalla: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { status, isActive, config } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (config) updateData.config = config;
    
    const device = await Device.findOneAndUpdate(
      { deviceId },
      updateData,
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    
    res.json(device);
  } catch (error) {
    logger.error(`Error al actualizar dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.removeDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    const device = await Device.findOneAndUpdate(
      { deviceId },
      { isActive: false, status: 'disconnected' },
      { new: true }
    );
    
    if (!device) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    
    res.json({ success: true, message: 'Dispositivo desactivado' });
  } catch (error) {
    logger.error(`Error al eliminar dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// src/controllers/taskController.js
const Task = require('../models/task');
const actionExecutor = require('../utils/actionExecutor');
const logger = require('../utils/logger');
const config = require('../../config');

exports.getTasks = async (req, res) => {
  try {
    const { limit = 20, skip = 0, status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Task.countDocuments(query);
    
    res.render('tasks/index', {
      title: 'Tareas',
      tasks,
      total,
      currentPage: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
      limit
    });
  } catch (error) {
    logger.error(`Error al obtener tareas: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { appPackage, videoUrls, priority } = req.body;
    
    if (!appPackage || !videoUrls) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    const urls = Array.isArray(videoUrls) ? videoUrls : videoUrls.split(',');
    
    const task = await actionExecutor.addTask(
      appPackage,
      urls,
      priority || config.tasks.defaultPriority
    );
    
    // Notificar a los clientes conectados
    req.io.emit('taskUpdate', { type: 'added', task });
    
    res.json(task);
  } catch (error) {
    logger.error(`Error al crear tarea: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { limit = 20, skip = 0 } = req.query;
    
    const tasks = await Task.find({ status })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await Task.countDocuments({ status });
    
    res.json({
      tasks,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Error al obtener tareas por estado: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.render('tasks/detail', {
      title: `Tarea ${task._id}`,
      task
    });
  } catch (error) {
    logger.error(`Error al obtener tarea: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { priority, status, tags, userNotes } = req.body;
    
    const updateData = {};
    if (priority) updateData.priority = priority;
    if (status) updateData.status = status;
    if (tags) updateData.tags = tags;
    if (userNotes !== undefined) updateData.userNotes = userNotes;
    
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Notificar a los clientes conectados
    req.io.emit('taskUpdate', { type: 'updated', task });
    
    res.json(task);
  } catch (error) {
    logger.error(`Error al actualizar tarea: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Notificar a los clientes conectados
    req.io.emit('taskUpdate', { type: 'deleted', taskId: req.params.id });
    
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (error) {
    logger.error(`Error al eliminar tarea: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.retryTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Resetear intentos fallidos y estado
    task.failedAttempts = 0;
    task.status = 'pending';
    task.lastError = null;
    await task.save();
    
    // Notificar a los clientes conectados
    req.io.emit('taskUpdate', { type: 'retried', task });
    
    res.json({ success: true, message: 'Tarea programada para reintento' });
  } catch (error) {
    logger.error(`Error al reintentar tarea: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.createBatchTasks = async (req, res) => {
  try {
    const { tasks } = req.body;
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'No hay tareas para procesar' });
    }
    
    const createdTasks = [];
    const errors = [];
    
    for (const taskData of tasks) {
      try {
        const { appPackage, videoUrls, priority } = taskData;
        
        if (!appPackage || !videoUrls) {
          errors.push({ taskData, error: 'Faltan datos requeridos' });
          continue;
        }
        
        const urls = Array.isArray(videoUrls) ? videoUrls : videoUrls.split(',');
        
        const task = await actionExecutor.addTask(
          appPackage,
          urls,
          priority || config.tasks.defaultPriority
        );
        
        createdTasks.push(task);
        
        // Notificar a los clientes conectados
        req.io.emit('taskUpdate', { type: 'added', task });
      } catch (error) {
        errors.push({ taskData, error: error.message });
      }
    }
    
    res.json({
      success: true,
      created: createdTasks.length,
      errors: errors.length,
      tasks: createdTasks,
      errorDetails: errors
    });
  } catch (error) {
    logger.error(`Error al crear tareas en lote: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// src/controllers/statsController.js
const Stat = require('../models/stats');
const Task = require('../models/task');
const Device = require('../models/device');
const ActivityLog = require('../models/activityLog');
const logger = require('../utils/logger');

exports.getStats = async (req, res) => {
  try {
    res.render('stats/index', {
      title: 'Estadísticas'
    });
  } catch (error) {
    logger.error(`Error al obtener estadísticas: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getDailyStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const stats = await Stat.find({ type: 'daily' })
      .sort({ date: -1 })
      .limit(parseInt(days));
    
    res.json(stats);
  } catch (error) {
    logger.error(`Error al obtener estadísticas diarias: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getWeeklyStats = async (req, res) => {
  try {
    const { weeks = 4 } = req.query;
    
    const stats = await Stat.find({ type: 'weekly' })
      .sort({ date: -1 })
      .limit(parseInt(weeks));
    
    res.json(stats);
  } catch (error) {
    logger.error(`Error al obtener estadísticas semanales: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const stats = await Stat.find({ type: 'monthly' })
      .sort({ date: -1 })
      .limit(parseInt(months));
    
    res.json(stats);
  } catch (error) {
    logger.error(`Error al obtener estadísticas mensuales: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getStatsByApp = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Calcular fecha límite
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - parseInt(days));
    
    // Agregar estadísticas por aplicación
    const appStats = await Task.aggregate([
      {
        $match: {
          createdAt: { $gte: limitDate },
          status: { $in: ['completed', 'failed'] }
        }
      },
      {
        $group: {
          _id: '$appPackage',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          failedTasks: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
            }
          },
          totalViewTime: { $sum: '$metrics.viewTime' }
        }
      },
      {
        $project: {
          appPackage: '$_id',
          totalTasks: 1,
          completedTasks: 1,
          failedTasks: 1,
          totalViewTime: 1,
          successRate: {
            $cond: [
              { $eq: ['$totalTasks', 0] },
              0,
              { $multiply: [{ $divide: ['$completedTasks', '$totalTasks'] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalTasks: -1 } }
    ]);
    
    res.json(appStats);
  } catch (error) {
    logger.error(`Error al obtener estadísticas por aplicación: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getPerformanceMetrics = async (req, res) => {
  try {
    // Obtener estadísticas generales
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const failedTasks = await Task.countDocuments({ status: 'failed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    
    // Obtener estadísticas de dispositivos
    const totalDevices = await Device.countDocuments();
    const activeDevices = await Device.countDocuments({ isActive: true });
    
    // Calcular tasa de éxito
    const successRate = totalTasks > 0
      ? (completedTasks / totalTasks) * 100
      : 0;
    
    // Obtener tiempo promedio de ejecución
    const avgExecutionTime = await Task.aggregate([
      {
        $match: {
          status: 'completed',
          startTime: { $ne: null },
          completedAt: { $ne: null }
        }
      },
      {
        $project: {
          executionTime: {
            $divide: [
              { $subtract: ['$completedAt', '$startTime'] },
              1000 // Convertir a segundos
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$executionTime' }
        }
      }
    ]);
    
    const metrics = {
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        failed: failedTasks,
        pending: pendingTasks,
        successRate: successRate.toFixed(2)
      },
      devices: {
        total: totalDevices,
        active: activeDevices
      },
      performance: {
        avgExecutionTime: avgExecutionTime.length > 0
          ? avgExecutionTime[0].avgTime.toFixed(2)
          : 0
      }
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error(`Error al obtener métricas de rendimiento: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// src/controllers/apiController.js
const os = require('os');
const Device = require('../models/device');
const Task = require('../models/task');
const ActivityLog = require('../models/activityLog');
const config = require('../../config');
const deviceManager = require('../utils/deviceManager');
const actionExecutor = require('../utils/actionExecutor');
const logger = require('../utils/logger');

exports.getSystemStatus = async (req, res) => {
  try {
    // Información del sistema
    const systemInfo = {
      uptime: Math.floor(process.uptime()),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpu: os.cpus(),
      load: os.loadavg()
    };
    
    // Estadísticas de la granja
    const deviceCount = await Device.countDocuments({ isActive: true });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const runningTasks = await Task.countDocuments({ status: 'running' });
    
    // Últimas actividades
    const recentActivities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(5);
    
    res.json({
      status: 'online',
      system: systemInfo,
      farm: {
        devices: deviceCount,
        tasks: {
          pending: pendingTasks,
          running: runningTasks
        }
      },
      recentActivities
    });
  } catch (error) {
    logger.error(`Error al obtener estado del sistema: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getSupportedApps = async (req, res) => {
  try {
    const apps = config.apps.supported.map(app => app.packageName);
    res.json(apps);
  } catch (error) {
    logger.error(`Error al obtener aplicaciones soportadas: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.addTask = async (req, res) => {
  try {
    const { app_package, video_urls, priority } = req.body;
    
    if (!app_package || !video_urls) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan datos requeridos' 
      });
    }
    
    // Convertir video_urls a array si es string
    const urls = typeof video_urls === 'string'
      ? video_urls.split(',').map(u => u.trim())
      : video_urls;
    
    const task = await actionExecutor.addTask(
      app_package,
      urls,
      priority ? parseInt(priority) : config.tasks.defaultPriority
    );
    
    return res.json({
      success: true,
      task_id: task._id
    });
  } catch (error) {
    logger.error(`Error al añadir tarea: ${error.message}`);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find()
      .sort({ lastSeen: -1 })
      .limit(50);
    
    res.json(devices);
  } catch (error) {
    logger.error(`Error al obtener dispositivos: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(tasks);
  } catch (error) {
    logger.error(`Error al obtener tareas: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json(logs);
  } catch (error) {
    logger.error(`Error al obtener logs: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.executeDeviceCommand = async (req, res) => {
  try {
    const { command } = req.body;
    const deviceId = req.params.id;
    
    if (!command) {
      return res.status(400).json({ 
        success: false, 
        error: 'Comando no especificado' 
      });
    }
    
    const result = await deviceManager.executeShellCommand(deviceId, command);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error(`Error al ejecutar comando: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.getStatsSummary = async (req, res) => {
  try {
    // Estadísticas de las últimas 24 horas
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);
    
    const completedToday = await Task.countDocuments({
      status: 'completed',
      completedAt: { $gte: last24Hours }
    });
    
    const failedToday = await Task.countDocuments({
      status: 'failed',
      completedAt: { $gte: last24Hours }
    });
    
    // Estadísticas totales
    const totalCompleted = await Task.countDocuments({ status: 'completed' });
    const totalFailed = await Task.countDocuments({ status: 'failed' });
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    
    // Estadísticas por app
    const appStats = await Task.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$appPackage',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);
    
    res.json({
      today: {
        completed: completedToday,
        failed: failedToday,
        total: completedToday + failedToday
      },
      total: {
        completed: totalCompleted,
        failed: totalFailed,
        pending: pendingTasks,
        successRate: totalCompleted + totalFailed > 0
          ? ((totalCompleted / (totalCompleted + totalFailed)) * 100).toFixed(2)
          : 0
      },
      topApps: appStats
    });
  } catch (error) {
    logger.error(`Error al obtener resumen de estadísticas: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
