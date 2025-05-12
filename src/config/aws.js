const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

// Configurar AWS con las credenciales
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Crear instancia de S3
const s3 = new AWS.S3();

// Crear instancia de CloudFront para firmar URLs
const cloudFront = new AWS.CloudFront.Signer(
  process.env.CLOUDFRONT_KEY_PAIR_ID,
  process.env.CLOUDFRONT_PRIVATE_KEY_PATH
);

/**
 * Configurar multer para subir archivos a S3
 */
const uploadToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: 'private', // Privado para mayor seguridad
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      // Generar nombre único con uuid para evitar colisiones
      const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
      const fullPath = `videos/${fileName}`;
      cb(null, fullPath);
    },
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    }
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
  }
});

/**
 * Obtener URL firmada de CloudFront para reproducción segura
 * @param {string} s3Key - Clave del objeto en S3
 * @param {number} expiresIn - Tiempo de expiración en segundos
 * @returns {string} URL firmada
 */
const getSignedUrl = (s3Key, expiresIn = 3600) => {
  try {
    const resourceUrl = `${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`;
    const expires = Math.floor(Date.now() / 1000) + expiresIn;

    const signedUrl = cloudFront.getSignedUrl({
      url: resourceUrl,
      expires: expires,
    });

    return signedUrl;
  } catch (error) {
    logger.error(`Error al generar URL firmada: ${error.message}`);
    throw new Error('No se pudo generar la URL firmada para el video');
  }
};

/**
 * Eliminar un archivo de S3
 * @param {string} key - Clave del objeto en S3
 * @returns {Promise<Object>} Respuesta de S3
 */
const deleteFileFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    return await s3.deleteObject(params).promise();
  } catch (error) {
    logger.error(`Error al eliminar archivo de S3: ${error.message}`);
    throw new Error('No se pudo eliminar el archivo de S3');
  }
};

module.exports = {
  uploadToS3,
  getSignedUrl,
  deleteFileFromS3,
  s3,
};