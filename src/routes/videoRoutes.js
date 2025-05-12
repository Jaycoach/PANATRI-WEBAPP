const path = require('path');
const fs = require('fs');
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

// Ruta para streaming local de videos (solo para desarrollo)
router.get('/stream/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(__dirname, '../../uploads/videos', filename);

  // Verificar si el archivo existe
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({
      success: false,
      error: 'Video no encontrado',
    });
  }

  // Obtener estadísticas del archivo
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Manejar solicitudes de rango para streaming
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });

    file.pipe(res);
  } else {
    // Enviar archivo completo si no hay encabezado de rango
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });

    fs.createReadStream(videoPath).pipe(res);
  }
});

module.exports = router;
