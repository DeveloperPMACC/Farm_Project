const { Statistic, Device, App, Task, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class StatisticsService {
  /**
   * Obtener resumen de estadísticas
   * @returns {Promise<Object>} Resumen de estadísticas
   */
  async getSummary() {
    try {
      // Total de tiempo de visualización
      const totalViewTime = await Statistic.sum('viewTime');

      // Total de interacciones
      const totalInteractions = await Statistic.sum('interactions');

      // Estadísticas por aplicación
      const statsByApp = await Statistic.findAll({
        attributes: [
          'appId',
          [sequelize.fn('SUM', sequelize.col('viewTime')), 'totalViewTime'],
          [sequelize.fn('SUM', sequelize.col('interactions')), 'totalInteractions'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: App,
            as: 'app',
            attributes: ['name', 'packageName']
          }
        ],
        group: ['appId', 'app.id'],
        order: [[sequelize.literal('totalViewTime'), 'DESC']]
      });

      // Estadísticas por dispositivo
      const statsByDevice = await Statistic.findAll({
        attributes: [
          'deviceId',
          [sequelize.fn('SUM', sequelize.col('viewTime')), 'totalViewTime'],
          [sequelize.fn('SUM', sequelize.col('interactions')), 'totalInteractions'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        include: [
          {
            model: Device,
            as: 'device',
            attributes: ['name', 'serial']
          }
        ],
        group: ['deviceId', 'device.id'],
        order: [[sequelize.literal('totalViewTime'), 'DESC']]
      });

      // Actividad reciente
      const recentActivity = await Statistic.findAll({
        include: [
          {
            model: Device,
            as: 'device',
            attributes: ['name', 'serial']
          },
          {
            model: App,
            as: 'app',
            attributes: ['name', 'packageName']
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: 10
      });

      return {
        totalViewTime,
        totalInteractions,
        statsByApp,
        statsByDevice,
        recentActivity
      };
    } catch (error) {
      logger.error('Error al obtener resumen de estadísticas:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas por dispositivo
   * @param {string} deviceId - ID del dispositivo
   * @returns {Promise<Object>} Estadísticas del dispositivo
   */
  async getByDevice(deviceId) {
    try {
      // Verificar si el dispositivo existe
      const device = await Device.findByPk(deviceId);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      // Total de tiempo de visualización para este dispositivo
      const totalViewTime = await Statistic.sum('viewTime', {
        where: { deviceId }
      });

      // Total de interacciones para este dispositivo
      const totalInteractions = await Statistic.sum('interactions', {
        where: { deviceId }
      });

      // Estadísticas por aplicación para este dispositivo
      const statsByApp = await Statistic.findAll({
        attributes: [
          'appId',
          [sequelize.fn('SUM', sequelize.col('viewTime')), 'totalViewTime'],
          [sequelize.fn('SUM', sequelize.col('interactions')), 'totalInteractions'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { deviceId },
        include: [
          {
            model: App,
            as: 'app',
            attributes: ['name', 'packageName']
          }
        ],
        group: ['appId', 'app.id'],
        order: [[sequelize.literal('totalViewTime'), 'DESC']]
      });

      // Actividad reciente para este dispositivo
      const recentActivity = await Statistic.findAll({
        where: { deviceId },
        include: [
          {
            model: App,
            as: 'app',
            attributes: ['name', 'packageName']
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: 10
      });

      return {
        device,
        totalViewTime,
        totalInteractions,
        statsByApp,
        recentActivity
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas del dispositivo ${deviceId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas por aplicación
   * @param {string} appId - ID de la aplicación
   * @returns {Promise<Object>} Estadísticas de la aplicación
   */
  async getByApp(appId) {
    try {
      // Verificar si la aplicación existe
      const app = await App.findByPk(appId);
      if (!app) {
        throw new Error('Aplicación no encontrada');
      }

      // Total de tiempo de visualización para esta aplicación
      const totalViewTime = await Statistic.sum('viewTime', {
        where: { appId }
      });

      // Total de interacciones para esta aplicación
      const totalInteractions = await Statistic.sum('interactions', {
        where: { appId }
      });

      // Estadísticas por dispositivo para esta aplicación
      const statsByDevice = await Statistic.findAll({
        attributes: [
          'deviceId',
          [sequelize.fn('SUM', sequelize.col('viewTime')), 'totalViewTime'],
          [sequelize.fn('SUM', sequelize.col('interactions')), 'totalInteractions'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: { appId },
        include: [
          {
            model: Device,
            as: 'device',
            attributes: ['name', 'serial']
          }
        ],
        group: ['deviceId', 'device.id'],
        order: [[sequelize.literal('totalViewTime'), 'DESC']]
      });

      // Actividad reciente para esta aplicación
      const recentActivity = await Statistic.findAll({
        where: { appId },
        include: [
          {
            model: Device,
            as: 'device',
            attributes: ['name', 'serial']
          }
        ],
        order: [['timestamp', 'DESC']],
        limit: 10
      });

      return {
        app,
        totalViewTime,
        totalInteractions,
        statsByDevice,
        recentActivity
      };
    } catch (error) {
      logger.error(`Error al obtener estadísticas de la aplicación ${appId}:`, error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas por período
   * @param {string} startDate - Fecha de inicio
   * @param {string} endDate - Fecha de fin
   * @returns {Promise<Object>} Estadísticas del período
   */
  async getByPeriod(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validar fechas
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Fechas inválidas');
      }

      // Estadísticas para el período especificado
      const stats = await Statistic.findAll({
        where: {
          timestamp: {
            [Op.between]: [start, end]
          }
        },
        include: [
          {
            model: Device,
            as: 'device',
            attributes: ['name', 'serial']
          },
          {
            model: App,
            as: 'app',
            attributes: ['name', 'packageName']
          }
        ],
        order: [['timestamp', 'ASC']]
      });

      // Total de tiempo de visualización para este período
      const totalViewTime = await Statistic.sum('viewTime', {
        where: {
          timestamp: {
            [Op.between]: [start, end]
          }
        }
      });

      // Total de interacciones para este período
      const totalInteractions = await Statistic.sum('interactions', {
        where: {
          timestamp: {
            [Op.between]: [start, end]
          }
        }
      });

      // Estadísticas por día
      const statsByDay = await Statistic.findAll({
        attributes: [
          [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
          [sequelize.fn('SUM', sequelize.col('viewTime')), 'totalViewTime'],
          [sequelize.fn('SUM', sequelize.col('interactions')), 'totalInteractions'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          timestamp: {
            [Op.between]: [start, end]
          }
        },
        group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
        order: [[sequelize.literal('date'), 'ASC']]
      });

      return {
        period: {
          start,
          end
        },
        totalViewTime,
        totalInteractions,
        statsByDay,
        stats
      };
    } catch (error) {
      logger.error('Error al obtener estadísticas por período:', error);
      throw error;
    }
  }

  /**
   * Registrar una nueva estadística
   * @param {Object} statData - Datos de la estadística
   * @returns {Promise<Object>} Estadística registrada
   */
  async recordStat(statData) {
    try {
      return await Statistic.create({
        ...statData,
        timestamp: statData.timestamp || new Date()
      });
    } catch (error) {
      logger.error('Error al registrar estadística:', error);
      throw error;
    }
  }
}

module.exports = new StatisticsService();