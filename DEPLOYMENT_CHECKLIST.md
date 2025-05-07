# Deployment Checklist

This checklist helps ensure your Arbitration Portal deployment to Vercel (frontend) and Render (backend) goes smoothly.

## Pre-Deployment Preparation

### Code Structure & Configuration

- [ ] Ensure all client-side hooks (`useRouter`, `useSearchParams`, etc.) are properly wrapped in client components
- [ ] Verify all pages using client components are wrapped in Suspense boundaries
- [ ] Check that all required environment variables are documented
- [ ] Confirm `next.config.mjs` is properly configured with:
  - [ ] `output: 'standalone'` for Vercel deployment
  - [ ] Proper rewrites for API routes
  - [ ] ESLint and TypeScript build errors ignored

### Environment Variables

- [ ] Create or update `.env.example` with all required variables
- [ ] Prepare production environment variables for both platforms

### Database

- [ ] Ensure Prisma schema is up to date
- [ ] Plan for database migrations strategy on deployment
- [ ] Back up any existing production data

## Vercel Deployment (Next.js Frontend)

### Pre-Deployment Checks

- [ ] Run the server component check script: `./fix-server-components.sh`
- [ ] Run the Vercel preparation script: `./prepare-for-vercel.sh`
- [ ] Set up the following environment variables in Vercel:
  - [ ] `NEXT_PUBLIC_API_URL` - URL to your Render backend API
  - [ ] `NEXT_PUBLIC_SKIP_AUTH_VERIFICATION` - Set to `true` initially for testing
  - [ ] `DATABASE_URL` - If your frontend needs direct database access

### Deployment Options

- [ ] **Option 1: Via Vercel Dashboard**
  - [ ] Connect your GitHub repository
  - [ ] Configure build settings (should be auto-detected)
  - [ ] Set environment variables
  - [ ] Deploy

- [ ] **Option 2: Via Vercel CLI**
  - [ ] Login to Vercel: `vercel login`
  - [ ] Deploy: `vercel --prod`

### Post-Deployment

- [ ] Verify the deployment URL works
- [ ] Check all routes (home, login, dashboard, etc.)
- [ ] Test user authentication flow
- [ ] Confirm environment variables are correctly applied

## Render Deployment (NestJS Backend)

### Pre-Deployment Checks

- [ ] Ensure `backend/src/main.ts` has proper CORS configuration
- [ ] Verify the health check endpoint works (`/api/health`)
- [ ] Confirm `render.yaml` is properly configured

### Deployment Options

- [ ] **Option 1: Via Render Dashboard (Blueprint)**
  - [ ] Create a new Blueprint from your GitHub repository
  - [ ] Set environment variables:
    - [ ] `NODE_ENV` - Set to `production`
    - [ ] `DATABASE_URL` - Your PostgreSQL connection string
    - [ ] `JWT_SECRET` - Secret for JWT token generation
    - [ ] `FRONTEND_URL` - Your Vercel frontend URL
    - [ ] `PORT` - Usually `3001`
    - [ ] `RENDER` - Set to `true`
  - [ ] Apply Blueprint

- [ ] **Option 2: Via Render Dashboard (Manual)**
  - [ ] Create a new Web Service
  - [ ] Connect to your GitHub repository
  - [ ] Set Build Command: `npm ci && npx prisma generate && npm run build`
  - [ ] Set Start Command: `npm run start:prod`
  - [ ] Configure environment variables (same as above)
  - [ ] Deploy

### Post-Deployment

- [ ] Verify the API is accessible at the Render URL
- [ ] Test the health check endpoint
- [ ] Ensure API routes are working (test with Postman or similar tool)
- [ ] Check database connectivity

## Connecting Frontend and Backend

- [ ] Update the Vercel environment variable `NEXT_PUBLIC_API_URL` to point to your Render API URL
- [ ] Update the Render environment variable `FRONTEND_URL` to point to your Vercel frontend URL
- [ ] Test the complete flow from frontend to backend
- [ ] Verify CORS is working correctly

## Final Checks

- [ ] Test the application end-to-end
- [ ] Check user registration and login
- [ ] Test all major features
- [ ] Verify performance is acceptable
- [ ] Confirm error handling works as expected

## Common Issues & Solutions

### Server Component Errors

If you see errors about calling client hooks from server components:
- Use the `fix-server-components.sh` script to identify problematic pages
- Convert client logic to client components and wrap with Suspense

### CORS Issues

If you encounter CORS errors:
- Check the CORS configuration in `backend/src/main.ts`
- Ensure `origin` includes your Vercel domain
- Verify the `FRONTEND_URL` environment variable is set correctly

### Database Connection Issues

If database connections fail:
- Verify `DATABASE_URL` is correct
- Check if the database is accessible from Render
- Ensure Prisma is properly generating the client

### Build Failures

- Check the build logs for specific errors
- For Next.js issues, verify `next.config.mjs` settings
- For NestJS issues, check `nest-cli.json` and build command 