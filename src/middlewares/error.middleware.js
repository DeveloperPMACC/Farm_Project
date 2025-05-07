const logger = require('../utils/logger');

/**
 * Middleware para capturar errores de validación
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validationErrorHandler = (err, req, res, next) => {
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: err.errors
    });
  }

  next(err);
};

/**
 * Middleware para capturar errores 404
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Recurso no encontrado'
  });
};

/**
 * Middleware para errores generales
 * @param {Object} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Error no manejado:', err);

  // Evitar exponer detalles de errores al cliente en producción
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : err.message || 'Error interno del servidor';

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  validationErrorHandler,
  notFoundHandler,
  errorHandler
};