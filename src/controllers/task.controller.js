const TaskService = require('../services/task.service');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class TaskController {
  /**
   * Obtener todas las tareas
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllTasks(req, res, next) {
    try {
      const tasks = await TaskService.getAll();
      res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
      });
    } catch (error) {
      logger.error('Error al obtener todas las tareas:', error);
      next(error);
    }
  }

  /**
   * Obtener una tarea por ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const task = await TaskService.getById(id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: 'Tarea no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error(`Error al obtener tarea ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Crear una nueva tarea
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createTask(req, res, next) {
    try {
      // Validar la entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const taskData = req.body;
      const task = await TaskService.create(taskData);

      res.status(201).json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Error al crear tarea:', error);
      next(error);
    }
  }

  /**
   * Actualizar una tarea
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateTask(req, res, next) {
    try {
      // Validar la entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const taskData = req.body;

      const task = await TaskService.update(id, taskData);

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error(`Error al actualizar tarea ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Eliminar una tarea
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;

      await TaskService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Tarea eliminada exitosamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar tarea ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Iniciar una tarea
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async startTask(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TaskService.start(id);

      res.status(200).json({
        success: true,
        message: 'Tarea iniciada exitosamente',
        data: result
      });
    } catch (error) {
      logger.error(`Error al iniciar tarea ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Detener una tarea
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async stopTask(req, res, next) {
    try {
      const { id } = req.params;

      const result = await TaskService.stop(id);

      res.status(200).json({
        success: true,
        message: 'Tarea detenida exitosamente',
        data: result
      });
    } catch (error) {
      logger.error(`Error al detener tarea ${req.params.id}:`, error);
      next(error);
    }
  }
}

module.exports = new TaskController();