const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/userService');

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 */
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await userService.getUserProfile(userId);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nuevo Nombre
 *               profileImage:
 *                 type: string
 *                 example: https://ejemplo.com/imagen.jpg
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos de actualización inválidos
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 */
const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const updateData = req.body;

  const user = await userService.updateUserProfile(userId, updateData);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @swagger
 * /api/users/change-password:
 *   put:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 example: ContraseñaActual123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NuevaContraseña123!
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
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
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Contraseña actual incorrecta
 *       404:
 *         description: Usuario no encontrado
 */
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { currentPassword, newPassword } = req.body;

  const message = await userService.changePassword(userId, currentPassword, newPassword);

  res.status(200).json({
    success: true,
    message,
  });
});

/**
 * @swagger
 * /api/users/enrolled-courses:
 *   get:
 *     summary: Obtener cursos matriculados por el usuario
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cursos matriculados obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       course:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           thumbnail:
 *                             type: string
 *                       progress:
 *                         type: number
 *                         example: 35
 *                       dateEnrolled:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       404:
 *         description: Usuario no encontrado
 */
const getEnrolledCourses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const enrolledCourses = await userService.getEnrolledCourses(userId);

  res.status(200).json({
    success: true,
    data: enrolledCourses,
  });
});

/**
 * @swagger
 * /api/users/enroll/{courseId}:
 *   post:
 *     summary: Matricular usuario en un curso
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matriculado exitosamente
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
 *                     message:
 *                       type: string
 *                     courseTitle:
 *                       type: string
 *                     enrollmentDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: El usuario ya está matriculado en este curso
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       404:
 *         description: Curso no encontrado o no disponible
 */
const enrollInCourse = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { courseId } = req.params;

  const result = await userService.enrollInCourse(userId, courseId);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @swagger
 * /api/users/course-progress:
 *   post:
 *     summary: Actualizar progreso del usuario en un curso
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - videoId
 *               - progress
 *             properties:
 *               courseId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c85
 *               videoId:
 *                 type: string
 *                 example: 60d21b4667d0d8992e610c86
 *               progress:
 *                 type: number
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
 *                     videoProgress:
 *                       type: number
 *                     videoCompleted:
 *                       type: boolean
 *                     courseProgress:
 *                       type: number
 *                     completedVideos:
 *                       type: number
 *                     totalVideos:
 *                       type: number
 *       400:
 *         description: Datos inválidos o usuario no matriculado
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       404:
 *         description: Curso o video no encontrado
 */
const updateCourseProgress = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { courseId, videoId, progress } = req.body;

  const result = await userService.updateCourseProgress(userId, courseId, videoId, progress);

  res.status(200).json({
    success: true,
    data: result,
  });
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getEnrolledCourses,
  enrollInCourse,
  updateCourseProgress,
};
