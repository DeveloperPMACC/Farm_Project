const DeviceService = require('../services/device.service');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class DeviceController {
  /**
   * Obtener todos los dispositivos
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllDevices(req, res, next) {
    try {
      const devices = await DeviceService.getAll();
      res.status(200).json({
        success: true,
        count: devices.length,
        data: devices
      });
    } catch (error) {
      logger.error('Error al obtener todos los dispositivos:', error);
      next(error);
    }
  }

  /**
   * Obtener un dispositivo por ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getDeviceById(req, res, next) {
    try {
      const { id } = req.params;
      const device = await DeviceService.getById(id);

      if (!device) {
        return res.status(404).json({ 
          success: false, 
          message: 'Dispositivo no encontrado' 
        });
      }

      res.status(200).json({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error(`Error al obtener dispositivo ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Crear un nuevo dispositivo
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createDevice(req, res, next) {
    try {
      // Validar la entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const deviceData = req.body;
      const device = await DeviceService.create(deviceData);

      res.status(201).json({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error('Error al crear dispositivo:', error);
      next(error);
    }
  }

  /**
   * Actualizar un dispositivo
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateDevice(req, res, next) {
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
      const deviceData = req.body;

      const device = await DeviceService.update(id, deviceData);

      res.status(200).json({
        success: true,
        data: device
      });
    } catch (error) {
      logger.error(`Error al actualizar dispositivo ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Eliminar un dispositivo
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteDevice(req, res, next) {
    try {
      const { id } = req.params;

      await DeviceService.delete(id);

      res.status(200).json({
        success: true,
        message: 'Dispositivo eliminado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al eliminar dispositivo ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Conectar a un dispositivo vía ADB
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async connectDevice(req, res, next) {
    try {
      const { id } = req.params;

      const result = await DeviceService.connect(id);

      res.status(200).json({
        success: true,
        message: 'Dispositivo conectado exitosamente',
        data: result
      });
    } catch (error) {
      logger.error(`Error al conectar dispositivo ${req.params.id}:`, error);
      next(error);
    }
  }
}

module.exports = new DeviceController();