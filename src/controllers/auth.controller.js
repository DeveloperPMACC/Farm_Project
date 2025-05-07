const AuthService = require('../services/auth.service');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Registrar un nuevo usuario
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async register(req, res, next) {
    try {
      // Validar la entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userData = req.body;
      const result = await AuthService.register(userData);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      logger.error('Error al registrar usuario:', error);
      next(error);
    }
  }

  /**
   * Iniciar sesión
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async login(req, res, next) {
    try {
      // Validar la entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { username, password } = req.body;
      const result = await AuthService.login(username, password);

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      logger.error('Error al iniciar sesión:', error);

      // Error específico para credenciales inválidas
      if (error.message === 'Credenciales inválidas') {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      next(error);
    }
  }

  /**
   * Obtener el perfil del usuario actual
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await AuthService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Error al obtener perfil de usuario:', error);
      next(error);
    }
  }

  /**
   * Actualizar la contraseña del usuario
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updatePassword(req, res, next) {
    try {
      // Validar la entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      await AuthService.updatePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      logger.error('Error al actualizar contraseña:', error);

      // Error específico para contraseña actual incorrecta
      if (error.message === 'Contraseña actual incorrecta') {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      next(error);
    }
  }
}

module.exports = new AuthController();