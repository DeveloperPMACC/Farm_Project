const { body, param, query, validationResult } = require('express-validator');

/**
 * Validación para crear/actualizar dispositivo
 */
const validateDevice = [
  body('serial')
    .notEmpty().withMessage('El número de serie es requerido')
    .isString().withMessage('El número de serie debe ser una cadena de texto'),

  body('name')
    .notEmpty().withMessage('El nombre es requerido')
    .isString().withMessage('El nombre debe ser una cadena de texto'),

  body('status')
    .optional()
    .isIn(['online', 'offline', 'working', 'error']).withMessage('Estado inválido'),

  body('settings')
    .optional()
    .isObject().withMessage('La configuración debe ser un objeto'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validación para crear/actualizar tarea
 */
const validateTask = [
  body('deviceId')
    .notEmpty().withMessage('El ID del dispositivo es requerido')
    .isUUID().withMessage('El ID del dispositivo debe ser un UUID válido'),

  body('appId')
    .notEmpty().withMessage('El ID de la aplicación es requerido')
    .isUUID().withMessage('El ID de la aplicación debe ser un UUID válido'),

  body('priority')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('La prioridad debe ser un número entre 1 y 10'),

  body('settings')
    .optional()
    .isObject().withMessage('La configuración debe ser un objeto'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validación para registro de usuario
 */
const validateRegister = [
  body('username')
    .notEmpty().withMessage('El nombre de usuario es requerido')
    .isString().withMessage('El nombre de usuario debe ser una cadena de texto')
    .isLength({ min: 3 }).withMessage('El nombre de usuario debe tener al menos 3 caracteres'),

  body('email')
    .notEmpty().withMessage('El correo electrónico es requerido')
    .isEmail().withMessage('Correo electrónico inválido'),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),

  body('role')
    .optional()
    .isIn(['admin', 'user']).withMessage('Rol inválido'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validación para inicio de sesión
 */
const validateLogin = [
  body('username')
    .notEmpty().withMessage('El nombre de usuario es requerido'),

  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validación para actualización de contraseña
 */
const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty().withMessage('La contraseña actual es requerida'),

  body('newPassword')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validación para parámetros de ID
 */
const validateIdParam = [
  param('id')
    .isUUID().withMessage('ID inválido'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * Validación para parámetros de período
 */
const validatePeriodParams = [
  query('startDate')
    .notEmpty().withMessage('La fecha de inicio es requerida')
    .isISO8601().withMessage('Formato de fecha inválido'),

  query('endDate')
    .notEmpty().withMessage('La fecha de fin es requerida')
    .isISO8601().withMessage('Formato de fecha inválido'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateDevice,
  validateTask,
  validateRegister,
  validateLogin,
  validatePasswordUpdate,
  validateIdParam,
  validatePeriodParams
};