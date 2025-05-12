const User = require('../models/userModel');
const Course = require('../models/courseModel');
const Video = require('../models/videoModel');
const ErrorResponse = require('../utils/errorResponse');
const { logger } = require('../utils/logger');

/**
 * Servicio para manejar operaciones relacionadas con usuarios
 */
class UserService {
  /**
   * Obtener perfil del usuario
   * @param {string} userId - ID del usuario
   * @returns {Object} Perfil del usuario
   */
  async getUserProfile(userId) {
    try {
      const user = await User.findById(userId)
        .select('-password -resetPasswordToken -resetPasswordExpire')
        .populate({
          path: 'enrolledCourses.course',
          select: 'title thumbnail level',
        });

      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }

      return user;
    } catch (error) {
      logger.error(`Error al obtener perfil de usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar perfil del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Object} Perfil actualizado
   */
  async updateUserProfile(userId, updateData) {
    try {
      // Campos permitidos para actualizar
      const allowedUpdates = ['name', 'profileImage'];

      // Filtrar solo los campos permitidos
      const filteredData = Object.keys(updateData)
        .filter((key) => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      if (Object.keys(filteredData).length === 0) {
        throw new ErrorResponse('No se proporcionaron campos válidos para actualizar', 400);
      }

      const user = await User.findByIdAndUpdate(userId, filteredData, {
        new: true,
        runValidators: true,
      }).select('-password -resetPasswordToken -resetPasswordExpire');

      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }

      return user;
    } catch (error) {
      logger.error(`Error al actualizar perfil de usuario: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cambiar contraseña del usuario
   * @param {string} userId - ID del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {string} Mensaje de éxito
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');

      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }

      // Verificar contraseña actual
      const isMatch = await user.matchPassword(currentPassword);

      if (!isMatch) {
        throw new ErrorResponse('Contraseña actual incorrecta', 401);
      }

      // Establecer nueva contraseña
      user.password = newPassword;
      await user.save();

      return 'Contraseña actualizada exitosamente';
    } catch (error) {
      logger.error(`Error al cambiar contraseña: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener cursos matriculados por el usuario
   * @param {string} userId - ID del usuario
   * @returns {Array} Lista de cursos matriculados
   */
  async getEnrolledCourses(userId) {
    try {
      const user = await User.findById(userId)
        .select('enrolledCourses')
        .populate({
          path: 'enrolledCourses.course',
          select: 'title description thumbnail level instructor',
          populate: {
            path: 'instructor',
            select: 'name',
          },
        });

      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }

      return user.enrolledCourses;
    } catch (error) {
      logger.error(`Error al obtener cursos matriculados: ${error.message}`);
      throw error;
    }
  }

  /**
   * Matricular usuario en un curso
   * @param {string} userId - ID del usuario
   * @param {string} courseId - ID del curso
   * @returns {Object} Información de la matrícula
   */
  async enrollInCourse(userId, courseId) {
    try {
      // Verificar si el curso existe y está publicado
      const course = await Course.findOne({ _id: courseId, isPublished: true });

      if (!course) {
        throw new ErrorResponse('Curso no encontrado o no disponible', 404);
      }

      // Verificar si el usuario ya está matriculado
      const user = await User.findById(userId);

      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }

      const isEnrolled = user.enrolledCourses.some(
        (enrollment) => enrollment.course.toString() === courseId
      );

      if (isEnrolled) {
        throw new ErrorResponse('El usuario ya está matriculado en este curso', 400);
      }

      // Matricular al usuario
      user.enrolledCourses.push({
        course: courseId,
        progress: 0,
        dateEnrolled: Date.now(),
      });

      // Incrementar contador de matrículas del curso
      course.enrollmentCount += 1;

      // Guardar cambios
      await Promise.all([user.save(), course.save()]);

      return {
        message: 'Matriculado exitosamente',
        courseTitle: course.title,
        enrollmentDate: new Date(),
      };
    } catch (error) {
      logger.error(`Error al matricular en curso: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar progreso del usuario en un curso
   * @param {string} userId - ID del usuario
   * @param {string} courseId - ID del curso
   * @param {string} videoId - ID del video
   * @param {number} progress - Porcentaje de progreso (0-100)
   * @returns {Object} Progreso actualizado
   */
  async updateCourseProgress(userId, courseId, videoId, progress) {
    try {
      // Validar video y curso
      const video = await Video.findOne({ _id: videoId, course: courseId });

      if (!video) {
        throw new ErrorResponse('Video no encontrado para este curso', 404);
      }

      // Actualizar progreso del video
      const completed = progress >= 90; // Consideramos completado si vio al menos el 90%
      await video.updateProgress(userId, progress, completed);

      // Calcular progreso general del curso
      const user = await User.findById(userId);

      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }

      // Buscar todos los videos del curso
      const allVideos = await Video.find({ course: courseId });
      const totalVideos = allVideos.length;

      if (totalVideos === 0) {
        throw new ErrorResponse('El curso no tiene videos disponibles', 404);
      }

      // Contar videos completados
      let completedVideos = 0;
      allVideos.forEach((video) => {
        const userView = video.viewHistory.find(
          (view) => view.user.toString() === userId && view.completed
        );
        if (userView) {
          completedVideos += 1;
        }
      });

      // Calcular porcentaje general de progreso
      const overallProgress = Math.round((completedVideos / totalVideos) * 100);

      // Actualizar progreso en el curso matriculado
      const enrollmentIndex = user.enrolledCourses.findIndex(
        (enrollment) => enrollment.course.toString() === courseId
      );

      if (enrollmentIndex === -1) {
        throw new ErrorResponse('Usuario no matriculado en este curso', 400);
      }

      user.enrolledCourses[enrollmentIndex].progress = overallProgress;
      user.enrolledCourses[enrollmentIndex].lastAccessed = Date.now();

      await user.save();

      return {
        videoProgress: progress,
        videoCompleted: completed,
        courseProgress: overallProgress,
        completedVideos,
        totalVideos,
      };
    } catch (error) {
      logger.error(`Error al actualizar progreso: ${error.message}`);
      throw error;
    }
  }
  /**
   * Cambiar el rol de un usuario (solo admin puede hacerlo)
   * @param {string} targetUserId - ID del usuario a modificar
   * @param {string} newRole - Nuevo rol (admin, instructor, user)
   * @param {string} adminId - ID del admin que hace el cambio
   * @returns {Object} Usuario actualizado
   */
  async changeUserRole(targetUserId, newRole, adminId) {
    try {
      // Verificar que quien realiza la acción es un admin
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        throw new ErrorResponse('No autorizado para realizar esta acción', 403);
      }

      // Validar que el rol es válido
      const validRoles = ['user', 'admin', 'instructor'];
      if (!validRoles.includes(newRole)) {
        throw new ErrorResponse('Rol inválido', 400);
      }

      // Actualizar el rol del usuario
      const user = await User.findByIdAndUpdate(
        targetUserId,
        { role: newRole },
        {
          new: true,
          runValidators: true,
        }
      ).select('-password -resetPasswordToken -resetPasswordExpire');

      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }

      return user;
    } catch (error) {
      logger.error(`Error al cambiar rol de usuario: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new UserService();
