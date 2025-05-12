const Course = require('../models/courseModel');
const Video = require('../models/videoModel');
const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const { logger } = require('../utils/logger');

/**
 * Servicio para manejar operaciones relacionadas con cursos
 */
class CourseService {
  /**
   * Obtener todos los cursos publicados con paginación y filtros
   * @param {Object} queryParams - Parámetros de consulta
   * @returns {Object} Cursos y metadatos de paginación
   */
  async getCourses(queryParams) {
    try {
      const page = parseInt(queryParams.page, 10) || 1;
      const limit = parseInt(queryParams.limit, 10) || 10;
      const startIndex = (page - 1) * limit;
      
      // Construir la consulta base
      let query = { isPublished: true };
      
      // Filtrar por nivel si se proporciona
      if (queryParams.level) {
        query.level = queryParams.level;
      }
      
      // Buscar por término si se proporciona
      if (queryParams.search) {
        query.$text = { $search: queryParams.search };
      }
      
      // Contar documentos totales para la paginación
      const total = await Course.countDocuments(query);
      
      // Ejecutar la consulta con paginación y populate
      const courses = await Course.find(query)
        .skip(startIndex)
        .limit(limit)
        .populate({ path: 'instructor', select: 'name' })
        .select('title description thumbnail level instructor rating enrollmentCount');
      
      // Construir respuesta con metadatos de paginación
      const pagination = {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      };
      
      return {
        courses,
        pagination,
      };
    } catch (error) {
      logger.error(`Error al obtener cursos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un curso por su ID o slug
   * @param {string} identifier - ID o slug del curso
   * @param {string} userId - ID del usuario (opcional, para verificar matrícula)
   * @returns {Object} Curso con sus detalles
   */
  async getCourseById(identifier, userId = null) {
    try {
      // Determinar si es ID o slug
      const isMongoId = identifier.match(/^[0-9a-fA-F]{24}$/);
      
      // Construir la consulta
      const query = isMongoId ? { _id: identifier } : { slug: identifier };
      query.isPublished = true; // Solo cursos publicados
      
      // Ejecutar la consulta con populate
      const course = await Course.findOne(query)
        .populate({ path: 'instructor', select: 'name' })
        .populate({
          path: 'videos',
          select: 'title description thumbnail duration order',
          options: { sort: { order: 1 } },
        });
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar si el usuario está matriculado
      let isEnrolled = false;
      let progress = 0;
      
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          const enrollment = user.enrolledCourses.find(
            enrollment => enrollment.course.toString() === course._id.toString()
          );
          
          if (enrollment) {
            isEnrolled = true;
            progress = enrollment.progress;
          }
        }
      }
      
      // Incluir datos de matrícula si corresponde
      return {
        ...course.toObject(),
        isEnrolled,
        progress: isEnrolled ? progress : null,
      };
    } catch (error) {
      logger.error(`Error al obtener curso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo curso
   * @param {Object} courseData - Datos del curso
   * @param {string} instructorId - ID del instructor
   * @returns {Object} Curso creado
   */
  async createCourse(courseData, instructorId) {
    try {
      // Verificar que el instructor exista y tenga el rol adecuado
      const instructor = await User.findOne({
        _id: instructorId,
        role: { $in: ['instructor', 'admin'] },
      });
      
      if (!instructor) {
        throw new ErrorResponse('Instructor no encontrado o no autorizado', 404);
      }
      
      // Crear el curso con el instructor asignado
      const course = await Course.create({
        ...courseData,
        instructor: instructorId,
      });
      
      return course;
    } catch (error) {
      logger.error(`Error al crear curso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar un curso existente
   * @param {string} courseId - ID del curso
   * @param {Object} updateData - Datos a actualizar
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Object} Curso actualizado
   */
  async updateCourse(courseId, updateData, userId) {
    try {
      // Buscar el curso
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos (solo el instructor del curso o un admin pueden actualizar)
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }
      
      if (user.role !== 'admin' && course.instructor.toString() !== userId) {
        throw new ErrorResponse('No autorizado para actualizar este curso', 403);
      }
      
      // Actualizar el curso
      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
      
      return updatedCourse;
    } catch (error) {
      logger.error(`Error al actualizar curso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un curso
   * @param {string} courseId - ID del curso
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {boolean} Éxito de la operación
   */
  async deleteCourse(courseId, userId) {
    try {
      // Buscar el curso
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos (solo el instructor del curso o un admin pueden eliminar)
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }
      
      if (user.role !== 'admin' && course.instructor.toString() !== userId) {
        throw new ErrorResponse('No autorizado para eliminar este curso', 403);
      }
      
      // Verificar si hay estudiantes matriculados
      const enrolledUsers = await User.countDocuments({
        'enrolledCourses.course': courseId,
      });
      
      if (enrolledUsers > 0) {
        throw new ErrorResponse(
          'No se puede eliminar un curso con estudiantes matriculados',
          400
        );
      }
      
      // Eliminar todos los videos asociados al curso
      const videos = await Video.find({ course: courseId });
      
      // Aquí se podría incluir lógica para eliminar los videos de S3
      // utilizando el servicio AWS para cada video.s3Key
      
      // Eliminar videos de la base de datos
      await Video.deleteMany({ course: courseId });
      
      // Eliminar el curso
      await Course.findByIdAndDelete(courseId);
      
      return true;
    } catch (error) {
      logger.error(`Error al eliminar curso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agregar un módulo al curso
   * @param {string} courseId - ID del curso
   * @param {Object} moduleData - Datos del módulo
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Object} Curso actualizado
   */
  async addModule(courseId, moduleData, userId) {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos
      if (course.instructor.toString() !== userId && 
          !(await User.findOne({ _id: userId, role: 'admin' }))) {
        throw new ErrorResponse('No autorizado para modificar este curso', 403);
      }
      
      // Determinar orden automático si no se proporciona
      if (!moduleData.order) {
        moduleData.order = (course.modules.length > 0)
          ? Math.max(...course.modules.map(m => m.order)) + 1
          : 1;
      }
      
      // Agregar el módulo
      course.modules.push(moduleData);
      await course.save();
      
      return course;
    } catch (error) {
      logger.error(`Error al agregar módulo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar un módulo del curso
   * @param {string} courseId - ID del curso
   * @param {string} moduleId - ID del módulo
   * @param {Object} updateData - Datos a actualizar
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Object} Curso actualizado
   */
  async updateModule(courseId, moduleId, updateData, userId) {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos
      if (course.instructor.toString() !== userId && 
          !(await User.findOne({ _id: userId, role: 'admin' }))) {
        throw new ErrorResponse('No autorizado para modificar este curso', 403);
      }
      
      // Encontrar el módulo
      const moduleIndex = course.modules.findIndex(
        module => module._id.toString() === moduleId
      );
      
      if (moduleIndex === -1) {
        throw new ErrorResponse('Módulo no encontrado', 404);
      }
      
      // Actualizar campos del módulo
      Object.keys(updateData).forEach(key => {
        course.modules[moduleIndex][key] = updateData[key];
      });
      
      await course.save();
      
      return course;
    } catch (error) {
      logger.error(`Error al actualizar módulo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un módulo del curso
   * @param {string} courseId - ID del curso
   * @param {string} moduleId - ID del módulo
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Object} Curso actualizado
   */
  async deleteModule(courseId, moduleId, userId) {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos
      if (course.instructor.toString() !== userId && 
          !(await User.findOne({ _id: userId, role: 'admin' }))) {
        throw new ErrorResponse('No autorizado para modificar este curso', 403);
      }
      
      // Verificar si hay videos asociados al módulo
      const hasVideos = await Video.exists({ course: courseId, module: moduleId });
      
      if (hasVideos) {
        throw new ErrorResponse(
          'No se puede eliminar un módulo con videos asociados',
          400
        );
      }
      
      // Filtrar el módulo a eliminar
      course.modules = course.modules.filter(
        module => module._id.toString() !== moduleId
      );
      
      await course.save();
      
      return course;
    } catch (error) {
      logger.error(`Error al eliminar módulo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Agregar una reseña al curso
   * @param {string} courseId - ID del curso
   * @param {string} userId - ID del usuario
   * @param {number} rating - Calificación (1-5)
   * @param {string} comment - Comentario
   * @returns {Object} Curso actualizado
   */
  async addReview(courseId, userId, rating, comment) {
    try {
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar que el usuario esté matriculado
      const user = await User.findOne({
        _id: userId,
        'enrolledCourses.course': courseId,
      });
      
      if (!user) {
        throw new ErrorResponse(
          'Solo los estudiantes matriculados pueden dejar reseñas',
          403
        );
      }
      
      // Verificar si el usuario ya ha dejado una reseña
      const existingReviewIndex = course.reviews.findIndex(
        review => review.user.toString() === userId
      );
      
      if (existingReviewIndex !== -1) {
        // Actualizar reseña existente
        course.reviews[existingReviewIndex].rating = rating;
        course.reviews[existingReviewIndex].comment = comment;
      } else {
        // Agregar nueva reseña
        course.reviews.push({
          user: userId,
          rating,
          comment,
        });
      }
      
      // Recalcular calificación promedio
      course.calculateAverageRating();
      
      await course.save();
      
      return course;
    } catch (error) {
      logger.error(`Error al agregar reseña: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new CourseService();