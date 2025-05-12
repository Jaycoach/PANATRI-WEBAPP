const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         _id:
 *           type: string
 *           description: ID automático generado por MongoDB
 *         title:
 *           type: string
 *           description: Título del curso
 *         slug:
 *           type: string
 *           description: Slug del curso para URLs amigables
 *         description:
 *           type: string
 *           description: Descripción detallada del curso
 *         thumbnail:
 *           type: string
 *           description: URL de la imagen miniatura del curso
 *         instructor:
 *           type: string
 *           description: ID del usuario instructor
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           description: Nivel de dificultad del curso
 *         modules:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del módulo
 *               description:
 *                 type: string
 *                 description: Descripción del módulo
 *               order:
 *                 type: number
 *                 description: Orden de presentación del módulo
 *         isPublished:
 *           type: boolean
 *           description: Indica si el curso está publicado
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del curso
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         title: Técnicas avanzadas de panadería francesa
 *         description: Aprende las técnicas y secretos de la panadería francesa tradicional
 *         thumbnail: https://ejemplo.com/imagen.jpg
 *         level: intermediate
 *         isPublished: true
 */

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Por favor ingrese un título para el curso'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Por favor ingrese una descripción para el curso'],
      trim: true,
      minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
    },
    thumbnail: {
      type: String,
      default: 'default-course.jpg',
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    modules: [
      {
        title: {
          type: String,
          required: [true, 'Por favor ingrese un título para el módulo'],
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        order: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: [1, 'La calificación mínima es 1'],
      max: [5, 'La calificación máxima es 5'],
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: {
          type: String,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtualización para videos - permite relacionar videos con cursos sin duplicar datos
CourseSchema.virtual('videos', {
  ref: 'Video',
  localField: '_id',
  foreignField: 'course',
  justOne: false,
});

// Middleware para generar slug a partir del título
CourseSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-');
  }
  next();
});

// Middleware para calcular la calificación promedio
CourseSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) {
    this.rating = null;
    return;
  }

  const sum = this.reviews.reduce((total, review) => total + review.rating, 0);
  this.rating = Math.round((sum / this.reviews.length) * 10) / 10; // Redondear a 1 decimal
};

// Índices para búsqueda eficiente
CourseSchema.index({ title: 'text', description: 'text' });
CourseSchema.index({ slug: 1 });
CourseSchema.index({ instructor: 1 });
CourseSchema.index({ level: 1 });
CourseSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Course', CourseSchema);