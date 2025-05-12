const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Configuración de Swagger para la documentación de la API
 * @param {Object} app - Instancia de Express
 */
const swaggerSetup = (app) => {
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'API de PANATRI',
        version: '1.0.0',
        description: 'API para la plataforma de cursos de panadería PANATRI',
        contact: {
          name: 'Soporte PANATRI',
          email: 'soporte@panatri.com',
        },
        license: {
          name: 'Propietario - PANATRI SAS',
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 5000}${process.env.API_PREFIX || '/api'}`,
          description: 'Servidor de desarrollo',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      tags: [
        {
          name: 'Auth',
          description: 'Endpoints de autenticación',
        },
        {
          name: 'Users',
          description: 'Operaciones con usuarios',
        },
        {
          name: 'Courses',
          description: 'Gestión de cursos y rutas de aprendizaje',
        },
        {
          name: 'Videos',
          description: 'Gestión y reproducción de videos',
        },
      ],
    },
    apis: [
      './src/routes/*.js',
      './src/models/*.js',
      './src/docs/*.js'
    ],
  };

  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};

module.exports = swaggerSetup;