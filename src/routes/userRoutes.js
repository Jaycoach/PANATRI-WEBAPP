const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getEnrolledCourses,
  enrollInCourse,
  updateCourseProgress,
  changeUserRole,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Operaciones con usuarios
 */

// Todas las rutas en este archivo requieren autenticación
router.use(protect);

// Rutas de perfil de usuario
router.route('/profile').get(getUserProfile).put(updateUserProfile);

// Ruta para cambiar contraseña
router.put('/change-password', changePassword);

// Rutas para cursos matriculados
router.get('/enrolled-courses', getEnrolledCourses);
router.post('/enroll/:courseId', enrollInCourse);
router.post('/course-progress', updateCourseProgress);
// Ruta para cambiar el rol de un usuario (solo admin)
router.put('/change-role/:userId', protect, authorize('admin'), changeUserRole);

module.exports = router;
