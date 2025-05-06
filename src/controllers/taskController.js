// src/controllers/taskController.js
const { models } = require('../utils/database');
const { Task, Device } = models;
const { Op } = require('sequelize');
const actionExecutor = require('../utils/actionExecutor');
const logger = require('../utils/logger');
const config = require('../../config');

exports.getTasks = async (req, res) => {
  try {
    const { limit = 20, skip = 0, status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const tasks = await Task.findAll({
      where: query,
      order: [['createdAt', 'DESC']],
      offset: parseInt(skip),
      limit: parseInt(limit)
    });
    
    const total = await Task.count({ where: query });
    
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
    if (req.io) {
      req.io.emit('taskUpdate', { type: 'added', task });
    }
    
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
    
    const tasks = await Task.findAll({
      where: { status },
      order: [['createdAt', 'DESC']],
      offset: parseInt(skip),
      limit: parseInt(limit)
    });
    
    const total = await Task.count({ where: { status } });
    
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
    const task = await Task.findByPk(req.params.id, {
      include: [{ model: Device, as: 'device' }]
    });
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.render('tasks/detail', {
      title: `Tarea ${task.id}`,
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
    
    const [updated] = await Task.update(
      updateData,
      { where: { id: req.params.id } }
    );
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    const task = await Task.findByPk(req.params.id);
    
    // Notificar a los clientes conectados
    if (req.io) {
      req.io.emit('taskUpdate', { type: 'updated', task });
    }
    
    res.json(task);
  } catch (error) {
    logger.error(`Error al actualizar tarea: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const deleted = await Task.destroy({
      where: { id: req.params.id }
    });
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Notificar a los clientes conectados
    if (req.io) {
      req.io.emit('taskUpdate', { type: 'deleted', taskId: req.params.id });
    }
    
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (error) {
    logger.error(`Error al eliminar tarea: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.retryTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    // Resetear intentos fallidos y estado
    await task.update({
      failedAttempts: 0,
      status: 'pending',
      lastError: null
    });
    
    // Notificar a los clientes conectados
    if (req.io) {
      req.io.emit('taskUpdate', { type: 'retried', task });
    }
    
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
    
    // Usar una transacción para asegurar que todas las tareas se crean o ninguna
    const transaction = await models.sequelize.transaction();
    
    try {
      for (const taskData of tasks) {
        try {
          const { appPackage, videoUrls, priority } = taskData;
          
          if (!appPackage || !videoUrls) {
            errors.push({ taskData, error: 'Faltan datos requeridos' });
            continue;
          }
          
          const urls = Array.isArray(videoUrls) ? videoUrls : videoUrls.split(',');
          
          const task = await Task.create({
            appPackage,
            videoUrls: urls,
            priority: priority || config.tasks.defaultPriority,
            status: 'pending',
            createdAt: new Date()
          }, { transaction });
          
          createdTasks.push(task);
        } catch (error) {
          errors.push({ taskData, error: error.message });
        }
      }
      
      // Confirmar transacción
      await transaction.commit();
      
      // Notificar a los clientes conectados
      if (req.io) {
        createdTasks.forEach(task => {
          req.io.emit('taskUpdate', { type: 'added', task });
        });
      }
      
      res.json({
        success: true,
        created: createdTasks.length,
        errors: errors.length,
        tasks: createdTasks,
        errorDetails: errors
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Error al crear tareas en lote: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};