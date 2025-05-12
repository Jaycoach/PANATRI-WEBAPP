const Video = require('../models/videoModel');
const Course = require('../models/courseModel');
const User = require('../models/userModel');
const ErrorResponse = require('../utils/errorResponse');
const { logger } = require('../utils/logger');
const { getSignedUrl, deleteFileFromS3 } = require('../config/aws');

/**
 * Servicio para manejar operaciones relacionadas con videos
 */
class VideoService {
  /**
   * Obtener videos de un curso con paginación
   * @param {string} courseId - ID del curso
   * @param {Object} queryParams - Parámetros de consulta
   * @returns {Object} Videos y metadatos de paginación
   */
  async getVideos(courseId, queryParams) {
    try {
      const page = parseInt(queryParams.page, 10) || 1;
      const limit = parseInt(queryParams.limit, 10) || 10;
      const startIndex = (page - 1) * limit;
      
      // Verificar que el curso exista y esté publicado
      const course = await Course.findOne({
        _id: courseId,
        isPublished: true,
      });
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado o no disponible', 404);
      }
      
      // Construir consulta para videos
      const query = {
        course: courseId,
        isPublished: true,
      };
      
      // Filtrar por módulo si se proporciona
      if (queryParams.module) {
        query.module = queryParams.module;
      }
      
      // Contar documentos totales para la paginación
      const total = await Video.countDocuments(query);
      
      // Ejecutar la consulta con paginación
      const videos = await Video.find(query)
        .sort({ order: 1 })
        .skip(startIndex)
        .limit(limit)
        .select('title description thumbnail duration order');
      
      // Construir respuesta con metadatos de paginación
      const pagination = {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      };
      
      return {
        videos,
        pagination,
      };
    } catch (error) {
      logger.error(`Error al obtener videos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener un video por su ID
   * @param {string} videoId - ID del video
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Object} Video con URL firmada para reproducción
   */
  async getVideoById(videoId, userId) {
    try {
      // Buscar el video
      const video = await Video.findById(videoId);
      
      if (!video) {
        throw new ErrorResponse('Video no encontrado', 404);
      }
      
      // Buscar el curso asociado
      const course = await Course.findById(video.course);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar que el video esté publicado
      if (!video.isPublished) {
        // Si es instructor o admin, permitir acceso
        const user = await User.findById(userId);
        
        if (!user || (user.role !== 'admin' && course.instructor.toString() !== userId)) {
          throw new ErrorResponse('Video no disponible', 404);
        }
      }
      
      // Verificar que el usuario tenga acceso al curso
      let hasAccess = false;
      let isInstructor = false;
      
      if (userId) {
        const user = await User.findById(userId);
        
        if (user) {
          // Es el instructor o admin
          if (user.role === 'admin' || course.instructor.toString() === userId) {
            hasAccess = true;
            isInstructor = true;
          } else {
            // Verificar si está matriculado
            const enrollment = user.enrolledCourses.find(
              enrollment => enrollment.course.toString() === course._id.toString()
            );
            
            if (enrollment) {
              hasAccess = true;
              
              // Incrementar vistas
              await video.incrementViews(userId);
            }
          }
        }
      }
      
      if (!hasAccess) {
        throw new ErrorResponse('No tienes acceso a este video', 403);
      }
      
      // Generar URL firmada para reproducción
      const videoUrl = getSignedUrl(video.s3Key, 3600); // 1 hora de validez
      
      // Obtener progreso del usuario si no es instructor
      let progress = 0;
      let completed = false;
      
      if (!isInstructor) {
        const userView = video.viewHistory.find(
          view => view.user.toString() === userId
        );
        
        if (userView) {
          progress = userView.progress;
          completed = userView.completed;
        }
      }
      
      // Devolver datos del video con URL firmada
      return {
        ...video.toObject(),
        videoUrl,
        progress,
        completed,
      };
    } catch (error) {
      logger.error(`Error al obtener video: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear un nuevo video
   * @param {Object} videoData - Datos del video
   * @param {string} s3Key - Clave del objeto en S3
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Object} Video creado
   */
  async createVideo(videoData, s3Key, userId) {
    try {
      // Verificar que el curso exista
      const course = await Course.findById(videoData.course);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos (solo el instructor del curso o un admin pueden crear videos)
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }
      
      if (user.role !== 'admin' && course.instructor.toString() !== userId) {
        throw new ErrorResponse('No autorizado para agregar videos a este curso', 403);
      }
      
      // Verificar si existe el módulo, si se proporciona
      if (videoData.module) {
        const moduleExists = course.modules.some(
          module => module._id.toString() === videoData.module
        );
        
        if (!moduleExists) {
          throw new ErrorResponse('Módulo no encontrado', 404);
        }
      }
      
      // Determinar orden automático si no se proporciona
      if (!videoData.order) {
        const lastVideo = await Video.findOne({ course: videoData.course })
          .sort({ order: -1 })
          .limit(1);
        
        videoData.order = lastVideo ? lastVideo.order + 1 : 1;
      }
      
      // Crear el video
      const video = await Video.create({
        ...videoData,
        s3Key,
      });
      
      return video;
    } catch (error) {
      logger.error(`Error al crear video: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar un video existente
   * @param {string} videoId - ID del video
   * @param {Object} updateData - Datos a actualizar
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Object} Video actualizado
   */
  async updateVideo(videoId, updateData, userId) {
    try {
      // Buscar el video
      const video = await Video.findById(videoId);
      
      if (!video) {
        throw new ErrorResponse('Video no encontrado', 404);
      }
      
      // Buscar el curso asociado
      const course = await Course.findById(video.course);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }
      
      if (user.role !== 'admin' && course.instructor.toString() !== userId) {
        throw new ErrorResponse('No autorizado para modificar este video', 403);
      }
      
      // Verificar si se cambia el módulo
      if (updateData.module) {
        const moduleExists = course.modules.some(
          module => module._id.toString() === updateData.module
        );
        
        if (!moduleExists) {
          throw new ErrorResponse('Módulo no encontrado', 404);
        }
      }
      
      // Actualizar el video
      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );
      
      return updatedVideo;
    } catch (error) {
      logger.error(`Error al actualizar video: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar un video
   * @param {string} videoId - ID del video
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {boolean} Éxito de la operación
   */
  async deleteVideo(videoId, userId) {
    try {
      // Buscar el video
      const video = await Video.findById(videoId);
      
      if (!video) {
        throw new ErrorResponse('Video no encontrado', 404);
      }
      
      // Buscar el curso asociado
      const course = await Course.findById(video.course);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }
      
      if (user.role !== 'admin' && course.instructor.toString() !== userId) {
        throw new ErrorResponse('No autorizado para eliminar este video', 403);
      }
      
      // Eliminar el video de S3 si existe la clave
      if (video.s3Key) {
        await deleteFileFromS3(video.s3Key);
      }
      
      // Eliminar el video de la base de datos
      await Video.findByIdAndDelete(videoId);
      
      return true;
    } catch (error) {
      logger.error(`Error al eliminar video: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar el progreso de visualización de un video
   * @param {string} videoId - ID del video
   * @param {string} userId - ID del usuario
   * @param {number} progress - Porcentaje de progreso (0-100)
   * @returns {Object} Estado actualizado del progreso
   */
  async updateVideoProgress(videoId, userId, progress) {
    try {
      // Validar parámetros
      if (progress < 0 || progress > 100) {
        throw new ErrorResponse('El progreso debe estar entre 0 y 100', 400);
      }
      
      // Buscar el video
      const video = await Video.findById(videoId);
      
      if (!video) {
        throw new ErrorResponse('Video no encontrado', 404);
      }
      
      // Verificar que el usuario tenga acceso al video
      const user = await User.findOne({
        _id: userId,
        'enrolledCourses.course': video.course,
      });
      
      if (!user) {
        throw new ErrorResponse('No tienes acceso a este video', 403);
      }
      
      // Determinar si el video está completado (si se vio al menos el 90%)
      const completed = progress >= 90;
      
      // Actualizar el progreso del video
      await video.updateProgress(userId, progress, completed);
      
      return {
        videoId,
        progress,
        completed,
      };
    } catch (error) {
      logger.error(`Error al actualizar progreso de video: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener una URL firmada para subir un video a S3
   * @param {string} fileName - Nombre del archivo
   * @param {string} fileType - Tipo MIME del archivo
   * @param {string} courseId - ID del curso
   * @param {string} userId - ID del usuario (para verificar permisos)
   * @returns {Object} URL firmada para subida directa
   */
  async getVideoUploadUrl(fileName, fileType, courseId, userId) {
    try {
      // Verificar que el curso exista
      const course = await Course.findById(courseId);
      
      if (!course) {
        throw new ErrorResponse('Curso no encontrado', 404);
      }
      
      // Verificar permisos
      const user = await User.findById(userId);
      
      if (!user) {
        throw new ErrorResponse('Usuario no encontrado', 404);
      }
      
      if (user.role !== 'admin' && course.instructor.toString() !== userId) {
        throw new ErrorResponse('No autorizado para subir videos a este curso', 403);
      }
      
      // Verificar tipo de archivo permitido
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
      
      if (!allowedTypes.includes(fileType)) {
        throw new ErrorResponse('Tipo de archivo no permitido', 400);
      }
      
      // Generar clave única para S3
      const s3Key = `videos/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
      
      // En una implementación real, aquí se generaría una URL firmada de S3
      // para que el cliente pueda subir directamente el archivo
      
      return {
        uploadUrl: 'https://ejemplo-s3-upload-url.com', // Placeholder
        s3Key,
        expiresIn: 3600, // 1 hora para subir
      };
    } catch (error) {
      logger.error(`Error al generar URL de subida: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new VideoService();