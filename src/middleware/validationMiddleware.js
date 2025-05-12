const { validationResult, check } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Middleware para validar los resultados de express-validator
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función next de Express
 */
const validateResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Extraer mensajes de error
    const errorMessages = errors.array().map(error => error.msg);
    return next(new ErrorResponse(errorMessages.join(', '), 400));
  }
  next();
};

/**
 * Validaciones para registro de usuario
 */
const registerValidation = [
  check('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 50 }).withMessage('El nombre debe tener entre 3 y 50 caracteres')
    .escape(),
  
  check('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es requerido')
    .isEmail().withMessage('Ingrese un correo electrónico válido')
    .normalizeEmail(),
  
  check('password')
    .trim()
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/\d/).withMessage('La contraseña debe contener al menos un número')
    .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula')
    .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('La contraseña debe contener al menos un carácter especial'),
  
  validateResults,
];

/**
 * Validaciones para inicio de sesión
 */
const loginValidation = [
  check('email')
    .trim()
    .notEmpty().withMessage('El correo electrónico es requerido')
    .isEmail().withMessage('Ingrese un correo electrónico válido')
    .normalizeEmail(),
  
  check('password')
    .trim()
    .notEmpty().withMessage('La contraseña es requerida'),
  
  validateResults,
];

/**
 * Validaciones para creación/actualización de curso
 */
const courseValidation = [
  check('title')
    .trim()
    .notEmpty().withMessage('El título es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El título debe tener entre 3 y 100 caracteres')
    .escape(),
  
  check('description')
    .trim()
    .notEmpty().withMessage('La descripción es requerida')
    .isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres')
    .escape(),
  
  check('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced']).withMessage('El nivel debe ser: beginner, intermediate o advanced'),
  
  check('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished debe ser un valor booleano'),
  
  validateResults,
];

/**
 * Validaciones para videos
 */
const videoValidation = [
  check('title')
    .trim()
    .notEmpty().withMessage('El título es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El título debe tener entre 3 y 100 caracteres')
    .escape(),
  
  check('description')
    .trim()
    .optional()
    .isLength({ min: 10 }).withMessage('La descripción debe tener al menos 10 caracteres')
    .escape(),
  
  check('course')
    .notEmpty().withMessage('El curso asociado es requerido')
    .isMongoId().withMessage('ID de curso inválido'),
  
  check('order')
    .optional()
    .isInt({ min: 1 }).withMessage('El orden debe ser un número entero positivo'),
  
  validateResults,
];

module.exports = {
  validateResults,
  registerValidation,
  loginValidation,
  courseValidation,
  videoValidation,
};