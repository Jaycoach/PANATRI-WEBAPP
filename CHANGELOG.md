# Registro de cambios

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-05-12

### Añadido
- Estructura inicial del proyecto
- Configuración básica de Express
- Modelos de base de datos para usuarios, cursos y videos
- Sistema de autenticación con JWT
- Controladores y rutas para gestión de usuarios
- Documentación inicial con Swagger
- Integración con AWS S3 para almacenamiento de videos
- Middlewares de seguridad (protección CSRF, rate limiting, validación)

### Por implementar
- Sistema completo de reproducción de videos con CloudFront
- Panel de administración para gestión de contenidos
- Rutas de aprendizaje y seguimiento de progreso
- Integración con sistema de pagos
- Certificaciones automáticas