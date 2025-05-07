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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Global prefix - only in standalone mode
  if (process.env.NODE_ENV !== 'production') {
    app.setGlobalPrefix('api');
  }
  
  // Only listen to port in development, not in serverless environment
  if (process.env.NODE_ENV !== 'production') {
    await app.listen(process.env.PORT || 3001);
    console.log(`Application is running on: ${await app.getUrl()}`);
  }
  
  return app;
}

// Only run bootstrap immediately in non-production
if (process.env.NODE_ENV !== 'production') {
  bootstrap();
}
