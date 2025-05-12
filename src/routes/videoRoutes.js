const express = require('express');
const {
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  updateVideoProgress,
  getVideoUploadUrl,
} = require('../controllers/videoController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { videoValidation } = require('../middleware/validationMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Videos
 *   description: Gestión y reproducción de videos
 */

// Rutas públicas
router.get('/course/:courseId', getVideos);

// Rutas que requieren autenticación
router.use(protect);

// Rutas que cualquier usuario autenticado puede acceder
router.get('/:id', getVideoById);
router.post('/:id/progress', updateVideoProgress);

// Rutas para administración de videos (solo admin e instructor)
router.post('/', authorize('admin', 'instructor'), videoValidation, createVideo);
router.put('/:id', authorize('admin', 'instructor'), updateVideo);
router.delete('/:id', authorize('admin', 'instructor'), deleteVideo);
router.post('/upload-url', authorize('admin', 'instructor'), getVideoUploadUrl);

module.exports = router;