const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/userModel');
const { logger } = require('../utils/logger');

/**
 * Middleware para proteger rutas y verificar la autenticación
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Verificar si el token está en los headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Obtener el token desde Bearer token
    token = req.headers.authorization.split(' ')[1];
  }

  // Verificar si existe el token
  if (!token) {
    return next(new ErrorResponse('No autorizado, no se proporcionó token', 401));
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario y excluir la contraseña
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new ErrorResponse('No se encontró ningún usuario con este ID', 404));
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return next(new ErrorResponse('Usuario desactivado, contacte al administrador', 403));
    }

    // Agregar el usuario a la solicitud
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Error de autenticación: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorResponse('Token expirado, inicie sesión nuevamente', 401));
    }
    
    return next(new ErrorResponse('No autorizado, token inválido', 401));
  }
});

/**
 * Middleware para restringir el acceso según roles
 * @param {...String} roles - Roles permitidos
 * @returns {Function} Middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Usuario no autenticado', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `Rol de usuario '${req.user.role}' no autorizado para acceder a esta ruta`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};