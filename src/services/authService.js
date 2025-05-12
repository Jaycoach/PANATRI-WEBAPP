const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const { logger } = require('../utils/logger');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Servicio para manejar la autenticación de usuarios
 */
class AuthService {
  /**
   * Registrar un nuevo usuario
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Object} Usuario registrado y token
   */
  async register(userData) {
    try {
      // Verificar si el email ya existe
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        throw new ErrorResponse('El correo electrónico ya está registrado', 400);
      }

      // Crear nuevo usuario
      const user = await User.create(userData);

      // Generar tokens
      const accessToken = user.getSignedJwtToken();
      const refreshToken = user.getRefreshToken();

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error(`Error en registro de usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Iniciar sesión de usuario
   * @param {string} email - Correo electrónico
   * @param {string} password - Contraseña
   * @returns {Object} Usuario autenticado y token
   */
  async login(email, password) {
    try {
      // Verificar si se proporcionaron email y password
      if (!email || !password) {
        throw new ErrorResponse('Por favor proporcione correo y contraseña', 400);
      }

      // Buscar usuario por email e incluir la contraseña para la verificación
      const user = await User.findOne({ email }).select('+password');

      // Verificar si el usuario existe
      if (!user) {
        throw new ErrorResponse('Credenciales inválidas', 401);
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        throw new ErrorResponse('Esta cuenta está desactivada, contacte al administrador', 403);
      }

      // Verificar si la contraseña coincide
      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        throw new ErrorResponse('Credenciales inválidas', 401);
      }

      // Generar tokens
      const accessToken = user.getSignedJwtToken();
      const refreshToken = user.getRefreshToken();

      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      logger.error(`Error en inicio de sesión: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refrescar token de acceso
   * @param {string} refreshToken - Token de refresco
   * @returns {Object} Nuevo token de acceso
   */
  async refreshToken(refreshToken) {
    try {
      if (!refreshToken) {
        throw new ErrorResponse('No se proporcionó token de refresco', 400);
      }

      // Verificar el token de refresco
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Buscar usuario por ID
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new ErrorResponse('No se encontró ningún usuario con este token', 404);
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        throw new ErrorResponse('Esta cuenta está desactivada, contacte al administrador', 403);
      }

      // Generar nuevo token de acceso
      const accessToken = user.getSignedJwtToken();

      return {
        accessToken,
      };
    } catch (error) {
      logger.error(`Error al refrescar token: ${error.message}`);

      if (error.name === 'TokenExpiredError') {
        throw new ErrorResponse('Token de refresco expirado, inicie sesión nuevamente', 401);
      }

      if (error.name === 'JsonWebTokenError') {
        throw new ErrorResponse('Token de refresco inválido', 401);
      }

      throw error;
    }
  }

  /**
   * Enviar email para restablecer contraseña
   * @param {string} email - Correo electrónico
   * @returns {string} Mensaje de éxito
   */
  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new ErrorResponse('No hay ningún usuario con ese correo electrónico', 404);
      }

      // Generar token de restablecimiento
      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      // En una implementación real, aquí se enviaría un email con el token
      // Para simplificar, solo devolvemos el token (esto sería reemplazado)
      logger.info(`Token generado para reset de contraseña: ${resetToken}`);

      return 'Se ha enviado un correo electrónico con instrucciones para restablecer su contraseña';
    } catch (error) {
      logger.error(`Error en recuperación de contraseña: ${error.message}`);
      throw error;
    }
  }

  /**
   * Restablecer contraseña
   * @param {string} resetToken - Token de restablecimiento
   * @param {string} newPassword - Nueva contraseña
   * @returns {string} Mensaje de éxito
   */
  async resetPassword(resetToken, newPassword) {
    try {
      // Hashear el token para comparar con el almacenado
      const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Buscar usuario con el token y que no haya expirado
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        throw new ErrorResponse('Token inválido o expirado', 400);
      }

      // Establecer nueva contraseña
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return 'Contraseña restablecida exitosamente';
    } catch (error) {
      logger.error(`Error al restablecer contraseña: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new AuthService();
