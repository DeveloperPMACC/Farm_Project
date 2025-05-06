// src/controllers/deviceController.js
const { models } = require('../utils/database');
const { Device, ActivityLog } = models;
const { Op } = require('sequelize');
const deviceManager = require('../utils/deviceManager');
const logger = require('../utils/logger');

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.findAll({
      order: [['lastSeen', 'DESC']]
    });
    
    res.render('devices/index', { 
      title: 'Dispositivos', 
      devices 
    });
  } catch (error) {
    logger.error(`Error al obtener dispositivos: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveDevices = async (req, res) => {
  try {
    const devices = await Device.findAll({ 
      where: { isActive: true },
      order: [['lastSeen', 'DESC']]
    });
    
    res.json(devices);
  } catch (error) {
    logger.error(`Error al obtener dispositivos activos: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getDeviceById = async (req, res) => {
  try {
    const device = await Device.findOne({ 
      where: { deviceId: req.params.id }
    });
    
    if (!device) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    
    res.render('devices/detail', { 
      title: `Dispositivo ${device.deviceId}`, 
      device 
    });
  } catch (error) {
    logger.error(`Error al obtener dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.performDeviceAction = async (req, res) => {
  try {
    const { action } = req.body;
    const deviceId = req.params.id;
    
    if (!action) {
      return res.status(400).json({ error: 'Acción no especificada' });
    }
    
    let result;
    
    switch (action) {
      case 'unlock':
        result = await deviceManager.unlockScreen(deviceId);
        break;
      case 'reboot':
        result = await deviceManager.executeShellCommand(
          deviceId, 'reboot'
        );
        break;
      case 'home':
        result = await deviceManager.executeShellCommand(
          deviceId, 'input keyevent KEYCODE_HOME'
        );
        break;
      default:
        return res.status(400).json({ error: 'Acción no válida' });
    }
    
    if (result) {
      res.json({ success: true, message: `Acción ${action} ejecutada` });
    } else {
      res.status(500).json({ error: 'Error al ejecutar acción' });
    }
  } catch (error) {
    logger.error(`Error al ejecutar acción en dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getDeviceLogs = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const logs = await ActivityLog.findAll({ 
      where: { deviceId },
      order: [['timestamp', 'DESC']],
      limit: 50
    });
    
    res.json(logs);
  } catch (error) {
    logger.error(`Error al obtener logs de dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.takeScreenshot = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const screenshotPath = await deviceManager.takeScreenshot(deviceId);
    
    if (!screenshotPath) {
      return res.status(500).json({ error: 'Error al tomar captura de pantalla' });
    }
    
    res.sendFile(screenshotPath);
  } catch (error) {
    logger.error(`Error al tomar captura de pantalla: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { status, isActive, config } = req.body;
    
    const updateData = {};
    if (status) updateData.status = status;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (config) updateData.config = config;
    
    const [updated] = await Device.update(
      updateData,
      { where: { deviceId } }
    );
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    
    const device = await Device.findOne({ where: { deviceId } });
    res.json(device);
  } catch (error) {
    logger.error(`Error al actualizar dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.removeDevice = async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    const [updated] = await Device.update(
      { isActive: false, status: 'disconnected' },
      { where: { deviceId } }
    );
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }
    
    res.json({ success: true, message: 'Dispositivo desactivado' });
  } catch (error) {
    logger.error(`Error al eliminar dispositivo: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};