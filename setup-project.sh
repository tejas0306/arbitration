#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Arbitration Portal Project${NC}"
echo "=================================="

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL status...${NC}"
if brew services list | grep -q "postgresql.*started"; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not running. Starting it...${NC}"
    brew services start postgresql@14
    sleep 3
fi

# Setup Backend
echo -e "${YELLOW}Setting up Backend (NestJS)...${NC}"
cd backend

# Install dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
npm install

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client for backend...${NC}"
npx prisma generate

# Push database schema
echo -e "${BLUE}Pushing database schema...${NC}"
npx prisma db push

# Seed database if needed
if [ -f "prisma/seed-admin.js" ]; then
    echo -e "${BLUE}Seeding database with admin user...${NC}"
    node prisma/seed-admin.js
fi

cd ..

# Setup Frontend
echo -e "${YELLOW}Setting up Frontend (Next.js)...${NC}"

# Install dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
npm install --legacy-peer-deps

# Generate Prisma client
echo -e "${BLUE}Generating Prisma client for frontend...${NC}"
npx prisma generate

# Create necessary environment files if they don't exist
echo -e "${BLUE}Checking environment files...${NC}"

# Frontend .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    cat > .env << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this
DATABASE_URL="postgresql://tejasgajjar:india%24123@localhost:5432/arbitration_portal?schema=public"
EOF
fi

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > backend/.env << EOF
DATABASE_URL="postgresql://tejasgajjar:india%24123@localhost:5432/arbitration_portal?schema=public"
JWT_SECRET="your-super-secret-key-change-this-in-production"
PORT=3001
FRONTEND_URL=http://localhost:3000
EOF
fi

echo -e "${GREEN}✅ Project setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Start the backend: ${YELLOW}cd backend && npm run start:dev${NC}"
echo "2. Start the frontend: ${YELLOW}npm run dev${NC}"
echo "3. Access the application at: ${GREEN}http://localhost:3000${NC}"
echo "4. Backend API will be available at: ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}🔧 Available scripts:${NC}"
echo "- ${YELLOW}npm run dev${NC} - Start frontend development server"
echo "- ${YELLOW}npm run build${NC} - Build frontend for production"
echo "- ${YELLOW}cd backend && npm run start:dev${NC} - Start backend development server"
echo "- ${YELLOW}cd backend && npm run build${NC} - Build backend for production" 