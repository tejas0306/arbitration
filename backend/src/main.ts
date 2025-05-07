import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import * as compression from 'compression';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable logger in production for serverless
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : undefined,
  });
  
  // Security middleware
  app.use(helmet());
  
  // Compression for better performance
  app.use(compression());
  
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://arbitration-portal.vercel.app'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Global prefix for API routes
  app.setGlobalPrefix('api');
  
  // We cannot add route handlers directly, we need to use controllers
  // Health check endpoint will be defined in a dedicated controller
  
  // Always listen to port in Render environment
  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0'; // Bind to all interfaces
  await app.listen(port, host);
  console.log(`Application is running on http://${host}:${port}`);
  
  return app;
}

// Run bootstrap in all environments
bootstrap();
