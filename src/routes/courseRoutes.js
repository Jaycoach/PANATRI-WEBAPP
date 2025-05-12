const express = require('express');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  updateModule,
  deleteModule,
  addReview,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { courseValidation } = require('../middleware/validationMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Gestión de cursos y rutas de aprendizaje
 */

// Rutas públicas
router.get('/', getCourses);

// Rutas que requieren autenticación
router.use(protect);

// Ruta para obtener detalles de un curso (puede ser accedida por cualquier usuario autenticado)
router.get('/:id', getCourseById);

// Rutas para crear y administrar cursos (solo admin e instructor)
router.post('/', authorize('admin', 'instructor'), courseValidation, createCourse);
router.put('/:id', authorize('admin', 'instructor'), updateCourse);
router.delete('/:id', authorize('admin', 'instructor'), deleteCourse);

// Rutas para módulos
router.post('/:id/modules', authorize('admin', 'instructor'), addModule);
router.put('/:id/modules/:moduleId', authorize('admin', 'instructor'), updateModule);
router.delete('/:id/modules/:moduleId', authorize('admin', 'instructor'), deleteModule);

// Ruta para agregar reseñas (cualquier usuario autenticado puede agregar reseñas)
router.post('/:id/reviews', addReview);

module.exports = router;
