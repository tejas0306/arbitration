# Arbitration Portal

A comprehensive web application for managing arbitration cases, built with Next.js frontend and NestJS backend.

## Features

- **Case Management**: Create, view, and manage arbitration cases
- **User Roles**: Support for Claimants, Respondents, and Administrators
- **Counter-Response System**: Handle responses and counter-responses between parties
- **Document Management**: Upload and manage case-related documents
- **Dashboard**: Comprehensive overview of cases and statistics
- **Authentication**: Secure user authentication and authorization

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS** for styling
- **Shadcn/ui** components
- **React Hook Form** for form handling

### Backend
- **NestJS** framework
- **Prisma** ORM
- **PostgreSQL** database
- **JWT** authentication
- **TypeScript**

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- pnpm (recommended) or npm

### Frontend Setup
```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

### Backend Setup
```bash
cd backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm prisma migrate dev

# Start development server
pnpm run start:dev
```

## Environment Variables

### Frontend (.env.local)
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/arbitration_db"
JWT_SECRET=your-jwt-secret-here
PORT=3001
```

## Project Structure

```
arbitration/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── cases/             # Case management pages
│   ├── dashboard/         # Dashboard pages
│   └── ...
├── components/            # Reusable React components
├── lib/                  # Utility functions and configurations
├── backend/              # NestJS backend
│   ├── src/              # Source code
│   ├── prisma/           # Database schema and migrations
│   └── ...
└── ...
```

## API Endpoints

### Cases
- `GET /api/arbitration/cases` - Get all cases
- `POST /api/arbitration/cases` - Create new case
- `GET /api/arbitration/cases/:id` - Get case by ID
- `PATCH /api/arbitration/cases/:id` - Update case

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary software. All rights reserved.
