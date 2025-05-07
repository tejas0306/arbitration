# Fixing Render Deployment Issues

This document details the steps to fix deployment issues for the NestJS backend on Render.

## Current Issues

1. **Memory Issues**: JavaScript heap out of memory during build or startup
2. **Module Not Found**: `Cannot find module '/opt/render/project/src/backend/dist/main'`
3. **TypeScript Error**: Error in health check implementation
4. **Module Import Error**: Non-existent module import
5. **Build Output Path**: The build output is in dist/src/main.js instead of dist/main.js
6. **Network Binding**: Application not binding to all interfaces for external connections

## Changes Made

### 1. Updated package.json

- Modified `build` script to use the correct NestJS CLI path
- Updated `start:prod` and `start:render` scripts to use the correct path to main.js:
  ```json
  "start:prod": "node dist/src/main.js",
  "start:render": "NODE_OPTIONS=\"--max-old-space-size=2048\" node dist/src/main.js"
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
      find dist -name "main.js" # Find where main.js is located
    startCommand: |
      ls -la # Check files before starting
      ls -la dist/src || true # Check if dist/src exists (won't fail if not)
      echo "Network interfaces:"
      ifconfig || ip addr # Print network interfaces for debugging
      echo "Starting server with NODE_OPTIONS and host 0.0.0.0..."
      HOST=0.0.0.0 NODE_OPTIONS="--max-old-space-size=2048" node dist/src/main.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: RENDER
        value: true
      - key: HOST
        value: 0.0.0.0
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

### 4. Fixed Module Import Error

Removed a non-existent module import from app.module.ts:

```typescript
// Removed this import as it doesn't exist
import { UserModule } from './user/user.module';

// And removed it from the imports array
@Module({
  imports: [
    // UserModule is removed, as it doesn't exist
    // ... other modules
  ],
})
```

### 5. Fixed Build Output Path

Updated all scripts and configurations to use the correct build output path `dist/src/main.js` instead of `dist/main.js`.

### 6. Fixed Network Binding

Updated the main.ts file to explicitly bind to all network interfaces:

```typescript
// Always listen to port in Render environment
const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0'; // Bind to all interfaces
await app.listen(port, host);
console.log(`Application is running on http://${host}:${port}`);
```

And removed the conditional startup that was preventing the app from listening in production:

```typescript
// Removed this conditional
// if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
//   ...
// }

// Changed to always run bootstrap
bootstrap();
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
   - **Start Command**: `HOST=0.0.0.0 NODE_OPTIONS="--max-old-space-size=2048" node dist/src/main.js`
   - **Health Check Path**: /api/health
5. Add the required environment variables

## Verification

After deployment:

1. Check the build logs for any errors
2. Verify the service is running by accessing the health endpoint at `/api/health`
3. Test API endpoints from your frontend or using a tool like Postman
4. Monitor the service in Render dashboard for any issues 