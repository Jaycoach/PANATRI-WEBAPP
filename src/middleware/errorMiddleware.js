const { logger } = require('../utils/logger');

/**
 * Middleware para manejar rutas no encontradas
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware para manejar errores de manera global
 * @param {Error} err - Objeto de error
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const errorHandler = (err, req, res, next) => {
  // Logs para desarrollo y depuración
  if (process.env.NODE_ENV === 'development') {
    logger.error(`${err.name}: ${err.message}`);
    if (err.stack) {
      logger.error(err.stack);
    }
  }

  // Determinar el código de estado HTTP
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // Construir respuesta de error
  const errorResponse = {
    success: false,
    error: {
      message: err.message || 'Error del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  // Manejar errores específicos
  if (err.name === 'ValidationError') {
    // Error de validación de Mongoose
    errorResponse.error.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    res.status(400).json(errorResponse);
  } else if (err.name === 'CastError') {
    // Error de cast de Mongoose (por ejemplo, ID inválido)
    errorResponse.error.message = `Recurso no encontrado con id: ${err.value}`;
    res.status(404).json(errorResponse);
  } else if (err.code === 11000) {
    // Error de duplicado de Mongoose
    errorResponse.error.message = `Valor duplicado ingresado para el campo ${Object.keys(
      err.keyValue
    )}`;
    res.status(400).json(errorResponse);
  } else if (err.name === 'JsonWebTokenError') {
    // Error de JWT
    errorResponse.error.message = 'Token inválido';
    res.status(401).json(errorResponse);
  } else if (err.name === 'TokenExpiredError') {
    // Error de JWT expirado
    errorResponse.error.message = 'Token expirado';
    res.status(401).json(errorResponse);
  } else {
    // Errores genéricos
    res.json(errorResponse);
  }
};

module.exports = {
  notFound,
  errorHandler,
};
