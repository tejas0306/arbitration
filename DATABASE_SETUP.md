# Database Setup Guide

This guide explains how to set up the database for the Arbitration Portal application.

## Current Issue

The error `The table 'public.User' does not exist in the current database` indicates that the database is connected but the schema hasn't been created yet. This happens when Prisma tries to access tables that don't exist.

## Solution

We've updated the `render.yaml` file to include Prisma commands in the build process:

```yaml
buildCommand: |
  npm install
  npx prisma generate
  npx prisma db push --accept-data-loss
  npm run build
```

These commands:
1. `prisma generate` - Creates the Prisma client based on your schema
2. `prisma db push` - Creates/updates the database schema based on your Prisma schema

## Database Setup Options

### Option 1: prisma db push (Used in our configuration)

- **Command**: `npx prisma db push`
- **Best for**: Development, prototyping, or simple deployments
- **Pros**: Simple, doesn't require migration files
- **Cons**: Less control over schema changes, may cause data loss

### Option 2: prisma migrate deploy

- **Command**: `npx prisma migrate deploy`
- **Best for**: Production environments with sensitive data
- **Pros**: Better control, history of changes, safer
- **Cons**: Requires migration files to be committed to the repository

To use migrations instead:
1. Create migration files locally: `npx prisma migrate dev --name init`
2. Commit these files to your repository
3. Update render.yaml to use `npx prisma migrate deploy` instead

## Connecting to a Database on Render

1. **Create a PostgreSQL database in Render**:
   - Go to Dashboard → New → PostgreSQL
   - Configure name, region, etc.
   - Create Database

2. **Get connection string**:
   - In your database dashboard, find "Connection" details
   - Copy the Internal Connection String

3. **Add to environment variables**:
   - Go to your Web Service settings
   - Add the connection string as `DATABASE_URL` environment variable

## Verifying Database Setup

After deploying with these changes:

1. Check logs for successful Prisma commands
2. Verify tables are created by looking for:
   - No more "table does not exist" errors
   - Successful queries in the logs

## Database Schema Management

When you need to update your database schema:

1. Update the Prisma schema file (`prisma/schema.prisma`)
2. If using `db push`, just redeploy your application
3. If using migrations:
   - Create a new migration locally: `npx prisma migrate dev --name your_change_name`
   - Commit the new migration files
   - Redeploy your application 