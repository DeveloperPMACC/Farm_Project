// src/utils/deviceManager.js
const adb = require('adbkit');
const { exec } = require('child_process');
const config = require('../../config');
const logger = require('./logger');
const DeviceModel = require('../models/device');
const EventEmitter = require('events');

class DeviceManager extends EventEmitter {
  constructor() {
    super();
    this.client = adb.createClient({
      port: 5037,
      bin: config.adb.path
    });
    this.connectedDevices = new Map();
    this.isRefreshing = false;
  }

  /**
   * Inicializa el gestor de dispositivos
   */
  async initialize() {
    logger.info('Inicializando gestor de dispositivos');
    
    try {
      // Asegurarse de que el servidor ADB está en ejecución
      await this.startAdbServer();
      
      // Iniciar monitoreo de dispositivos
      this.startDeviceMonitoring();
      
      // Programar verificaciones periódicas de salud
      setInterval(() => this.checkDevicesHealth(), 
        config.advanced.deviceHealthCheckInterval);
      
      logger.info('Gestor de dispositivos inicializado correctamente');
    } catch (error) {
      logger.error(`Error al inicializar el gestor de dispositivos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inicia el servidor ADB si no está en ejecución
   */
  async startAdbServer() {
    try {
      await this.client.startServer();
      logger.info('Servidor ADB iniciado correctamente');
    } catch (error) {
      logger.warn(`No se pudo iniciar el servidor ADB: ${error.message}`);
      logger.info('Intentando iniciar ADB manualmente...');
      
      return new Promise((resolve, reject) => {
        exec('adb start-server', (error, stdout, stderr) => {
          if (error) {
            logger.error(`Error al iniciar ADB manualmente: ${error.message}`);
            return reject(error);
          }
          logger.info('Servidor ADB iniciado manualmente con éxito');
          resolve();
        });
      });
    }
  }

  /**
   * Inicia el monitoreo de dispositivos
   */
  startDeviceMonitoring() {
    // Monitoreo en tiempo real de conexión/desconexión
    this.client.trackDevices()
      .then(tracker => {
        tracker.on('add', device => {
          logger.info(`Dispositivo conectado: ${device.id}`);
          this.addDevice(device.id);
        });
        
        tracker.on('remove', device => {
          logger.info(`Dispositivo desconectado: ${device.id}`);
          this.removeDevice(device.id);
        });
        
        tracker.on('end', () => {
          logger.warn('El rastreador de dispositivos finalizó, reiniciando...');
          setTimeout(() => this.startDeviceMonitoring(), 5000);
        });
        
        tracker.on('error', error => {
          logger.error(`Error en el rastreador de dispositivos: ${error.message}`);
          setTimeout(() => this.startDeviceMonitoring(), 5000);
        });
      })
      .catch(error => {
        logger.error(`Error al iniciar el rastreador de dispositivos: ${error.message}`);
        setTimeout(() => this.startDeviceMonitoring(), 5000);
      });
      
    // Además, realizar escaneos periódicos para refrescar la lista
    setInterval(() => this.refreshDeviceList(), config.adb.deviceRefreshInterval);
  }

  /**
   * Refresca la lista de dispositivos conectados
   */
  async refreshDeviceList() {
    if (this.isRefreshing) return;
    
    this.isRefreshing = true;
    logger.debug('Refrescando lista de dispositivos...');
    
    try {
      const devices = await this.client.listDevices();
      logger.info(`Encontrados ${devices.length} dispositivos conectados`);
      
      // Registrar dispositivos nuevos
      for (const device of devices) {
        if (!this.connectedDevices.has(device.id)) {
          this.addDevice(device.id);
        }
      }
      
      // Marcar como desconectados los que ya no están
      const connectedIds = devices.map(d => d.id);
      for (const [deviceId, deviceInfo] of this.connectedDevices.entries()) {
        if (!connectedIds.includes(deviceId) && deviceInfo.status !== 'disconnected') {
          this.removeDevice(deviceId);
        }
      }
      
      this.isRefreshing = false;
    } catch (error) {
      logger.error(`Error al refrescar la lista de dispositivos: ${error.message}`);
      this.isRefreshing = false;
    }
  }

  /**
   * Añade un nuevo dispositivo a la base de datos y al mapa en memoria
   */
  async addDevice(deviceId) {
    try {
      // Obtener información detallada del dispositivo
      const deviceInfo = await this.getDeviceInfo(deviceId);
      
      // Actualizar o crear en la base de datos
      const updatedDevice = await DeviceModel.findOneAndUpdate(
        { deviceId },
        {
          deviceId,
          model: deviceInfo.model,
          androidVersion: deviceInfo.androidVersion,
          status: 'idle',
          batteryLevel: deviceInfo.batteryLevel,
          lastSeen: new Date(),
          isActive: true
        },
        { upsert: true, new: true }
      );
      
      // Guardar en memoria
      this.connectedDevices.set(deviceId, {
        ...deviceInfo,
        status: 'idle',
        lastSeen: new Date(),
        isActive: true
      });
      
      // Emitir evento
      this.emit('deviceAdded', updatedDevice);
      
      logger.info(`Dispositivo registrado/actualizado: ${deviceId} (${deviceInfo.model})`);
    } catch (error) {
      logger.error(`Error al añadir dispositivo ${deviceId}: ${error.message}`);
    }
  }

  /**
   * Marca un dispositivo como desconectado
   */
  async removeDevice(deviceId) {
    try {
      // Actualizar en base de datos
      await DeviceModel.findOneAndUpdate(
        { deviceId },
        {
          status: 'disconnected',
          isActive: false
        }
      );
      
      // Actualizar en memoria si existe
      if (this.connectedDevices.has(deviceId)) {
        const deviceInfo = this.connectedDevices.get(deviceId);
        deviceInfo.status = 'disconnected';
        deviceInfo.isActive = false;
        this.connectedDevices.set(deviceId, deviceInfo);
      }
      
      // Emitir evento
      this.emit('deviceRemoved', { deviceId });
      
      logger.info(`Dispositivo marcado como desconectado: ${deviceId}`);
    } catch (error) {
      logger.error(`Error al marcar dispositivo ${deviceId} como desconectado: ${error.message}`);
    }
  }

  /**
   * Obtiene información detallada de un dispositivo
   */
  async getDeviceInfo(deviceId) {
    try {
      // Obtener modelo
      const model = await this.executeShellCommand(
        deviceId, 'getprop ro.product.model'
      );
      
      // Obtener versión de Android
      const androidVersion = await this.executeShellCommand(
        deviceId, 'getprop ro.build.version.release'
      );
      
      // Obtener nivel de batería
      const batteryInfo = await this.executeShellCommand(
        deviceId, 'dumpsys battery'
      );
      
      // Extraer nivel de batería del resultado
      let batteryLevel = '0';
      const match = batteryInfo.match(/level:\s*(\d+)/);
      if (match && match[1]) {
        batteryLevel = match[1];
      }
      
      return {
        model: model.trim(),
        androidVersion: androidVersion.trim(),
        batteryLevel: parseInt(batteryLevel.trim(), 10),
        deviceId
      };
    } catch (error) {
      logger.error(`Error al obtener información del dispositivo ${deviceId}: ${error.message}`);
      // Devolver información por defecto
      return {
        model: 'Unknown',
        androidVersion: 'Unknown',
        batteryLevel: 0,
        deviceId
      };
    }
  }

  /**
   * Ejecuta un comando shell en un dispositivo
   */
  async executeShellCommand(deviceId, command) {
    try {
      const stream = await this.client.shell(deviceId, command);
      return await adb.util.readAll(stream);
    } catch (error) {
      logger.error(`Error al ejecutar comando en dispositivo ${deviceId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica el estado de salud de los dispositivos conectados
   */
  async checkDevicesHealth() {
    logger.debug('Verificando salud de los dispositivos...');
    
    for (const [deviceId, deviceInfo] of this.connectedDevices.entries()) {
      if (deviceInfo.status === 'disconnected') continue;
      
      try {
        // Verificar si el dispositivo está realmente conectado
        const isConnected = await this.isDeviceConnected(deviceId);
        
        if (!isConnected) {
          logger.warn(`Dispositivo ${deviceId} no responde, marcando como desconectado`);
          this.removeDevice(deviceId);
          continue;
        }
        
        // Actualizar información de batería
        const newBatteryInfo = await this.executeShellCommand(
          deviceId, 'dumpsys battery'
        );
        
        let newBatteryLevel = 0;
        const match = newBatteryInfo.match(/level:\s*(\d+)/);
        if (match && match[1]) {
          newBatteryLevel = parseInt(match[1], 10);
        }
        
        // Si batería baja, advertir
        if (newBatteryLevel < 20) {
          logger.warn(`Batería baja en dispositivo ${deviceId}: ${newBatteryLevel}%`);
          
          // Si batería extremadamente baja, suspender uso
          if (newBatteryLevel < 5) {
            logger.error(`Batería crítica en dispositivo ${deviceId}, suspendiendo uso`);
            
            await DeviceModel.findOneAndUpdate(
              { deviceId },
              { status: 'battery_critical', batteryLevel: newBatteryLevel }
            );
            
            deviceInfo.status = 'battery_critical';
            deviceInfo.batteryLevel = newBatteryLevel;
            this.connectedDevices.set(deviceId, deviceInfo);
            
            this.emit('deviceUpdated', { 
              deviceId, 
              status: 'battery_critical',
              batteryLevel: newBatteryLevel 
            });
            
            continue;
          }
        }
        
        // Actualizar datos en memoria y BD
        deviceInfo.batteryLevel = newBatteryLevel;
        deviceInfo.lastSeen = new Date();
        this.connectedDevices.set(deviceId, deviceInfo);
        
        await DeviceModel.findOneAndUpdate(
          { deviceId },
          { batteryLevel: newBatteryLevel, lastSeen: new Date() }
        );
        
        logger.debug(`Dispositivo ${deviceId} saludable, batería: ${newBatteryLevel}%`);
      } catch (error) {
        logger.error(`Error al verificar dispositivo ${deviceId}: ${error.message}`);
      }
    }
  }

  /**
   * Verifica si un dispositivo está conectado
   */
  async isDeviceConnected(deviceId) {
    try {
      await this.client.getState(deviceId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene un dispositivo disponible para ejecutar tareas
   */
  async getAvailableDevice() {
    try {
      // Primero buscar en la memoria
      for (const [deviceId, deviceInfo] of this.connectedDevices.entries()) {
        if (deviceInfo.status === 'idle' && deviceInfo.isActive) {
          return deviceId;
        }
      }
      
      // Si no hay dispositivos disponibles en memoria, verificar la BD
      const availableDevice = await DeviceModel.findOne({
        status: 'idle',
        isActive: true
      }).sort({ lastTaskTime: 1 }); // Primero el que lleva más tiempo sin usar
      
      return availableDevice ? availableDevice.deviceId : null;
    } catch (error) {
      logger.error(`Error al buscar dispositivo disponible: ${error.message}`);
      return null;
    }
  }

  /**
   * Actualiza el estado de un dispositivo
   */
  async updateDeviceStatus(deviceId, status, taskId = null, errorMessage = null) {
    try {
      const updateData = {
        status,
        lastSeen: new Date()
      };
      
      if (taskId) updateData.currentTaskId = taskId;
      if (errorMessage) updateData.errorMessage = errorMessage;
      if (status === 'idle') updateData.lastTaskTime = new Date();
      
      // Actualizar en BD
      const updatedDevice = await DeviceModel.findOneAndUpdate(
        { deviceId },
        updateData,
        { new: true }
      );
      
      // Actualizar en memoria
      if (this.connectedDevices.has(deviceId)) {
        const deviceInfo = this.connectedDevices.get(deviceId);
        Object.assign(deviceInfo, updateData);
        this.connectedDevices.set(deviceId, deviceInfo);
      }
      
      // Emitir evento
      this.emit('deviceUpdated', updatedDevice);
      
      logger.info(`Estado del dispositivo ${deviceId} actualizado a: ${status}`);
      return true;
    } catch (error) {
      logger.error(`Error al actualizar estado del dispositivo ${deviceId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Desbloquea la pantalla de un dispositivo
   */
  async unlockScreen(deviceId) {
    try {
      // Despertar pantalla
      await this.executeShellCommand(deviceId, 'input keyevent KEYCODE_WAKEUP');
      // Desbloquear (para dispositivos sin contraseña)
      await this.executeShellCommand(deviceId, 'input keyevent 82');
      logger.debug(`Pantalla desbloqueada en dispositivo ${deviceId}`);
      return true;
    } catch (error) {
      logger.error(`Error al desbloquear pantalla del dispositivo ${deviceId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Realiza una captura de pantalla para diagnóstico
   */
  async takeScreenshot(deviceId) {
    try {
      const timestamp = Date.now();
      const screenshotPath = `/tmp/screenshot_${deviceId}_${timestamp}.png`;
      
      // Tomar screenshot en el dispositivo
      await this.executeShellCommand(
        deviceId, 
        `screencap -p /sdcard/screenshot_temp.png`
      );
      
      // Transferir al servidor
      await this.client.pull(
        deviceId, 
        '/sdcard/screenshot_temp.png', 
        screenshotPath
      );
      
      // Eliminar del dispositivo
      await this.executeShellCommand(
        deviceId, 
        `rm /sdcard/screenshot_temp.png`
      );
      
      logger.info(`Captura de pantalla guardada: ${screenshotPath}`);
      return screenshotPath;
    } catch (error) {
      logger.error(`Error al tomar captura de pantalla del dispositivo ${deviceId}: ${error.message}`);
      return null;
    }
  }
}

// Exportar una instancia singleton
const deviceManager = new DeviceManager();
module.exports = deviceManager;
