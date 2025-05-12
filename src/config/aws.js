const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { logger } = require('../utils/logger');

// Asegurarse de que el directorio de uploads existe
const uploadDir = path.join(__dirname, '../../uploads/videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar multer para almacenamiento local
const uploadLocal = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, fileName);
    },
  }),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500000000, // 500MB por defecto
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const filetypes = /mp4|mov|avi|wmv|flv|mkv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error('Error: Solo se permiten archivos de video (mp4, mov, avi, wmv, flv, mkv)'));
  },
});

/**
 * Obtener URL local para reproducción de video
 * @param {string} key - Nombre del archivo
 * @returns {string} URL local
 */
const getLocalUrl = (key) => {
  try {
    return `/api/videos/stream/${key}`;
  } catch (error) {
    logger.error(`Error al generar URL local: ${error.message}`);
    throw new Error('No se pudo generar la URL para el video');
  }
};

/**
 * Eliminar un archivo local
 * @param {string} key - Nombre del archivo
 * @returns {Promise<boolean>} Éxito de la operación
 */
const deleteLocalFile = async (key) => {
  try {
    const filePath = path.join(uploadDir, path.basename(key));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    logger.error(`Error al eliminar archivo local: ${error.message}`);
    throw new Error('No se pudo eliminar el archivo');
  }
};

module.exports = {
  uploadToS3: uploadLocal,
  getSignedUrl: getLocalUrl,
  deleteFileFromS3: deleteLocalFile,
  s3: null, // No utilizado en implementación local
};
