# Arbitration Portal

This is a legal portal application for managing arbitration petitions.

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arbitration-portal
```

2. Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

3. Set up environment variables:
   - Create a `.env` file in the root directory for frontend variables
   - Create a `.env` file in the `backend` directory for backend variables

   Example backend `.env`:
   ```
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=yourpassword
   DATABASE_NAME=arbitration
   JWT_SECRET=your-secret-key
   ```

   Example frontend `.env`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

## Running the Application

### Development Mode

1. Start the backend:
```bash
cd backend
npm run start:dev
```

2. In a separate terminal, start the frontend:
```bash
# From the root directory (not inside backend)
npm run dev
```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:3001.

### Production Mode

1. Build and start the backend:
```bash
cd backend
npm run build
npm run start:prod
```

2. Build and start the frontend:
```bash
# From the root directory
npm run build
npm run start
```

## Features

- User authentication (login/register)
- Create and submit arbitration petitions
- Save drafts of petitions in progress
- Track case status and history
- Upload supporting documents
- Dashboard view of all cases and drafts

## Troubleshooting

### Common Issues

1. **"Failed to load petition" or "Error saving draft" errors**:
   - Make sure both frontend and backend are running
   - Check that backend is accessible at the URL defined in NEXT_PUBLIC_API_URL
   - Verify API endpoints match between frontend and backend
   - Check your authentication token is valid

2. **404 Not Found errors**:
   - Ensure the API endpoints in the frontend match those defined in the backend controllers
   - Check if you're using '/arbitration/drafts' (correct) instead of '/arbitration/draft' (incorrect)

3. **Start Command Errors**:
   - If `npm run start:dev` fails in the root directory, make sure you're in the correct directory:
     - For frontend: Run commands from the root directory
     - For backend: Run commands from the backend directory

For other issues, please check the browser console and backend logs for error details.

## Deployment

This project is configured for deployment to:
- **Frontend (Next.js)**: [Vercel](https://vercel.com)
- **Backend (NestJS)**: [Render](https://render.com)

### Quick Deployment

Run the deployment script:

```bash
./deploy.sh
```

This script will:
1. Check for server component issues
2. Test the build locally
3. Prepare the app for deployment
4. Guide you through deployment options

### Manual Deployment

#### Frontend (Next.js) on Vercel

1. **Prepare for deployment**:
   ```bash
   ./prepare-for-vercel.sh
   ```

2. **Deploy to Vercel**:
   ```bash
   ./static-deploy.sh
   ```

3. **Set environment variables in Vercel Dashboard**:
   - `NEXT_PUBLIC_API_URL`: URL to your backend API
   - `NEXT_PUBLIC_SKIP_AUTH_VERIFICATION`: Set to `true` for testing

#### Backend (NestJS) on Render

1. Follow the instructions in [DEPLOY_TO_RENDER.md](backend/DEPLOY_TO_RENDER.md)

2. Set environment variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: Secret for JWT token generation
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `PORT`: Usually `3001`
   - `RENDER`: `true`

### Deployment Documentation

For more detailed deployment instructions, see:
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Overview of deployment options
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Step-by-step deployment checklist
- [SERVER_COMPONENT_FIXES.md](SERVER_COMPONENT_FIXES.md) - Details on server component fixes
- [DEPLOY_TO_VERCEL.md](DEPLOY_TO_VERCEL.md) - Vercel-specific deployment guide
- [backend/DEPLOY_TO_RENDER.md](backend/DEPLOY_TO_RENDER.md) - Render-specific deployment guide 