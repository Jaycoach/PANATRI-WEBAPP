# PANATRI API

API RESTful para la plataforma de cursos de panadería PANATRI, que permite la reproducción segura de videos en línea por suscripción.

## Descripción

Esta API proporciona todas las funcionalidades del backend para la plataforma PANATRI, incluyendo:

- Sistema de autenticación y gestión de usuarios
- Gestión de cursos y rutas de aprendizaje
- Sistema de reproducción optimizado de videos con CDN
- Panel de administración para la carga y gestión de contenidos

## Tecnologías

- **Node.js y Express**: Marco de trabajo para el servidor
- **MongoDB**: Base de datos NoSQL
- **JWT**: Autenticación basada en tokens
- **AWS S3 y CloudFront**: Almacenamiento y distribución de videos
- **Swagger/OpenAPI**: Documentación de API
- **Jest**: Framework de pruebas

## Requisitos previos

- Node.js (v16+)
- MongoDB
- Cuenta AWS (para S3 y CloudFront)
- Git

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/panatri-api.git
cd panatri-api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar el archivo .env con tus configuraciones

# Iniciar el servidor en modo desarrollo
npm run dev
```

## Estructura del proyecto

```
panatri-api/
├── src/                    # Código fuente
│   ├── config/             # Configuraciones
│   ├── controllers/        # Controladores
│   ├── middleware/         # Middleware personalizado
│   ├── models/             # Modelos de datos
│   ├── routes/             # Definición de rutas
│   ├── services/           # Servicios
│   ├── utils/              # Utilidades
│   ├── docs/               # Documentación Swagger
│   ├── tests/              # Pruebas
│   ├── app.js              # Aplicación Express
│   └── server.js           # Punto de entrada
├── .env.example            # Ejemplo de variables de entorno
├── .eslintrc.json          # Configuración ESLint
├── .gitignore              # Archivos ignorados por Git
├── .prettierrc             # Configuración Prettier
├── CHANGELOG.md            # Registro de cambios
├── package.json            # Dependencias y scripts
└── README.md               # Documentación principal
```

## Endpoints principales

La documentación completa de la API está disponible en la ruta `/api-docs` cuando el servidor está en ejecución.

- **Autenticación**
  - POST /api/auth/register - Registrar nuevo usuario
  - POST /api/auth/login - Iniciar sesión
  - POST /api/auth/refresh-token - Refrescar token

- **Usuarios**
  - GET /api/users/profile - Obtener perfil de usuario
  - PUT /api/users/profile - Actualizar perfil

- **Cursos**
  - GET /api/courses - Listar cursos
  - GET /api/courses/:id - Obtener detalles de un curso
  - POST /api/courses - Crear un curso (admin)
  - PUT /api/courses/:id - Actualizar un curso (admin)
  - DELETE /api/courses/:id - Eliminar un curso (admin)

- **Videos**
  - GET /api/videos/:id - Obtener información de video
  - POST /api/videos - Subir un video (admin)
  - GET /api/videos/:id/stream - Reproducir un video

## Scripts disponibles

- `npm run dev`: Inicia el servidor en modo desarrollo con recarga automática
- `npm start`: Inicia el servidor en modo producción
- `npm test`: Ejecuta todas las pruebas
- `npm run lint`: Verifica el estilo del código con ESLint
- `npm run lint:fix`: Corrige automáticamente problemas de estilo

## Seguridad

Esta API implementa múltiples capas de seguridad:

- Autenticación con JWT
- Protección contra inyección SQL
- Validación de datos de entrada
- Límite de tasa de solicitudes (rate limiting)
- Protección contra ataques CSRF
- Cabeceras de seguridad con Helmet
- Encriptación de contraseñas con bcrypt

## Contribuir

1. Haz un fork del repositorio
2. Crea una rama para tu función (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un nuevo Pull Request

## Licencia

Este proyecto es propiedad de PANATRI SAS y está protegido por derechos de autor.