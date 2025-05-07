const { Task, Device, App } = require('../models');
const AdbService = require('./adb.service');
const logger = require('../utils/logger');

class TaskService {
  /**
   * Obtener todas las tareas
   * @returns {Promise<Array>} Lista de tareas
   */
  async getAll() {
    try {
      return await Task.findAll({
        include: [
          {
            model: Device,
            as: 'device'
          },
          {
            model: App,
            as: 'app'
          }
        ]
      });
    } catch (error) {
      logger.error('Error al obtener tareas:', error);
      throw error;
    }
  }

  /**
   * Obtener una tarea por ID
   * @param {string} id - ID de la tarea
   * @returns {Promise<Object>} Tarea encontrada
   */
  async getById(id) {
    try {
      return await Task.findByPk(id, {
        include: [
          {
            model: Device,
            as: 'device'
          },
          {
            model: App,
            as: 'app'
          }
        ]
      });
    } catch (error) {
      logger.error(`Error al obtener tarea ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear una nueva tarea
   * @param {Object} taskData - Datos de la tarea
   * @returns {Promise<Object>} Tarea creada
   */
  async create(taskData) {
    try {
      // Verificar si el dispositivo existe
      const device = await Device.findByPk(taskData.deviceId);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      // Verificar si la aplicación existe
      const app = await App.findByPk(taskData.appId);
      if (!app) {
        throw new Error('Aplicación no encontrada');
      }

      return await Task.create(taskData);
    } catch (error) {
      logger.error('Error al crear tarea:', error);
      throw error;
    }
  }

  /**
   * Actualizar una tarea
   * @param {string} id - ID de la tarea
   * @param {Object} taskData - Datos actualizados
   * @returns {Promise<Object>} Tarea actualizada
   */
  async update(id, taskData) {
    try {
      const task = await Task.findByPk(id);
      if (!task) {
        throw new Error('Tarea no encontrada');
      }

      return await task.update(taskData);
    } catch (error) {
      logger.error(`Error al actualizar tarea ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar una tarea
   * @param {string} id - ID de la tarea
   * @returns {Promise<Object>} Resultado de la operación
   */
  async delete(id) {
    try {
      const task = await Task.findByPk(id);
      if (!task) {
        throw new Error('Tarea no encontrada');
      }

      await task.destroy();
      return { success: true };
    } catch (error) {
      logger.error(`Error al eliminar tarea ${id}:`, error);
      throw error;
    }
  }

  /**
   * Iniciar una tarea
   * @param {string} id - ID de la tarea
   * @returns {Promise<Object>} Resultado de la operación
   */
  async start(id) {
    try {
      const task = await Task.findByPk(id, {
        include: [
          {
            model: Device,
            as: 'device'
          },
          {
            model: App,
            as: 'app'
          }
        ]
      });

      if (!task) {
        throw new Error('Tarea no encontrada');
      }

      if (task.status === 'running') {
        throw new Error('La tarea ya está en ejecución');
      }

      // Verificar si el dispositivo está disponible
      if (task.device.status !== 'online') {
        throw new Error('El dispositivo no está disponible');
      }

      // Iniciar la aplicación en el dispositivo
      const appStarted = await AdbService.startApp(task.device.serial, task.app.packageName);

      if (!appStarted) {
        throw new Error('No se pudo iniciar la aplicación en el dispositivo');
      }

      // Actualizar el estado de la tarea
      await task.update({
        status: 'running',
        startTime: new Date()
      });

      // Actualizar el estado del dispositivo
      await task.device.update({
        status: 'working'
      });

      return {
        success: true,
        task
      };
    } catch (error) {
      logger.error(`Error al iniciar tarea ${id}:`, error);
      throw error;
    }
  }

  /**
   * Detener una tarea
   * @param {string} id - ID de la tarea
   * @returns {Promise<Object>} Resultado de la operación
   */
  async stop(id) {
    try {
      const task = await Task.findByPk(id, {
        include: [
          {
            model: Device,
            as: 'device'
          },
          {
            model: App,
            as: 'app'
          }
        ]
      });

      if (!task) {
        throw new Error('Tarea no encontrada');
      }

      if (task.status !== 'running') {
        throw new Error('La tarea no está en ejecución');
      }

      // Detener la aplicación en el dispositivo
      await AdbService.stopApp(task.device.serial, task.app.packageName);

      // Actualizar el estado de la tarea
      await task.update({
        status: 'completed',
        endTime: new Date()
      });

      // Actualizar el estado del dispositivo
      await task.device.update({
        status: 'online'
      });

      return {
        success: true,
        task
      };
    } catch (error) {
      logger.error(`Error al detener tarea ${id}:`, error);
      throw error;
    }
  }

  /**
   * Obtener tareas por dispositivo
   * @param {string} deviceId - ID del dispositivo
   * @returns {Promise<Array>} Lista de tareas
   */
  async getByDevice(deviceId) {
    try {
      return await Task.findAll({
        where: {
          deviceId
        },
        include: [
          {
            model: App,
            as: 'app'
          }
        ]
      });
    } catch (error) {
      logger.error(`Error al obtener tareas del dispositivo ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener tareas pendientes
   * @returns {Promise<Array>} Lista de tareas pendientes
   */
  async getPending() {
    try {
      return await Task.findAll({
        where: {
          status: 'pending'
        },
        include: [
          {
            model: Device,
            as: 'device'
          },
          {
            model: App,
            as: 'app'
          }
        ],
        order: [
          ['priority', 'DESC'],
          ['createdAt', 'ASC']
        ]
      });
    } catch (error) {
      logger.error('Error al obtener tareas pendientes:', error);
      throw error;
    }
  }
}

module.exports = new TaskService();