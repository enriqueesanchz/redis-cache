const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mi API',
      version: '1.0.0',
      description: 'Documentación de mi API',
    },
  },
  // Rutas de tu API a documentar
  apis: ['./index.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;