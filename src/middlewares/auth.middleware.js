const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware para autenticación JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateJWT = (req, res, next) => {
  // Obtener el token del header de autorización
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No se proporcionó token de autenticación'
    });
  }

  // Formato: Bearer <token>
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido'
    });
  }

  // Verificar el token
  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }

    // Guardar el usuario en el objeto request
    req.user = decoded;
    next();
  });
};

/**
 * Middleware para verificar rol de administrador
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Acceso denegado: se requiere rol de administrador'
    });
  }
};

/**
 * Middleware para verificar si el usuario existe y está activo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    next();
  } catch (error) {
    logger.error('Error al verificar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar usuario'
    });
  }
};

module.exports = {
  authenticateJWT,
  isAdmin,
  checkUser
};