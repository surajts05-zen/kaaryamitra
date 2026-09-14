import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import swaggerUi from 'swagger-ui-express';
import express, { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

export const registry = new OpenAPIRegistry();

// Define security schemes
registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

registry.registerComponent('securitySchemes', 'apiKeyAuth', {
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key',
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'KaaryaMitra API',
      description: 'API documentation for KaaryaMitra HR & Payroll System',
    },
    servers: [{ url: '/api/v1' }],
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
  });
}

export const openapiRouter = Router();

// Swagger UI route (requires authentication)
openapiRouter.use(
  '/',
  swaggerUi.serve,
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Generate document dynamically to catch all registrations
    const document = generateOpenApiDocument();
    swaggerUi.setup(document, {
      customSiteTitle: 'KaaryaMitra API Docs',
      customCss: '.swagger-ui .topbar { display: none }',
    })(req, res, next);
  }
);
