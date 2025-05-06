// src/controllers/statsController.js
const { models } = require('../utils/database');
const { Task, Device, ActivityLog, Stat } = models;
const { Op, literal, fn, col } = require('sequelize');
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
    
    const stats = await Stat.findAll({
      where: { type: 'daily' },
      order: [['date', 'DESC']],
      limit: parseInt(days)
    });
    
    res.json(stats);
  } catch (error) {
    logger.error(`Error al obtener estadísticas diarias: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getWeeklyStats = async (req, res) => {
  try {
    const { weeks = 4 } = req.query;
    
    const stats = await Stat.findAll({
      where: { type: 'weekly' },
      order: [['date', 'DESC']],
      limit: parseInt(weeks)
    });
    
    res.json(stats);
  } catch (error) {
    logger.error(`Error al obtener estadísticas semanales: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const stats = await Stat.findAll({
      where: { type: 'monthly' },
      order: [['date', 'DESC']],
      limit: parseInt(months)
    });
    
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
    const appStats = await Task.findAll({
      attributes: [
        'appPackage',
        [fn('COUNT', '*'), 'totalTasks'],
        [fn('SUM', literal(`CASE WHEN status = 'completed' THEN 1 ELSE 0 END`)), 'completedTasks'],
        [fn('SUM', literal(`CASE WHEN status = 'failed' THEN 1 ELSE 0 END`)), 'failedTasks'],
        [fn('SUM', col('metrics.viewTime')), 'totalViewTime']
      ],
      where: {
        createdAt: { [Op.gte]: limitDate },
        status: { [Op.in]: ['completed', 'failed'] }
      },
      group: ['appPackage']
    });
    
    // Formatear resultados
    const formattedStats = appStats.map(stat => {
      const data = stat.get({ plain: true });
      const totalTasks = parseInt(data.totalTasks);
      const completedTasks = parseInt(data.completedTasks);
      
      return {
        appPackage: data.appPackage,
        totalTasks,
        completedTasks,
        failedTasks: parseInt(data.failedTasks),
        totalViewTime: parseInt(data.totalViewTime || 0),
        successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      };
    });
    
    res.json(formattedStats);
  } catch (error) {
    logger.error(`Error al obtener estadísticas por aplicación: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getPerformanceMetrics = async (req, res) => {
  try {
    // Obtener estadísticas generales
    const totalTasks = await Task.count();
    const completedTasks = await Task.count({ where: { status: 'completed' } });
    const failedTasks = await Task.count({ where: { status: 'failed' } });
    const pendingTasks = await Task.count({ where: { status: 'pending' } });
    
    // Obtener estadísticas de dispositivos
    const totalDevices = await Device.count();
    const activeDevices = await Device.count({ where: { isActive: true } });
    
    // Calcular tasa de éxito
    const successRate = totalTasks > 0
      ? (completedTasks / totalTasks) * 100
      : 0;
    
    // Obtener tiempo promedio de ejecución
    const avgExecution = await Task.findAll({
      attributes: [
        [fn('AVG', 
          literal('EXTRACT(EPOCH FROM ("completedAt" - "startTime"))')
        ), 'avgTime']
      ],
      where: {
        status: 'completed',
        startTime: { [Op.ne]: null },
        completedAt: { [Op.ne]: null }
      }
    });
    
    const avgExecutionTime = avgExecution.length > 0 
      ? parseFloat(avgExecution[0].getDataValue('avgTime') || 0)
      : 0;
    
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
        avgExecutionTime: avgExecutionTime.toFixed(2)
      }
    };
    
    res.json(metrics);
  } catch (error) {
    logger.error(`Error al obtener métricas de rendimiento: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};