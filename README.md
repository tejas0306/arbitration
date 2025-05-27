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

## 📚 Documentation

Below are all key documentation files for this project:

### General & Deployment
- [SERVER_DEPLOYMENT_GUIDE.md](SERVER_DEPLOYMENT_GUIDE.md): Complete server deployment guide (dev/staging)
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md): Overview of deployment options
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md): Step-by-step deployment checklist
- [DEPLOY_TO_VERCEL.md](DEPLOY_TO_VERCEL.md): Vercel-specific deployment guide
- [FIX_RENDER_DEPLOYMENT.md](FIX_RENDER_DEPLOYMENT.md): Render deployment troubleshooting
- [SERVER_COMPONENT_FIXES.md](SERVER_COMPONENT_FIXES.md): Server component fixes for Next.js
- [DATABASE_SETUP.md](DATABASE_SETUP.md): Database setup and migration guide
- [FINAL_FIX_SUMMARY.md](FINAL_FIX_SUMMARY.md): Summary of final fixes
- [REAL_FIX_FOUND.md](REAL_FIX_FOUND.md): Real fix found summary
- [AUTH_DEBUG_INSTRUCTIONS.md](AUTH_DEBUG_INSTRUCTIONS.md): Debugging authentication
- [DATA_ISOLATION_TEST.md](DATA_ISOLATION_TEST.md): Data isolation test notes
- [ROLE_TESTING_GUIDE.md](ROLE_TESTING_GUIDE.md): Guide for testing role-based features
- [ROLE_SPECIFIC_FORMS_IMPLEMENTATION.md](ROLE_SPECIFIC_FORMS_IMPLEMENTATION.md): Implementation details for role-specific forms
- [TEAM_MEMBER_INTEGRATION.md](TEAM_MEMBER_INTEGRATION.md): Team member integration guide

### Backend Specific
- [backend/DEPLOY_TO_RENDER.md](backend/DEPLOY_TO_RENDER.md): Render-specific backend deployment
- [backend/ADMIN_USER_MANAGEMENT.md](backend/ADMIN_USER_MANAGEMENT.md): Admin user management documentation

### Other
- [Arbitration Portal API.postman_collection.json](Arbitration%20Portal%20API.postman_collection.json): Postman API collection for testing endpoints
- [Legal_AI_Project_FRS_Arbitration Functionality v1.0 260425.docx](Legal_AI_Project_FRS_Arbitration%20Functionality%20v1.0%20260425.docx): Functional requirements specification (FRS)

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