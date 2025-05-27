# Complete Server Deployment Guide - Arbitration Portal (Development/Staging)

> **Note:** This guide is intended for **development and staging environments**. For production, see the security and scaling notes at the end.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Backend Deployment (NestJS)](#backend-deployment-nestjs)
6. [Frontend Deployment (Next.js)](#frontend-deployment-nextjs)
7. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)
10. [Production Notes](#production-notes)

## System Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Frontend    │    │  Backend     │    │  Database    │
│  (Next.js)   │──▶│  (NestJS)    │──▶│  (PostgreSQL) │
│  Port: 3000  │    │  Port: 3001  │    │  Port: 5432  │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Prerequisites

- **Node.js** v18+
- **npm** v9+
- **PostgreSQL** v13+
- **Git**
- **(Optional) PM2** for process management

## Environment Setup

### 1. System Updates

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js & npm

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 4. Create Database & User

```bash
sudo -u postgres psql
```

```sql
CREATE DATABASE arbitration_portal;
CREATE USER arbitration_user WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE arbitration_portal TO arbitration_user;
\q
```

## Database Setup

- Connection string:
  `postgresql://arbitration_user:dev_password@localhost:5432/arbitration_portal`

## Backend Deployment (NestJS)

```bash
cd arbitration/backend
npm install
```

Create `.env.development`:
```env
DATABASE_URL=postgresql://arbitration_user:dev_password@localhost:5432/arbitration_portal
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
JWT_SECRET=dev_jwt_secret
FRONTEND_URL=http://localhost:3000
```

Run migrations and start in dev mode:
```bash
npx prisma generate
npx prisma db push
npm run start:dev
```

## Frontend Deployment (Next.js)

```bash
cd ../
npm install
```

Create `.env.development`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SKIP_AUTH_VERIFICATION=true
```

Start the frontend:
```bash
npm run dev
```

## CI/CD Pipeline Setup (GitHub Actions Example)

Create `.github/workflows/dev-deploy.yml` in your repo:
```yaml
name: Dev CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_DB: arbitration_portal
          POSTGRES_USER: arbitration_user
          POSTGRES_PASSWORD: dev_password
        ports: [5432:5432]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://arbitration_user:dev_password@localhost:5432/arbitration_portal
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_SKIP_AUTH_VERIFICATION: true
      JWT_SECRET: dev_jwt_secret
      NODE_ENV: development
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install backend dependencies
        run: |
          cd arbitration/backend
          npm install
      - name: Prisma generate & migrate
        run: |
          cd arbitration/backend
          npx prisma generate
          npx prisma db push
      - name: Run backend tests
        run: |
          cd arbitration/backend
          npm run test
      - name: Install frontend dependencies
        run: |
          cd arbitration
          npm install
      - name: Build frontend
        run: |
          cd arbitration
          npm run build
      - name: Run frontend lint
        run: |
          cd arbitration
          npm run lint
```

## Testing & Verification

- Access frontend: http://localhost:3000
- Access backend API: http://localhost:3001/api/health
- Use test users and flows as per your FRS

## Troubleshooting

- **Port in use:** `lsof -i :3001` and `kill <PID>`
- **Database errors:** Check connection string and PostgreSQL status
- **.env issues:** Ensure all required variables are set


