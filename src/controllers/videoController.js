const asyncHandler = require('../utils/asyncHandler');
const videoService = require('../services/videoService');
const { uploadToS3 } = require('../config/aws');

/**
 * @swagger
 * /api/videos/course/{courseId}:
 *   get:
 *     summary: Obtener videos de un curso
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filtrar por módulo
 *     responses:
 *       200:
 *         description: Lista de videos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Video'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         pages:
 *                           type: number
 *                         currentPage:
 *                           type: number
 *                         limit:
 *                           type: number
 *       404:
 *         description: Curso no encontrado
 */
const getVideos = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const result = await videoService.getVideos(courseId, req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Obtener un video por su ID
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del video
 *     responses:
 *       200:
 *         description: Video obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene acceso a este video
 *       404:
 *         description: Video no encontrado
 */
const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const video = await videoService.getVideoById(id, userId);

  res.status(200).json({
    success: true,
    data: video,
  });
});

/**
 * @swagger
 * /api/videos:
 *   post:
 *     summary: Crear un nuevo video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - course
 *               - video
 *             properties:
 *               title:
 *                 type: string
 *                 example: Preparación de masa madre
 *               description:
 *                 type: string
 *                 example: Aprende a preparar una masa madre tradicional paso a paso
 *               course:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               module:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c87
 *               order:
 *                 type: number
 *                 example: 1
 *               video:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Video creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: Datos de video inválidos
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para agregar videos a este curso
 *       404:
 *         description: Curso no encontrado
 */
const createVideo = asyncHandler(async (req, res) => {
  // Este middleware utiliza multer para manejar la subida de archivos
  uploadToS3.single('video')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Por favor, suba un archivo de video',
      });
    }

    const { title, description, course, module, order } = req.body;
    const userId = req.user._id;
    const s3Key = req.file.key;

    const videoData = {
      title,
      description,
      course,
      module,
      order,
      isPublished: false, // Por defecto no publicado
    };

    const video = await videoService.createVideo(videoData, s3Key, userId);

    res.status(201).json({
      success: true,
      data: video,
    });
  });
});

/**
 * @swagger
 * /api/videos/{id}:
 *   put:
 *     summary: Actualizar un video existente
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del video
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               module:
 *                 type: string
 *               order:
 *                 type: number
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Video actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: Datos de actualización inválidos
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para actualizar este video
 *       404:
 *         description: Video no encontrado
 */
const updateVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const updateData = req.body;

  const video = await videoService.updateVideo(id, updateData, userId);

  res.status(200).json({
    success: true,
    data: video,
  });
});

/**
 * @swagger
 * /api/videos/{id}:
 *   delete:
 *     summary: Eliminar un video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del video
 *     responses:
 *       200:
 *         description: Video eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Video eliminado exitosamente
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para eliminar este video
 *       404:
 *         description: Video no encontrado
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  await videoService.deleteVideo(id, userId);

  res.status(200).json({
    success: true,
    message: 'Video eliminado exitosamente',
  });
});

/**
 * @swagger
 * /api/videos/{id}/progress:
 *   post:
 *     summary: Actualizar progreso de visualización de un video
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del video
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - progress
 *             properties:
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 75
 *     responses:
 *       200:
 *         description: Progreso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     videoId:
 *                       type: string
 *                     progress:
 *                       type: number
 *                     completed:
 *                       type: boolean
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene acceso a este video
 *       404:
 *         description: Video no encontrado
 */
const updateVideoProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { progress } = req.body;

  const result = await videoService.updateVideoProgress(id, userId, progress);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @swagger
 * /api/videos/upload-url:
 *   post:
 *     summary: Obtener URL firmada para subir un video directamente a S3
 *     tags: [Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *               - courseId
 *             properties:
 *               fileName:
 *                 type: string
 *                 example: video-masa-madre.mp4
 *               fileType:
 *                 type: string
 *                 example: video/mp4
 *               courseId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: URL de subida generada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadUrl:
 *                       type: string
 *                     s3Key:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 *       400:
 *         description: Datos inválidos o tipo de archivo no permitido
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para subir videos a este curso
 *       404:
 *         description: Curso no encontrado
 */
const getVideoUploadUrl = asyncHandler(async (req, res) => {
  const { fileName, fileType, courseId } = req.body;
  const userId = req.user._id;

  const result = await videoService.getVideoUploadUrl(fileName, fileType, courseId, userId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  updateVideoProgress,
  getVideoUploadUrl,
};
