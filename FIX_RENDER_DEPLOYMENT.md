# Fixing Render Deployment Issues

This document details the steps to fix deployment issues for the NestJS backend on Render.

## Current Issues

1. **Memory Issues**: JavaScript heap out of memory during build or startup
2. **Module Not Found**: `Cannot find module '/opt/render/project/src/backend/dist/main'`
3. **TypeScript Error**: Error in health check implementation

## Changes Made

### 1. Updated package.json

- Modified `build` script to use the correct NestJS CLI path
- Added `.js` extension to `start:prod` script for clarity
- Created `start:render` script with memory allocation settings:
  ```json
  "start:render": "NODE_OPTIONS=\"--max-old-space-size=2048\" node dist/main.js"
  ```

### 2. Created render.yaml

Created a configuration file to explicitly define how Render should build and run the service:

```yaml
services:
  - type: web
    name: arbitration-api
    env: node
    rootDir: backend
    buildCommand: |
      npm install
      ls -la  # Debug the files in the directory
      npm run build
      ls -la dist # Debug the build output
      find . -name "main.js" # Find where main.js is located
    startCommand: |
      ls -la # Check files before starting
      ls -la dist || true # Check if dist exists (won't fail if not)
      npm run start:render
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: RENDER
        value: true
    healthCheckPath: /api/health
```

### 3. Added Health Check Controller

Created a proper NestJS health check controller:

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  healthCheck() {
    return { status: 'ok' };
  }
}
```

And registered it in a module:

```typescript
// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

Then imported it in the app module:

```typescript
// src/app.module.ts
@Module({
  imports: [
    // ... other modules
    HealthModule,
  ],
})
export class AppModule {}
```

## How to Fix the Deployment

### Option 1: Using Blueprint (Recommended)

1. Commit and push all the changes to your GitHub repository
2. In Render dashboard, delete the current failing service
3. Create a new Web Service using the "Blueprint" option
4. Connect your GitHub repository
5. Render will use the `render.yaml` configuration
6. Add your database and security environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`

### Option 2: Manual Configuration

If you prefer to configure manually:

1. In Render dashboard, delete the current failing service
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure with these exact settings:
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:render`
   - **Health Check Path**: /api/health
5. Add the required environment variables

## Verification

After deployment:

1. Check the build logs for any errors
2. Verify the service is running by accessing the health endpoint at `/api/health`
3. Test API endpoints from your frontend or using a tool like Postman
4. Monitor the service in Render dashboard for any issues 