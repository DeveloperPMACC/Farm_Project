const StatisticsService = require('../services/statistics.service');
const logger = require('../utils/logger');

class StatisticsController {
  /**
   * Obtener resumen de estadísticas
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSummary(req, res, next) {
    try {
      const summary = await StatisticsService.getSummary();

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error al obtener resumen de estadísticas:', error);
      next(error);
    }
  }

  /**
   * Obtener estadísticas por dispositivo
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getByDevice(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await StatisticsService.getByDevice(id);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas del dispositivo ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Obtener estadísticas por aplicación
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getByApp(req, res, next) {
    try {
      const { id } = req.params;
      const stats = await StatisticsService.getByApp(id);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error(`Error al obtener estadísticas de la aplicación ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Obtener estadísticas por período
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getByPeriod(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await StatisticsService.getByPeriod(startDate, endDate);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error al obtener estadísticas por período:', error);
      next(error);
    }
  }

  /**
   * Registrar una nueva estadística
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async recordStat(req, res, next) {
    try {
      const statData = req.body;
      const stat = await StatisticsService.recordStat(statData);

      res.status(201).json({
        success: true,
        data: stat
      });
    } catch (error) {
      logger.error('Error al registrar estadística:', error);
      next(error);
    }
  }
}

module.exports = new StatisticsController();