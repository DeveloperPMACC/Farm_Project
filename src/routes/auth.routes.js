const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticateJWT, checkUser, isAdmin } = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin, validatePasswordUpdate } = require('../middlewares/validation.middleware');

const router = express.Router();

// Rutas públicas
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Rutas protegidas
router.get('/profile', authenticateJWT, checkUser, authController.getProfile);
router.put('/password', authenticateJWT, checkUser, validatePasswordUpdate, authController.updatePassword);

module.exports = router;