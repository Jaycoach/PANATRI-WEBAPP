const asyncHandler = require('../utils/asyncHandler');
const courseService = require('../services/courseService');

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Obtener todos los cursos publicados
 *     tags: [Courses]
 *     parameters:
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
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filtrar por nivel de dificultad
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda para título o descripción
 *     responses:
 *       200:
 *         description: Lista de cursos obtenida exitosamente
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
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
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
 */
const getCourses = asyncHandler(async (req, res) => {
  const result = await courseService.getCourses(req.query);

  res.status(200).json({
    success: true,
    data: result,
  });
});

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Obtener un curso por su ID o slug
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID o slug del curso
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Curso obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Curso no encontrado
 */
const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user._id : null;

  const course = await courseService.getCourseById(id, userId);

  res.status(200).json({
    success: true,
    data: course,
  });
});

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Crear un nuevo curso
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: Panadería Artesanal
 *               description:
 *                 type: string
 *                 example: Aprende a hacer pan artesanal desde cero
 *               thumbnail:
 *                 type: string
 *                 example: https://ejemplo.com/imagen.jpg
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: intermediate
 *               isPublished:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Curso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Datos de curso inválidos
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para crear cursos
 */
const createCourse = asyncHandler(async (req, res) => {
  const instructorId = req.user._id;
  const courseData = req.body;

  const course = await courseService.createCourse(courseData, instructorId);

  res.status(201).json({
    success: true,
    data: course,
  });
});

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Actualizar un curso existente
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
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
 *               thumbnail:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Curso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Datos de actualización inválidos
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para actualizar este curso
 *       404:
 *         description: Curso no encontrado
 */
const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const updateData = req.body;

  const course = await courseService.updateCourse(id, updateData, userId);

  res.status(200).json({
    success: true,
    data: course,
  });
});

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Eliminar un curso
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Curso eliminado exitosamente
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
 *                   example: Curso eliminado exitosamente
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para eliminar este curso
 *       404:
 *         description: Curso no encontrado
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  await courseService.deleteCourse(id, userId);

  res.status(200).json({
    success: true,
    message: 'Curso eliminado exitosamente',
  });
});

/**
 * @swagger
 * /api/courses/{id}/modules:
 *   post:
 *     summary: Agregar un módulo al curso
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Introducción a la masa madre
 *               description:
 *                 type: string
 *                 example: Fundamentos básicos para trabajar con masa madre
 *               order:
 *                 type: number
 *                 example: 1
 *     responses:
 *       200:
 *         description: Módulo agregado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para modificar este curso
 *       404:
 *         description: Curso no encontrado
 */
const addModule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const moduleData = req.body;

  const course = await courseService.addModule(id, moduleData, userId);

  res.status(200).json({
    success: true,
    data: course,
  });
});

/**
 * @swagger
 * /api/courses/{id}/modules/{moduleId}:
 *   put:
 *     summary: Actualizar un módulo del curso
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del módulo
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
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Módulo actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para modificar este curso
 *       404:
 *         description: Curso o módulo no encontrado
 */
const updateModule = asyncHandler(async (req, res) => {
  const { id, moduleId } = req.params;
  const userId = req.user._id;
  const updateData = req.body;

  const course = await courseService.updateModule(id, moduleId, updateData, userId);

  res.status(200).json({
    success: true,
    data: course,
  });
});

/**
 * @swagger
 * /api/courses/{id}/modules/{moduleId}:
 *   delete:
 *     summary: Eliminar un módulo del curso
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del módulo
 *     responses:
 *       200:
 *         description: Módulo eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No tiene permisos para modificar este curso
 *       404:
 *         description: Curso o módulo no encontrado
 */
const deleteModule = asyncHandler(async (req, res) => {
  const { id, moduleId } = req.params;
  const userId = req.user._id;

  const course = await courseService.deleteModule(id, moduleId, userId);

  res.status(200).json({
    success: true,
    data: course,
  });
});

/**
 * @swagger
 * /api/courses/{id}/reviews:
 *   post:
 *     summary: Agregar una reseña al curso
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: Un excelente curso para aprender panadería desde cero.
 *     responses:
 *       200:
 *         description: Reseña agregada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       401:
 *         description: No autorizado, token inválido o expirado
 *       403:
 *         description: No está matriculado en este curso
 *       404:
 *         description: Curso no encontrado
 */
const addReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const { rating, comment } = req.body;

  const course = await courseService.addReview(id, userId, rating, comment);

  res.status(200).json({
    success: true,
    data: course,
  });
});

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  updateModule,
  deleteModule,
  addReview,
};
