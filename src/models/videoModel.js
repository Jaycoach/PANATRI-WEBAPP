const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       required:
 *         - title
 *         - course
 *         - s3Key
 *       properties:
 *         _id:
 *           type: string
 *           description: ID automático generado por MongoDB
 *         title:
 *           type: string
 *           description: Título del video
 *         description:
 *           type: string
 *           description: Descripción del video
 *         course:
 *           type: string
 *           description: ID del curso al que pertenece el video
 *         module:
 *           type: string
 *           description: ID del módulo al que pertenece el video
 *         s3Key:
 *           type: string
 *           description: Clave del objeto en S3
 *         duration:
 *           type: number
 *           description: Duración del video en segundos
 *         thumbnail:
 *           type: string
 *           description: URL de la miniatura del video
 *         order:
 *           type: number
 *           description: Orden de presentación del video
 *         isPublished:
 *           type: boolean
 *           description: Indica si el video está publicado
 *         views:
 *           type: number
 *           description: Número de vistas del video
 *         resources:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del recurso
 *               type:
 *                 type: string
 *                 description: Tipo de recurso (pdf, doc, etc.)
 *               url:
 *                 type: string
 *                 description: URL del recurso
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del video
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         title: Preparación de masa madre
 *         description: Aprende a preparar una masa madre tradicional paso a paso
 *         course: 60d21b4667d0d8992e610c85
 *         s3Key: videos/12345-6789.mp4
 *         duration: 1200
 *         order: 1
 *         isPublished: true
 */

const VideoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Por favor ingrese un título para el video'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres'],
    },
    description: {
      type: String,
      trim: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'El video debe estar asociado a un curso'],
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      // Referencia al subdocumento module dentro de Course
    },
    s3Key: {
      type: String,
      required: [true, 'Se requiere la clave S3 del video'],
    },
    duration: {
      type: Number,
      default: 0,
    },
    thumbnail: {
      type: String,
      default: 'default-video-thumbnail.jpg',
    },
    order: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    resources: [
      {
        title: {
          type: String,
          required: [true, 'Por favor ingrese un título para el recurso'],
          trim: true,
        },
        type: {
          type: String,
          enum: ['pdf', 'doc', 'excel', 'ppt', 'image', 'other'],
          default: 'other',
        },
        url: {
          type: String,
          required: [true, 'Se requiere la URL del recurso'],
        },
      },
    ],
    // Historial de vistas para análisis
    viewHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number, // Porcentaje de visualización
          default: 0,
          min: 0,
          max: 100,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware para actualizar contador de vistas
VideoSchema.methods.incrementViews = async function (userId) {
  // Incrementar contador general
  this.views += 1;

  // Añadir o actualizar historial por usuario
  const userViewIndex = this.viewHistory.findIndex(
    (view) => view.user.toString() === userId.toString()
  );

  if (userViewIndex === -1) {
    // Primera vista del usuario
    this.viewHistory.push({
      user: userId,
      date: Date.now(),
      progress: 0,
      completed: false,
    });
  } else {
    // Actualizar fecha de última vista
    this.viewHistory[userViewIndex].date = Date.now();
  }

  await this.save();
};

// Actualizar progreso de visualización
VideoSchema.methods.updateProgress = async function (userId, progress, completed = false) {
  const userViewIndex = this.viewHistory.findIndex(
    (view) => view.user.toString() === userId.toString()
  );

  if (userViewIndex === -1) {
    // Si no existe en el historial, crear nuevo
    this.viewHistory.push({
      user: userId,
      date: Date.now(),
      progress,
      completed,
    });
  } else {
    // Actualizar progreso existente
    this.viewHistory[userViewIndex].progress = progress;
    this.viewHistory[userViewIndex].completed = completed;
    this.viewHistory[userViewIndex].date = Date.now();
  }

  await this.save();
};

// Índices para búsqueda eficiente
VideoSchema.index({ course: 1, order: 1 });
VideoSchema.index({ title: 'text', description: 'text' });
VideoSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Video', VideoSchema);
