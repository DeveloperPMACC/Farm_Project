const { Device, App } = require('../models');
const AdbService = require('./adb.service');
const logger = require('../utils/logger');

class DeviceService {
  /**
   * Obtener todos los dispositivos
   * @returns {Promise<Array>} Lista de dispositivos
   */
  async getAll() {
    try {
      return await Device.findAll({
        include: [{
          model: App,
          as: 'installedApps'
        }]
      });
    } catch (error) {
      logger.error('Error al obtener dispositivos:', error);
      throw error;
    }
  }

  /**
   * Obtener un dispositivo por ID
   * @param {string} id - ID del dispositivo
   * @returns {Promise<Object>} Dispositivo encontrado
   */
  async getById(id) {
    try {
      return await Device.findByPk(id, {
        include: [{
          model: App,
          as: 'installedApps'
        }]
      });
    } catch (error) {
      logger.error(`Error al obtener dispositivo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Crear un nuevo dispositivo
   * @param {Object} deviceData - Datos del dispositivo
   * @returns {Promise<Object>} Dispositivo creado
   */
  async create(deviceData) {
    try {
      return await Device.create(deviceData);
    } catch (error) {
      logger.error('Error al crear dispositivo:', error);
      throw error;
    }
  }

  /**
   * Actualizar un dispositivo
   * @param {string} id - ID del dispositivo
   * @param {Object} deviceData - Datos actualizados
   * @returns {Promise<Object>} Dispositivo actualizado
   */
  async update(id, deviceData) {
    try {
      const device = await Device.findByPk(id);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      return await device.update(deviceData);
    } catch (error) {
      logger.error(`Error al actualizar dispositivo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Eliminar un dispositivo
   * @param {string} id - ID del dispositivo
   * @returns {Promise<Object>} Resultado de la operación
   */
  async delete(id) {
    try {
      const device = await Device.findByPk(id);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      await device.destroy();
      return { success: true };
    } catch (error) {
      logger.error(`Error al eliminar dispositivo ${id}:`, error);
      throw error;
    }
  }

  /**
   * Conectar a un dispositivo vía ADB
   * @param {string} id - ID del dispositivo
   * @returns {Promise<Object>} Resultado de la conexión
   */
  async connect(id) {
    try {
      const device = await Device.findByPk(id);
      if (!device) {
        throw new Error('Dispositivo no encontrado');
      }

      const connected = await AdbService.connectDevice(device.serial);

      if (connected) {
        await device.update({
          status: 'online',
          lastConnection: new Date()
        });

        return {
          connected: true,
          device
        };
      }

      return {
        connected: false,
        message: 'No se pudo conectar al dispositivo'
      };
    } catch (error) {
      logger.error(`Error al conectar dispositivo ${id}:`, error);
      throw error;
    }
  }
}

module.exports = new DeviceService();