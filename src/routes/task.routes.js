const express = require('express');
const taskController = require('../controllers/task.controller');
const { authenticateJWT, isAdmin } = require('../middlewares/auth.middleware');
const { validateTask, validateIdParam } = require('../middlewares/validation.middleware');

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateJWT);

// Rutas de tareas
router.get('/', taskController.getAllTasks);
router.get('/:id', validateIdParam, taskController.getTaskById);
router.post('/', validateTask, taskController.createTask);
router.put('/:id', validateIdParam, validateTask, taskController.updateTask);
router.delete('/:id', validateIdParam, isAdmin, taskController.deleteTask);

// Rutas para control de tareas
router.post('/:id/start', validateIdParam, taskController.startTask);
router.post('/:id/stop', validateIdParam, taskController.stopTask);

module.exports = router;