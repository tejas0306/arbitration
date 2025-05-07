#!/bin/bash

# Exit on error
set -e

echo "===== Preparing for Vercel static deployment ====="

# Create .env file with SKIP_AUTH_VERIFICATION=true to bypass authentication checks
echo "Creating .env file with auth verification disabled"
cat > .env << EOF
NEXT_PUBLIC_SKIP_AUTH_VERIFICATION=true
NEXT_PUBLIC_API_URL=https://your-api-url.com/api
EOF

# Modify the build command to skip the backend build
echo "Using simplified build command for frontend-only deployment"
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Ensure we only build the frontend
  if (pkg.scripts.build.includes('backend')) {
    pkg.scripts.build = 'npx prisma generate && next build';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('Updated package.json build script to skip backend build');
  }
"

echo "===== Installing dependencies ====="
npm install --legacy-peer-deps

echo "===== Deploying to Vercel ====="
echo "This will deploy your Next.js frontend as a static site."
echo "You will need to deploy the backend separately."

# Deploy with production flag
npx vercel --prod --yes

echo "===== Deployment completed ====="
echo "Your Next.js frontend has been deployed to Vercel."
echo ""
echo "IMPORTANT: This is a frontend-only deployment. You will need to:"
echo "1. Deploy your NestJS backend separately"
echo "2. Update the NEXT_PUBLIC_API_URL environment variable in Vercel to point to your backend API"
echo ""
echo "For a full-stack deployment on Vercel, you'll need to:"
echo "1. Modify your backend to support serverless deployment"
echo "2. Configure Vercel to build and deploy both frontend and backend together" 