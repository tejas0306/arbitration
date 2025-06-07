import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable logger in production for serverless
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : undefined,
  });
  
  // Security middleware
  app.use(helmet());
  
  // Compression for better performance
  app.use(compression());
  
  // Enable CORS for frontend - allow specific domains and credentials
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  console.log('Allowing CORS for:', frontendUrl);
  
  app.enableCors({
    origin: [
      frontendUrl,
      'https://arbitration-two.vercel.app',
      'https://arbitration-git-main-tejas0306s-projects.vercel.app',
      'https://arbitration-portal.vercel.app', 
      'http://localhost:3000',
      // Add a regex pattern to match all subdomains of vercel.app
      /https:\/\/arbitration-.*\.vercel\.app$/
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 3600, // 1 hour
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
