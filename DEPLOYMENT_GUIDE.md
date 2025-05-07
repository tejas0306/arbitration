# Deployment Guide for Arbitration Portal

This guide provides detailed instructions for deploying the Arbitration Portal application, which consists of a Next.js frontend and a NestJS backend.

## Current Deployment Options

### Option 1: Frontend-Only Deployment (Recommended for Quick Start)

For a quick start, you can deploy just the Next.js frontend to Vercel and connect it to your separately deployed backend API later.

1. **Run the static deployment script**:
   ```bash
   ./static-deploy.sh
   ```

   This script will:
   - Create an environment file with authentication checks disabled
   - Modify the build command to skip the backend build
   - Deploy only the Next.js frontend to Vercel

2. **Deploy your NestJS backend separately**:
   - Deploy the NestJS backend to a platform like Heroku, DigitalOcean, AWS, or another suitable platform
   - Update the `NEXT_PUBLIC_API_URL` environment variable in Vercel to point to your backend API

### Option 2: Manual Deployment to Vercel

If you prefer to manually deploy to Vercel:

1. **Push your code to GitHub** (if you haven't already)

2. **Connect to Vercel Dashboard**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Connect to your GitHub repository

3. **Configure Project Settings**:
   - Framework Preset: Next.js
   - Root Directory: `arbitration` (if that's your project root)
   - Build Command: `npx prisma generate && next build`
   - Output Directory: `.next`

4. **Add Environment Variables**:
   - `NEXT_PUBLIC_SKIP_AUTH_VERIFICATION`: `true`
   - `NEXT_PUBLIC_API_URL`: Your backend API URL

5. **Deploy**

## Troubleshooting

### NestJS Backend Build Issues

If you're trying to deploy both frontend and backend together on Vercel and encountering NestJS build issues:

1. **Local NestJS CLI Path**:
   - Update the build script in `backend/package.json` to use the local NestJS CLI:
     ```json
     "build": "node node_modules/.bin/nest build"
     ```

2. **Simplify Build Process**:
   - Consider deploying the backend separately from the frontend
   - For full-stack Vercel deployment, you may need to adapt your NestJS backend to run as serverless functions

### Module Resolution Issues

If you encounter "Module not found" errors during deployment:

1. **Check Import Paths**:
   - Ensure all your imports use the correct path aliases (e.g., `@/components/ui/button`)
   - Make sure all imported files actually exist in the specified locations

2. **Create Missing Components**:
   - If components like `@/components/ui/button` are missing, create them or install the required UI libraries

### Authentication Issues

If you encounter authentication issues in the deployed application:

1. **Enable Authentication Bypass for Testing**:
   - Set `NEXT_PUBLIC_SKIP_AUTH_VERIFICATION` to `true` in your environment variables
   - This will bypass authentication checks in the frontend

2. **Check API Connection**:
   - Ensure your `NEXT_PUBLIC_API_URL` is correctly pointing to your backend
   - Verify CORS settings in your backend to allow requests from your frontend domain

## Full Stack Deployment (Advanced)

For a complete deployment with both frontend and backend on Vercel:

1. **Adapt NestJS for Serverless**:
   - Modify your NestJS app to work in a serverless environment
   - Create serverless function handlers that interface with your NestJS app

2. **Use API Routes**:
   - Implement Next.js API routes that proxy requests to your NestJS app
   - Deploy the entire application as a single Vercel project

3. **Configure Resources Appropriately**:
   - Adjust function memory and timeout settings in `vercel.json` as needed
   - Consider performance implications of running NestJS in a serverless environment

## Recommended Approach

For most use cases, we recommend:

1. Deploy the Next.js frontend to Vercel
2. Deploy the NestJS backend to a dedicated hosting service (Heroku, DigitalOcean, AWS, etc.)
3. Connect the two by setting the `NEXT_PUBLIC_API_URL` environment variable in your Vercel project

This approach provides the best performance, scalability, and maintainability for your application.

## Deploying the Backend to Render

### Option 1: Using Blueprint (Recommended)

1. Create a `render.yaml` file in your repository root (already done)
2. In the Render dashboard, click "New Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the configuration from `render.yaml`
5. Set the required environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Secret for JWT token generation
   - `FRONTEND_URL`: Your Vercel frontend URL

### Option 2: Manual Configuration

If not using Blueprint, follow these steps:

1. In the Render dashboard, click "New Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: arbitration-api (or your preferred name)
   - **Root Directory**: backend
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `NODE_OPTIONS="--max-old-space-size=2048" npm run start:prod`
   - **Health Check Path**: /api/health

4. Add the required environment variables as listed above

### Troubleshooting Render Deployment

#### Memory Issues
If you encounter "JavaScript heap out of memory" errors:
- Set `NODE_OPTIONS="--max-old-space-size=2048"` in your Start Command
- Or add it as an environment variable

#### Module Not Found Errors
If you see "Cannot find module '/opt/render/project/src/backend/dist/main'":
- Make sure you've set the Root Directory to "backend"
- Check that your build is producing files in the expected location (dist/main.js)

#### Health Check Failures
If your service fails health checks:
- Verify the health check endpoint exists at /api/health
- Check the logs for other errors preventing startup

## Deploying the Frontend to Vercel

1. Connect your GitHub repository to Vercel
2. Set the required environment variables:
   - `NEXT_PUBLIC_API_URL`: URL to your Render backend API
   - `NEXT_PUBLIC_SKIP_AUTH_VERIFICATION`: Set to `true` for testing environments

3. Deploy your application

### Troubleshooting Vercel Deployment

#### Server Component Errors
If you encounter errors related to server components:
- Make sure all client-side hooks are in client components (with "use client" directive)
- Follow the pattern outlined in SERVER_COMPONENT_FIXES.md

## Connecting the Frontend and Backend

After both services are deployed:

1. Update the Vercel environment variable `NEXT_PUBLIC_API_URL` to point to your Render API URL
2. Update the Render environment variable `FRONTEND_URL` to point to your Vercel frontend URL
3. Redeploy both services if necessary

## Monitoring and Maintenance

- Set up health check monitoring in Render dashboard
- Review logs regularly for errors
- Consider setting up database backups
- Monitor API usage and performance 