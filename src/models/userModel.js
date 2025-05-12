const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: ID automático generado por MongoDB
 *         name:
 *           type: string
 *           description: Nombre completo del usuario
 *         email:
 *           type: string
 *           description: Correo electrónico del usuario (único)
 *         password:
 *           type: string
 *           description: Contraseña del usuario (hash)
 *           format: password
 *         role:
 *           type: string
 *           description: Rol del usuario
 *           enum: [user, admin, instructor]
 *         isActive:
 *           type: boolean
 *           description: Indica si el usuario está activo
 *         profileImage:
 *           type: string
 *           description: URL de la imagen de perfil
 *         enrolledCourses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               course:
 *                 type: string
 *                 description: ID del curso matriculado
 *               progress:
 *                 type: number
 *                 description: Progreso en el curso (0-100)
 *               dateEnrolled:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de matrícula
 *         resetPasswordToken:
 *           type: string
 *           description: Token para restablecer contraseña
 *         resetPasswordExpire:
 *           type: string
 *           format: date-time
 *           description: Fecha de expiración del token
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         name: Juan Pérez
 *         email: juan@ejemplo.com
 *         password: Contraseña123!
 *         role: user
 *         isActive: true
 */

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Por favor ingrese su nombre'],
      trim: true,
      maxlength: [50, 'El nombre no puede tener más de 50 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'Por favor ingrese su correo electrónico'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^([\w-.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        'Por favor ingrese un correo electrónico válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'Por favor ingrese una contraseña'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false, // No devolver la contraseña en las consultas
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'instructor'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        dateEnrolled: {
          type: Date,
          default: Date.now,
        },
        lastAccessed: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encriptar contraseña antes de guardar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Generar y firmar JWT
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION,
  });
};

// Generar y firmar token de refresco
UserSchema.methods.getRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
  });
};

// Verificar que la contraseña ingresada coincida con la almacenada
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generar token para restablecer contraseña
UserSchema.methods.getResetPasswordToken = function () {
  // Generar token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash el token y establecerlo en resetPasswordToken
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Establecer tiempo de expiración
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
