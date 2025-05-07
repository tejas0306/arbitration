# Deploying NestJS Backend to Render

This guide walks you through deploying your NestJS backend API to Render.

## Prerequisites

1. A [Render account](https://render.com/signup)
2. Your code pushed to a GitHub repository

## Deployment Steps

### Option 1: Deploy via render.yaml (Recommended)

1. **Ensure the render.yaml file is in your repository**:
   - This project includes a `render.yaml` file in the `backend` directory
   - This file configures your service for deployment

2. **Connect to Render Dashboard**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Blueprint"
   - Connect your GitHub account if not already connected
   - Select your repository

3. **Deploy the Blueprint**:
   - Render will automatically detect the `render.yaml` file
   - Review the service(s) defined
   - Add required environment variables (see below)
   - Click "Apply Blueprint"

### Option 2: Manual Web Service Setup

1. **Create a New Web Service**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Your Service**:
   - Name: `arbitration-api` (or your preferred name)
   - Environment: `Node`
   - Build Command: `npm ci && npx prisma generate && npm run build`
   - Start Command: `npm run start:prod`
   - Set the root directory to the backend directory if needed

3. **Environment Variables**:
   - Add environment variables (see section below)

4. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy your application

## Required Environment Variables

Set the following in the Render dashboard:

1. `DATABASE_URL` - Your PostgreSQL database connection string
2. `JWT_SECRET` - Secret key for JWT token generation/validation
3. `NODE_ENV` - Set to `production`
4. Any other environment variables your application needs

## Database Setup

Render offers PostgreSQL databases:

1. **Create a PostgreSQL Database**:
   - In Render dashboard, go to "PostgreSQL"
   - Click "New PostgreSQL"
   - Configure as needed
   - Create database

2. **Connect Your Service**:
   - In your web service settings, add the Internal Database URL to `DATABASE_URL`
   - Format: `postgres://username:password@postgres-instance:5432/database_name`

## Prisma Setup

Prisma is properly configured in the deployment process:

1. **Database Migration**:
   - The build command includes `npx prisma generate`
   - For initial deployment, you might need to run migrations manually:
     ```bash
     npx prisma migrate deploy
     ```

## CORS Configuration

Ensure your NestJS app has proper CORS configuration in `main.ts`:

```typescript
// Existing CORS configuration should allow your Vercel frontend domain
app.enableCors({
  origin: process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

## Connecting Frontend to Backend

After deployment:

1. Get your Render API URL (e.g., `https://arbitration-api.onrender.com`)
2. Update your Vercel environment variable:
   - Go to Vercel dashboard → your project → Settings → Environment Variables
   - Set `NEXT_PUBLIC_API_URL` to your Render API URL

## Monitoring and Logs

Render provides built-in monitoring:

1. **Logs**:
   - Access logs from your service dashboard
   - Filter by timestamp, severity

2. **Metrics**:
   - CPU usage
   - Memory usage
   - Request count

## Troubleshooting

1. **Build Failures**:
   - Check build logs in Render dashboard
   - Ensure all dependencies are properly specified in package.json

2. **Runtime Errors**:
   - Check application logs
   - Verify environment variables are set correctly

3. **Database Connection Issues**:
   - Verify DATABASE_URL is correct
   - Check if database is accepting connections from your service

## Further Resources

- [Render Documentation](https://render.com/docs)
- [NestJS Production Best Practices](https://docs.nestjs.com/techniques/performance)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql) 