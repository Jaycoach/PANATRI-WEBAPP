const express = require('express');
const {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validationMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación
 */

// Ruta para registro de usuarios
router.post('/register', registerValidation, register);

// Ruta para inicio de sesión
router.post('/login', loginValidation, login);

// Ruta para refrescar token
router.post('/refresh-token', refreshToken);

// Ruta para solicitar restablecimiento de contraseña
router.post('/forgot-password', forgotPassword);

// Ruta para restablecer contraseña
router.put('/reset-password/:resetToken', resetPassword);

module.exports = router;