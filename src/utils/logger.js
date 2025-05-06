// src/utils/logger.js
const winston = require('winston');
const path = require('path');
const config = require('../../config');

// Configuración del formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${stack ? '\n' + stack : ''}`;
  })
);

// Crear directorio de logs si no existe
const logsDir = path.dirname(config.logging.file);
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Crear instancia del logger
const logger = winston.createLogger({
  level: config.logging.level || 'info',
  format: logFormat,
  defaultMeta: { service: 'farm-project' },
  transports: [
    // Salida a consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          return `${timestamp} [${level}]: ${message} ${stack ? '\n' + stack : ''}`;
        })
      ),
    }),
    // Salida a archivo
    new winston.transports.File({ 
      filename: config.logging.file,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles,
      tailable: true
    }),
    // Archivo separado para errores
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    })
  ],
  exitOnError: false
});

// Capturar errores no manejados
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  
  // Permitir cierre limpio después de registrar
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise,
    reason: reason
  });
});

module.exports = logger;

// src/utils/helpers.js
/**
 * Genera un número entero aleatorio entre min y max (inclusive)
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} - Número aleatorio
 */
function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Selecciona un elemento aleatorio de un array
 * @param {Array} array - Array de elementos
 * @returns {*} - Elemento aleatorio
 */
function randomElement(array) {
  if (!Array.isArray(array) || array.length === 0) {
    return null;
  }
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Retrasa la ejecución por un tiempo específico
 * @param {number} ms - Tiempo en milisegundos
 * @returns {Promise} - Promesa que se resuelve después del tiempo
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Genera un ID único
 * @returns {string} - ID único
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Formatea una fecha a string legible
 * @param {Date|string|number} date - Fecha a formatear
 * @param {boolean} includeTime - Incluir hora
 * @returns {string} - Fecha formateada
 */
function formatDate(date, includeTime = true) {
  const d = new Date(date);
  const dateString = d.toLocaleDateString();
  
  if (!includeTime) {
    return dateString;
  }
  
  return `${dateString} ${d.toLocaleTimeString()}`;
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Texto truncado
 */
function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Capitaliza la primera letra de un texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
function capitalize(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Parsea un string JSON de forma segura
 * @param {string} jsonString - String JSON
 * @param {*} defaultValue - Valor por defecto si falla
 * @returns {*} - Objeto parseado o valor por defecto
 */
function safeJsonParse(jsonString, defaultValue = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Valida si un texto es una URL válida
 * @param {string} url - URL a validar
 * @returns {boolean} - true si es válida
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Analiza un User-Agent para obtener información del dispositivo
 * @param {string} userAgent - String de User-Agent
 * @returns {object} - Información del dispositivo
 */
function parseUserAgent(userAgent) {
  // Implementación simple, podría usar una librería como 'ua-parser-js'
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
  
  return {
    isMobile,
    isAndroid: /Android/i.test(userAgent),
    isIOS: /iPhone|iPad|iPod/i.test(userAgent),
    browser: /Chrome/i.test(userAgent) ? 'Chrome' : 
             /Firefox/i.test(userAgent) ? 'Firefox' : 
             /Safari/i.test(userAgent) ? 'Safari' : 
             /Edge/i.test(userAgent) ? 'Edge' : 
             'Unknown'
  };
}

/**
 * Valida un nombre de paquete Android
 * @param {string} packageName - Nombre del paquete
 * @returns {boolean} - true si es válido
 */
function isValidPackageName(packageName) {
  // Formato típico: com.company.app
  return /^([a-z][a-z0-9_]*\.)+[a-z][a-z0-9_]*$/i.test(packageName);
}

/**
 * Convierte milisegundos a formato legible
 * @param {number} ms - Milisegundos
 * @returns {string} - Tiempo formateado
 */
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

module.exports = {
  randomInt,
  randomElement,
  sleep,
  generateId,
  formatDate,
  truncateText,
  capitalize,
  safeJsonParse,
  isValidUrl,
  parseUserAgent,
  isValidPackageName,
  formatDuration
};
