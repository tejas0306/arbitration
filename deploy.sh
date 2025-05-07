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
echo -e "${YELLOW}This script will prepare your application for deployment to:${NC}"
echo -e "  1. ${GREEN}Vercel${NC} - Next.js frontend"
echo -e "  2. ${GREEN}Render${NC} - NestJS backend"
echo ""

# Step 1: Fix server components
echo -e "${BLUE}Step 1: Checking server components...${NC}"
./fix-server-components.sh
echo -e "${GREEN}✓ Server component check completed${NC}"
echo ""

# Step 2: Run local build to verify everything works
echo -e "${BLUE}Step 2: Running local build test...${NC}"
NEXT_PUBLIC_SKIP_AUTH_VERIFICATION=true npm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build test successful${NC}"
else
  echo -e "${RED}✗ Build test failed. Please fix the errors before deploying.${NC}"
  exit 1
fi
echo ""

# Step 3: Prepare for Vercel deployment
echo -e "${BLUE}Step 3: Preparing for Vercel deployment...${NC}"
./prepare-for-vercel.sh
echo -e "${GREEN}✓ Vercel preparation completed${NC}"
echo ""

# Step 4: Ask for deployment type
echo -e "${BLUE}Step 4: Choose deployment approach${NC}"
echo -e "How would you like to deploy your application?"
echo -e "  1. ${YELLOW}Full deployment${NC} - Deploy both frontend and backend"
echo -e "  2. ${YELLOW}Frontend only${NC} - Deploy only the Next.js frontend to Vercel"
echo -e "  3. ${YELLOW}Backend only${NC} - Deploy only the NestJS backend to Render"
read -p "Enter your choice (1-3): " deployment_choice
echo ""

# Handle deployment choices
case $deployment_choice in
  1)
    echo -e "${BLUE}Deploying both frontend and backend...${NC}"
    ./deploy-both.sh
    ;;
  2)
    echo -e "${BLUE}Deploying frontend only...${NC}"
    ./static-deploy.sh
    ;;
  3)
    echo -e "${BLUE}Deploying backend only...${NC}"
    echo -e "${YELLOW}Please follow the instructions in backend/DEPLOY_TO_RENDER.md${NC}"
    echo -e "Opening the deployment guide..."
    if command -v open &> /dev/null; then
      open backend/DEPLOY_TO_RENDER.md
    elif command -v xdg-open &> /dev/null; then
      xdg-open backend/DEPLOY_TO_RENDER.md
    else
      echo -e "${YELLOW}Please open backend/DEPLOY_TO_RENDER.md manually${NC}"
    fi
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Deployment process completed!${NC}"
echo -e "${YELLOW}Additional steps:${NC}"
echo -e "1. Update environment variables in your deployment platforms"
echo -e "2. Connect your frontend to your backend by setting NEXT_PUBLIC_API_URL"
echo -e "3. Verify all features are working correctly"
echo -e "${GREEN}=====================================${NC}" 