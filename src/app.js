const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');
const swaggerSetup = require('./config/swagger');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const videoRoutes = require('./routes/videoRoutes');

// Cargar variables de entorno
require('dotenv').config();

// Conectar a la base de datos
connectDB();

const app = express();

// Configuración del rate limiter
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000, // 15 minutos por defecto
  max: process.env.RATE_LIMIT_MAX || 100, // Límite de 100 solicitudes por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo después',
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(helmet()); // Seguridad mediante cabeceras HTTP
app.use(morgan('dev')); // Logging
app.use(limiter); // Aplicar rate limiting

// Configurar Swagger
swaggerSetup(app);

// Prefijo para todas las rutas
const apiPrefix = process.env.API_PREFIX || '/api';

// Rutas
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/users`, userRoutes);
app.use(`${apiPrefix}/courses`, courseRoutes);
app.use(`${apiPrefix}/videos`, videoRoutes);

// Ruta base para verificar que la API está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'API de PANATRI funcionando correctamente' });
});

// Middleware para manejar rutas no encontradas
app.use(notFound);

// Middleware para manejar errores
app.use(errorHandler);

module.exports = app;