/**
 * Clase ErrorResponse para manejar errores de API de manera consistente
 * @extends Error
 */
class ErrorResponse extends Error {
    /**
     * Crear una instancia de ErrorResponse
     * @param {string} message - Mensaje de error
     * @param {number} statusCode - Código de estado HTTP
     */
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  
  module.exports = ErrorResponse;