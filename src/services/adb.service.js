const adb = require('adbkit');
const config = require('../config');
const logger = require('../utils/logger');
const { spawn } = require('child_process');

class AdbService {
  constructor() {
    this.client = adb.createClient();
  }

  /**
   * Iniciar el servidor ADB
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async startServer() {
    try {
      logger.info('Iniciando servidor ADB...');

      return new Promise((resolve, reject) => {
        const adbProcess = spawn(config.adb.path, ['start-server']);

        adbProcess.on('close', (code) => {
          if (code === 0) {
            logger.info('Servidor ADB iniciado exitosamente');
            resolve(true);
          } else {
            logger.error(`Error al iniciar servidor ADB, código de salida: ${code}`);
            resolve(false);
          }
        });

        adbProcess.on('error', (error) => {
          logger.error('Error al iniciar proceso ADB:', error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Error al iniciar servidor ADB:', error);
      return false;
    }
  }

  /**
   * Detener el servidor ADB
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async killServer() {
    try {
      logger.info('Deteniendo servidor ADB...');

      return new Promise((resolve, reject) => {
        const adbProcess = spawn(config.adb.path, ['kill-server']);

        adbProcess.on('close', (code) => {
          if (code === 0) {
            logger.info('Servidor ADB detenido exitosamente');
            resolve(true);
          } else {
            logger.error(`Error al detener servidor ADB, código de salida: ${code}`);
            resolve(false);
          }
        });

        adbProcess.on('error', (error) => {
          logger.error('Error al detener proceso ADB:', error);
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Error al detener servidor ADB:', error);
      return false;
    }
  }

  /**
   * Listar dispositivos conectados
   * @returns {Promise<Array>} Lista de dispositivos
   */
  async listDevices() {
    try {
      const devices = await this.client.listDevices();
      return devices;
    } catch (error) {
      logger.error('Error al listar dispositivos ADB:', error);
      throw error;
    }
  }

  /**
   * Conectar a un dispositivo
   * @param {string} serial - Número de serie del dispositivo
   * @returns {Promise<boolean>} Resultado de la conexión
   */
  async connectDevice(serial) {
    try {
      // Si es una dirección IP, intentar conectar explícitamente
      if (serial.includes(':') || serial.includes('.')) {
        await this.client.connect(serial);
        logger.info(`Conectado exitosamente a ${serial}`);
        return true;
      }

      // Verificar si el dispositivo ya está conectado
      const devices = await this.listDevices();
      const isConnected = devices.some(device => device.id === serial);

      if (isConnected) {
        logger.info(`Dispositivo ${serial} ya está conectado`);
        return true;
      }

      logger.error(`No se pudo conectar al dispositivo ${serial}`);
      return false;
    } catch (error) {
      logger.error(`Error al conectar al dispositivo ${serial}:`, error);
      return false;
    }
  }

  /**
   * Ejecutar una aplicación en el dispositivo
   * @param {string} serial - Número de serie del dispositivo
   * @param {string} packageName - Nombre del paquete de la aplicación
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async startApp(serial, packageName) {
    try {
      await this.client.shell(serial, `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`);
      logger.info(`Aplicación ${packageName} iniciada en dispositivo ${serial}`);
      return true;
    } catch (error) {
      logger.error(`Error al iniciar aplicación ${packageName} en dispositivo ${serial}:`, error);
      return false;
    }
  }

  /**
   * Detener una aplicación en el dispositivo
   * @param {string} serial - Número de serie del dispositivo
   * @param {string} packageName - Nombre del paquete de la aplicación
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async stopApp(serial, packageName) {
    try {
      await this.client.shell(serial, `am force-stop ${packageName}`);
      logger.info(`Aplicación ${packageName} detenida en dispositivo ${serial}`);
      return true;
    } catch (error) {
      logger.error(`Error al detener aplicación ${packageName} en dispositivo ${serial}:`, error);
      return false;
    }
  }

  /**
   * Simular un toque en la pantalla
   * @param {string} serial - Número de serie del dispositivo
   * @param {number} x - Coordenada X
   * @param {number} y - Coordenada Y
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async tap(serial, x, y) {
    try {
      await this.client.shell(serial, `input tap ${x} ${y}`);
      logger.debug(`Tap en (${x}, ${y}) en dispositivo ${serial}`);
      return true;
    } catch (error) {
      logger.error(`Error al simular tap en dispositivo ${serial}:`, error);
      return false;
    }
  }

  /**
   * Simular un deslizamiento en la pantalla
   * @param {string} serial - Número de serie del dispositivo
   * @param {number} x1 - Coordenada X inicial
   * @param {number} y1 - Coordenada Y inicial
   * @param {number} x2 - Coordenada X final
   * @param {number} y2 - Coordenada Y final
   * @param {number} duration - Duración en milisegundos
   * @returns {Promise<boolean>} Resultado de la operación
   */
  async swipe(serial, x1, y1, x2, y2, duration = 300) {
    try {
      await this.client.shell(serial, `input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
      logger.debug(`Swipe de (${x1}, ${y1}) a (${x2}, ${y2}) en dispositivo ${serial}`);
      return true;
    } catch (error) {
      logger.error(`Error al simular swipe en dispositivo ${serial}:`, error);
      return false;
    }
  }

  /**
   * Capturar pantalla del dispositivo
   * @param {string} serial - Número de serie del dispositivo
   * @returns {Promise<Buffer>} Imagen en formato PNG
   */
  async screenshot(serial) {
    try {
      return await this.client.screencap(serial);
    } catch (error) {
      logger.error(`Error al capturar pantalla del dispositivo ${serial}:`, error);
      throw error;
    }
  }
}

module.exports = new AdbService();