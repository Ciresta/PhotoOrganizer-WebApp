// backend/swagger.js

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Define the Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Photo Organizer API',
    version: '1.0.0',
    description: 'API documentation for the PhotoOrganizer WebApp',
  },
  servers: [
    {
      url: 'https://photoorganizer.netlify.app/api', // Change this URL to match your production server if deployed
    },
  ],
};

// Options for Swagger JSDoc
const options = {
  swaggerDefinition,
  apis: ['./controllers/*.js','./models/*.js'], // Path to your controller files that contain JSDoc comments
};

// Generate Swagger Specification
const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
