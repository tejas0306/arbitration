# Arbitration Portal - Setup Guide

This project consists of a **Next.js frontend** and a **NestJS backend** with PostgreSQL database.

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)
```bash
# Run the automated setup script
./setup-project.sh
```

### Option 2: Manual Setup

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** (v14 or higher)
- **Git**

## 🗄️ Database Setup

1. **Install PostgreSQL** (if not already installed):
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

2. **Create Database**:
   ```bash
   psql postgres
   CREATE DATABASE arbitration_portal;
   CREATE USER tejasgajjar WITH PASSWORD 'india$123';
   GRANT ALL PRIVILEGES ON DATABASE arbitration_portal TO tejasgajjar;
   \q
   ```

## 🔧 Backend Setup (NestJS)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create `backend/.env`:
   ```env
   DATABASE_URL="postgresql://tejasgajjar:india%24123@localhost:5432/arbitration_portal?schema=public"
   JWT_SECRET="your-super-secret-key-change-this-in-production"
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

5. **Push database schema**:
   ```bash
   npx prisma db push
   ```

6. **Seed database** (optional):
   ```bash
   node prisma/seed-admin.js
   ```

## 🎨 Frontend Setup (Next.js)

1. **Return to root directory**:
   ```bash
   cd ..
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables**:
   Create `.env`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key-change-this
   DATABASE_URL="postgresql://tejasgajjar:india%24123@localhost:5432/arbitration_portal?schema=public"
   ```

4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

## 🚀 Running the Application

### Development Mode

#### Option 1: Run Both Simultaneously
```bash
npm run dev:both
```

#### Option 2: Run Separately
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev
```

### Production Mode
```bash
# Build both projects
npm run build:full

# Start backend
npm run start:backend

# Start frontend
npm run start:next
```

## 📱 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Prisma Studio**: http://localhost:5555 (run `npm run db:studio`)

## 🔧 Available Scripts

### Frontend Scripts
- `npm run dev` - Start frontend development server
- `npm run build` - Build frontend for production
- `npm run start:next` - Start frontend production server
- `npm run lint` - Run ESLint

### Backend Scripts
- `npm run dev:backend` - Start backend development server
- `npm run build:backend` - Build backend for production
- `npm run start:backend` - Start backend production server

### Combined Scripts
- `npm run dev:both` - Start both frontend and backend in development
- `npm run build:full` - Build both projects for production
- `npm run setup` - Run automated setup script

### Database Scripts
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## 🏗️ Project Structure

```
arbitration/
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility libraries
├── prisma/                 # Frontend Prisma schema
├── backend/                # NestJS backend
│   ├── src/               # Backend source code
│   ├── prisma/            # Backend Prisma schema
│   └── package.json       # Backend dependencies
├── package.json           # Frontend dependencies
└── setup-project.sh       # Automated setup script
```

## 🔐 Authentication

The application uses NextAuth.js for authentication. Default admin credentials (if seeded):
- **Email**: admin@arbitration.com
- **Password**: admin123

## 🐛 Troubleshooting

### Common Issues

1. **Prisma Client not generated**:
   ```bash
   npx prisma generate
   ```

2. **Database connection issues**:
   - Check if PostgreSQL is running: `brew services list | grep postgresql`
   - Verify database credentials in `.env` files
   - Ensure database exists: `psql -d arbitration_portal`

3. **Port conflicts**:
   - Frontend: 3000
   - Backend: 3001
   - Prisma Studio: 5555

4. **Dependency conflicts**:
   ```bash
   npm install --legacy-peer-deps
   ```

### Build Issues

If you encounter build errors:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Regenerate Prisma client
npx prisma generate
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 