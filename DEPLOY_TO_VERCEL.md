# Deploying to Vercel

This guide walks you through deploying your Next.js frontend and NestJS backend to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional for local testing)
   ```bash
   npm install -g vercel
   ```

## Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

1. `DATABASE_URL` - Your PostgreSQL database connection string
2. `JWT_SECRET` - Secret key for JWT token generation/validation
3. Any other environment variables your application needs

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Your GitHub Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" → "Project"
   - Connect your GitHub account if not already connected
   - Select your repository

2. **Configure Project**:
   - Framework preset: Next.js
   - Root directory: `arbitration` (the directory containing your project)
   - Build Command: (Leave as default, the vercel.json file will override this)
   - Output Directory: (Leave as default, the vercel.json file will override this)

3. **Environment Variables**:
   - Add all required environment variables mentioned above

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application

### Option 2: Deploy via Vercel CLI

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Navigate to your project directory**:
   ```bash
   cd arbitration
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the CLI prompts**:
   - Select your Vercel scope/account
   - Set up a new project? `Y`
   - Link to existing project? `N`
   - What's your project name? `[your-project-name]`
   - In which directory is your code located? `./` (current directory)
   - Want to override settings? `Y`
   - Which settings would you like to override? Select settings as needed
   - Add environment variables as prompted or later in the dashboard

## Troubleshooting

### Database Connection Issues

1. **Ensure your database is accessible from Vercel's servers**:
   - If using a private database, make sure it accepts connections from Vercel's IP range
   - Consider using a cloud database service like Supabase, PlanetScale, or Railway

2. **Prisma Issues**:
   - Ensure `npx prisma generate` runs during build
   - The build command in vercel.json handles this

### API Route Issues

1. **Check API logs**:
   - In Vercel dashboard, go to your project → Deployments → Latest → Functions → api/[...path].js → Logs

2. **CORS Issues**:
   - Check the CORS settings in your NestJS app (main.ts)
   - Make sure the frontend URL is correctly set

## Production Checks

Once deployed, verify:

1. The frontend loads correctly
2. API endpoints are working
3. Database operations are successful
4. Authentication flows work as expected

## Monitoring

Vercel provides basic monitoring out of the box:
- Function execution times
- Error rates
- Deployment statuses

For more advanced monitoring, consider integrating tools like Sentry or LogRocket.

---

If you encounter any issues, check the [Vercel documentation](https://vercel.com/docs) or [contact Vercel support](https://vercel.com/support). 