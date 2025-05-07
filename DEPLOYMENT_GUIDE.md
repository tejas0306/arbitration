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