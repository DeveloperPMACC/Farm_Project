const express = require('express');
const deviceController = require('../controllers/device.controller');
const { authenticateJWT, isAdmin } = require('../middlewares/auth.middleware');
const { validateDevice, validateIdParam } = require('../middlewares/validation.middleware');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Rutas de dispositivos
router.get('/', deviceController.getAllDevices);
router.get('/:id', validateIdParam, deviceController.getDeviceById);
router.post('/', validateDevice, deviceController.createDevice);
router.put('/:id', validateIdParam, validateDevice, deviceController.updateDevice);
router.delete('/:id', validateIdParam, isAdmin, deviceController.deleteDevice);

// Ruta para conectar a un dispositivo
router.post('/:id/connect', validateIdParam, deviceController.connectDevice);

module.exports = router;