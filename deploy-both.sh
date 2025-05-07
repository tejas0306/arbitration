#!/bin/bash

# Exit on error
set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Arbitration Portal Deployment Script =====${NC}"
echo -e "${YELLOW}This script will help you deploy:${NC}"
echo -e "  1. Frontend (Next.js) to Vercel"
echo -e "  2. Backend (NestJS) to Render"
echo ""

# Ask which components to deploy
read -p "Deploy frontend to Vercel? (y/n): " deploy_frontend
read -p "Deploy backend to Render? (y/n): " deploy_backend

# Function to check for tool installation
check_tool() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}$1 is not installed. Please install it first.${NC}"
    echo -e "You can install it using: $2"
    exit 1
  fi
}

# Frontend deployment
if [[ $deploy_frontend == "y" || $deploy_frontend == "Y" ]]; then
  echo -e "\n${BLUE}===== Deploying Frontend to Vercel =====${NC}"
  
  # Check for Vercel CLI
  check_tool "vercel" "npm install -g vercel"
  
  # Check if logged in to Vercel
  echo -e "${YELLOW}Checking Vercel login status...${NC}"
  if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Vercel. Please login:${NC}"
    vercel login
  fi
  
  # Set environment variables
  echo -e "${YELLOW}Setting up environment variables for Vercel...${NC}"
  read -p "Enter the backend API URL (e.g., https://arbitration-api.onrender.com/api): " api_url
  
  echo -e "${YELLOW}Creating .env file with production values...${NC}"
  cat > .env.production << EOF
NEXT_PUBLIC_API_URL=${api_url}
NEXT_PUBLIC_SKIP_AUTH_VERIFICATION=false
EOF
  
  # Deploy to Vercel
  echo -e "${YELLOW}Deploying to Vercel...${NC}"
  vercel --prod
  
  echo -e "${GREEN}Frontend deployed successfully!${NC}"
fi

# Backend deployment
if [[ $deploy_backend == "y" || $deploy_backend == "Y" ]]; then
  echo -e "\n${BLUE}===== Preparing Backend for Render =====${NC}"
  
  echo -e "${YELLOW}The backend can be deployed to Render in two ways:${NC}"
  echo -e "1. Using the Render Dashboard (recommended)"
  echo -e "2. Using the Render CLI (advanced)"
  echo ""
  echo -e "${YELLOW}To deploy using the Render Dashboard:${NC}"
  echo -e "1. Go to https://dashboard.render.com/"
  echo -e "2. Create a new Web Service pointing to your GitHub repository"
  echo -e "3. Use the following settings:"
  echo -e "   - Build Command: ${GREEN}npm ci && npx prisma generate && npm run build${NC}"
  echo -e "   - Start Command: ${GREEN}npm run start:prod${NC}"
  echo -e "   - Set the root directory to ${GREEN}backend${NC} (if needed)"
  echo ""
  echo -e "${YELLOW}Important environment variables for Render:${NC}"
  echo -e "- DATABASE_URL: Your PostgreSQL connection string"
  echo -e "- JWT_SECRET: A secure random string"
  echo -e "- NODE_ENV: production"
  echo -e "- FRONTEND_URL: Your Vercel frontend URL"
  echo -e "- RENDER: true"
  
  # Check if user wants to open Render dashboard
  read -p "Open the Render dashboard in your browser? (y/n): " open_render
  if [[ $open_render == "y" || $open_render == "Y" ]]; then
    if command -v open &> /dev/null; then
      open "https://dashboard.render.com"
    elif command -v xdg-open &> /dev/null; then
      xdg-open "https://dashboard.render.com"
    else
      echo -e "${YELLOW}Please visit https://dashboard.render.com in your browser${NC}"
    fi
  fi
fi

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}Deployment preparation completed!${NC}"
echo -e "${YELLOW}Additional steps:${NC}"
echo -e "1. Update the NEXT_PUBLIC_API_URL in Vercel to point to your Render backend"
echo -e "2. Set up your database (if not already done)"
echo -e "3. Verify CORS settings if you encounter cross-origin issues"
echo -e "\n${BLUE}See the deployment guides for more details:${NC}"
echo -e "- Frontend: DEPLOY_TO_VERCEL.md"
echo -e "- Backend: backend/DEPLOY_TO_RENDER.md"
echo -e "${GREEN}=====================================${NC}" 