/**
 * Función para envolver controladores asíncronos y manejar excepciones
 * @param {Function} fn - Función asíncrona a envolver
 * @returns {Function} Middleware con manejo de excepciones
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
  
  module.exports = asyncHandler;