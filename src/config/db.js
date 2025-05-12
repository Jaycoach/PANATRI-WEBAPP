const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

/**
 * Conectar a la base de datos MongoDB
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error al conectar a MongoDB: ${error.message}`);
    throw new Error(`Error al conectar a MongoDB: ${error.message}`);
  }
};

module.exports = connectDB;
