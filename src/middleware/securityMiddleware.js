const csrf = require('csurf');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const { logger } = require('../utils/logger');

/**
 * Middleware para protección contra ataques CSRF
 * Nota: Solo se aplica a rutas que no son API o que usan cookies/sessions
 */
const csrfProtection = csrf({ cookie: true });

/**
 * Middleware para protección contra XSS
 * Sanitiza los datos en el body, query y params de la solicitud
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const xssProtection = xss();

/**
 * Middleware para prevenir la contaminación de parámetros HTTP
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const preventHPP = hpp();

/**
 * Middleware para prevenir inyección NoSQL MongoDB
 * Sanitiza los datos en el body, query y params de la solicitud
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const preventNoSQLInjection = mongoSanitize();

/**
 * Middleware para registrar detalles de solicitudes
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const requestLogger = (req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
};

module.exports = {
  csrfProtection,
  xssProtection,
  preventHPP,
  preventNoSQLInjection,
  requestLogger,
};