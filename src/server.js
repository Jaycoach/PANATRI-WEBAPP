const app = require('./app');
const http = require('http');
const { logger } = require('./utils/logger');

// Cargar variables de entorno si no se ha hecho ya
require('dotenv').config();

// Obtener el puerto del servidor desde las variables de entorno o usar 5000 como valor predeterminado
const PORT = process.env.PORT || 5000;

// Crear servidor HTTP
const server = http.createServer(app);

// Manejador de eventos para cerrar el servidor correctamente
process.on('unhandledRejection', (err) => {
  logger.error(`Error no manejado: ${err.message}`);
  // Cerrar el servidor y salir del proceso
  server.close(() => process.exit(1));
});

// Iniciar el servidor
server.listen(PORT, () => {
  logger.info(`Servidor ejecutándose en el puerto ${PORT} en modo ${process.env.NODE_ENV}`);
  logger.info(`Documentación de la API disponible en http://localhost:${PORT}/api-docs`);
});

// Exportar el servidor para pruebas
module.exports = server;