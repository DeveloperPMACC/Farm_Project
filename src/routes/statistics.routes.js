const express = require('express');
const statisticsController = require('../controllers/statistics.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');
const { validateIdParam, validatePeriodParams } = require('../middlewares/validation.middleware');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Rutas de estadísticas
router.get('/summary', statisticsController.getSummary);
router.get('/device/:id', validateIdParam, statisticsController.getByDevice);
router.get('/app/:id', validateIdParam, statisticsController.getByApp);
router.get('/period', validatePeriodParams, statisticsController.getByPeriod);
router.post('/', statisticsController.recordStat);

module.exports = router;