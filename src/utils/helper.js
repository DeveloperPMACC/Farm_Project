/**
 * Genera un número aleatorio dentro de un rango
 * @param {number} min - Valor mínimo (inclusivo)
 * @param {number} max - Valor máximo (inclusivo)
 * @returns {number} Número aleatorio
 */
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Retrasa la ejecución por un tiempo específico
 * @param {number} ms - Tiempo en milisegundos
 * @returns {Promise<void>}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Formatea un tiempo en segundos a formato legible
 * @param {number} seconds - Tiempo en segundos
 * @returns {string} Tiempo formateado (HH:MM:SS)
 */
const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ].join(':');
};

/**
 * Genera una lista de puntos aleatorios para simular interacciones
 * @param {number} count - Número de puntos
 * @param {number} maxX - Valor máximo de X
 * @param {number} maxY - Valor máximo de Y
 * @returns {Array<Object>} Lista de puntos {x, y}
 */
const generateRandomPoints = (count, maxX, maxY) => {
  const points = [];

  for (let i = 0; i < count; i++) {
    points.push({
      x: getRandomInt(0, maxX),
      y: getRandomInt(0, maxY)
    });
  }

  return points;
};

/**
 * Verificar si una cadena es un UUID válido
 * @param {string} str - Cadena a verificar
 * @returns {boolean} Es UUID válido
 */
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Genera una fecha en el futuro a partir de ahora
 * @param {number} minutes - Minutos a añadir
 * @returns {Date} Fecha futura
 */
const getFutureDate = (minutes) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutes);
  return date;
};

/**
 * Sanitiza un objeto eliminando propiedades específicas
 * @param {Object} obj - Objeto a sanitizar
 * @param {Array<string>} fieldsToRemove - Campos a eliminar
 * @returns {Object} Objeto sanitizado
 */
const sanitizeObject = (obj, fieldsToRemove = []) => {
  const result = { ...obj };

  for (const field of fieldsToRemove) {
    delete result[field];
  }

  return result;
};

module.exports = {
  getRandomInt,
  sleep,
  formatTime,
  generateRandomPoints,
  isValidUUID,
  getFutureDate,
  sanitizeObject
};