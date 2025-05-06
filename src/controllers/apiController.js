// src/controllers/apiController.js
const os = require('os');
const { models } = require('../utils/database');
const { Device, Task, ActivityLog, Stat } = models;
const { Op, literal, fn, col } = require('sequelize');
const deviceManager = require('../utils/deviceManager');
const actionExecutor = require('../utils/actionExecutor');
const logger = require('../utils/logger');
const config = require('../../config');

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
    const deviceCount = await Device.count({ where: { isActive: true } });
    const pendingTasks = await Task.count({ where: { status: 'pending' } });
    const runningTasks = await Task.count({ where: { status: 'running' } });
    
    // Últimas actividades
    const recentActivities = await ActivityLog.findAll({
      order: [['timestamp', 'DESC']],
      limit: 5
    });
    
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
    
    const task = await Task.create({
      appPackage: app_package,
      videoUrls: urls,
      priority: priority ? parseInt(priority) : config.tasks.defaultPriority,
      status: 'pending',
      createdAt: new Date()
    });
    
    return res.json({
      success: true,
      task_id: task.id
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
    const devices = await Device.findAll({
      order: [['lastSeen', 'DESC']],
      limit: 50
    });
    
    res.json(devices);
  } catch (error) {
    logger.error(`Error al obtener dispositivos: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    res.json(tasks);
  } catch (error) {
    logger.error(`Error al obtener tareas: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.findAll({
      order: [['timestamp', 'DESC']],
      limit: 50
    });
    
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
    
    const completedToday = await Task.count({
      where: {
        status: 'completed',
        completedAt: { [Op.gte]: last24Hours }
      }
    });
    
    const failedToday = await Task.count({
      where: {
        status: 'failed',
        completedAt: { [Op.gte]: last24Hours }
      }
    });
    
    // Estadísticas totales
    const totalCompleted = await Task.count({ where: { status: 'completed' } });
    const totalFailed = await Task.count({ where: { status: 'failed' } });
    const pendingTasks = await Task.count({ where: { status: 'pending' } });
    
    // Estadísticas por app
    const appStats = await Task.findAll({
      attributes: [
        'appPackage',
        [fn('COUNT', '*'), 'count']
      ],
      where: { status: 'completed' },
      group: ['appPackage'],
      order: [[literal('count'), 'DESC']],
      limit: 5
    });
    
    const formattedAppStats = appStats.map(stat => ({
      _id: stat.appPackage,
      count: parseInt(stat.getDataValue('count'))
    }));
    
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
      topApps: formattedAppStats
    });
  } catch (error) {
    logger.error(`Error al obtener resumen de estadísticas: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};