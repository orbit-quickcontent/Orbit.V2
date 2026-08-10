import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'ORBIT Partner Tracking & Dispatch API',
    version: '1.0.0',
    description: 'Production-grade real-time nearby partner tracking and dispatch system for ORBIT platform.',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
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
    schemas: {
      PartnerLocation: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'number', example: 19.076 },
          longitude: { type: 'number', example: 72.8777 },
          speed: { type: 'number', example: 32 },
          heading: { type: 'number', example: 140 },
        },
      },
      NearbyPartner: {
        type: 'object',
        properties: {
          partnerId: { type: 'string', example: 'p1' },
          name: { type: 'string', example: 'Rahul Sharma' },
          phone: { type: 'string', example: '+919876543210' },
          latitude: { type: 'number', example: 19.076 },
          longitude: { type: 'number', example: 72.8777 },
          distanceKm: { type: 'number', example: 1.2 },
          etaMinutes: { type: 'number', example: 4 },
          rating: { type: 'number', example: 4.8 },
          status: { type: 'string', example: 'ONLINE' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'b100' },
          clientId: { type: 'string', example: 'c1' },
          partnerId: { type: 'string', example: 'p1', nullable: true },
          pickupLat: { type: 'number', example: 19.0728 },
          pickupLng: { type: 'number', example: 72.8826 },
          destinationLat: { type: 'number', example: 19.1197 },
          destinationLng: { type: 'number', example: 72.905 },
          status: { type: 'string', example: 'PENDING' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/partner/location': {
      post: {
        summary: 'Update continuous partner location',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PartnerLocation' },
            },
          },
        },
        responses: {
          '200': { description: 'Location recorded and published successfully' },
          '401': { description: 'Unauthorized' },
          '422': { description: 'GPS spoofing detected' },
        },
      },
    },
    '/partners/nearby': {
      get: {
        summary: 'Get nearby partners sorted by ETA',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'radius', in: 'query', required: false, schema: { type: 'number', default: 5 } },
        ],
        responses: {
          '200': {
            description: 'Array of nearby partners sorted by ETA',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/NearbyPartner' },
                },
              },
            },
          },
        },
      },
    },
    '/bookings': {
      post: {
        summary: 'Create booking and trigger partner dispatch engine',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pickupLat', 'pickupLng', 'destinationLat', 'destinationLng'],
                properties: {
                  pickupLat: { type: 'number' },
                  pickupLng: { type: 'number' },
                  destinationLat: { type: 'number' },
                  destinationLng: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Booking created and dispatch started' },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
