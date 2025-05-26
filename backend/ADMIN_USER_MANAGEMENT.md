# Admin User Management Backend Implementation

## Overview

This document describes the backend implementation for the Admin User Management system, which allows administrators to provision and manage internal user accounts (Admin, Case Manager, Team Member) through a secure administrative interface.

## Architecture

### Core Components

1. **AdminController** (`src/admin/admin.controller.ts`)
   - Handles HTTP requests for user management
   - Enforces role-based access control
   - Validates request data using DTOs

2. **AdminService** (`src/admin/admin.service.ts`)
   - Contains business logic for user operations
   - Integrates with database via Prisma
   - Handles email notifications
   - Maintains audit logs

3. **EmailService** (`src/services/email.service.ts`)
   - Sends credential emails to new users
   - Handles password reset notifications
   - Provides templated email content

4. **DTOs** (`src/admin/dto/`)
   - `CreateAdminUserDto`: Validation for user creation
   - `UpdateUserRoleDto`: Role update validation
   - Input validation and type safety

## API Endpoints

### User Management

#### Create Internal User
```http
POST /admin/users/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Manager",
  "email": "john@company.com",
  "password": "SecurePassword123!",
  "role": "CASE_MANAGER",
  "organization": "Legal Department",
  "sendCredentials": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Manager",
  "email": "john@company.com",
  "role": "CASE_MANAGER",
  "organization": "Legal Department",
  "isActive": true,
  "isSuspended": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get All Users
```http
GET /admin/users?role=CASE_MANAGER&status=active&search=john
Authorization: Bearer <admin_token>
```

#### Get User Details
```http
GET /admin/users/:id
Authorization: Bearer <admin_token>
```

#### Update User Role
```http
PATCH /admin/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "TEAM_MEMBER",
  "notes": "Role change requested by department head"
}
```

#### Reset User Password
```http
POST /admin/users/:id/reset-password
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "User forgot password",
  "sendEmail": true
}
```

#### Suspend User
```http
POST /admin/users/:id/suspend
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Policy violation",
  "duration": 30
}
```

#### Activate User
```http
POST /admin/users/:id/activate
Authorization: Bearer <admin_token>
```

## Security Features

### Role-Based Access Control

1. **AdminGuard** - Restricts access to ADMIN and CASE_MANAGER roles only
2. **JWT Authentication** - All endpoints require valid JWT tokens
3. **Input Validation** - DTOs validate all incoming data
4. **Audit Logging** - All administrative actions are logged

### Registration Restrictions

The system prevents internal roles from being registered through public APIs:

```typescript
// In AuthService.register()
const internalRoles = ['ADMIN', 'CASE_MANAGER', 'TEAM_MEMBER'];
if (internalRoles.includes(role)) {
  throw new ConflictException('This role cannot be registered through the public registration API. Please contact an administrator.');
}
```

## Database Schema

### User Model Extensions

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  password     String
  name         String
  role         UserRole @default(CLAIMANT)
  organization String?
  
  // Admin management fields
  isActive     Boolean  @default(true)
  isSuspended  Boolean  @default(false)
  suspendedUntil DateTime?
  suspensionReason String?
  
  // Case Manager fields
  managedCases String[]
  teamMembers  String[]
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

enum UserRole {
  CLAIMANT
  RESPONDENT
  ARBITRATOR
  ADMIN
  CASE_MANAGER
  TEAM_MEMBER
}
```

### Audit Logging

```prisma
model AuditLog {
  id           String   @id @default(uuid())
  entityType   String   // "user"
  entityId     String   // User ID
  action       String   // "created", "role_updated", "suspended", etc.
  details      Json     // Action-specific data
  oldValue     Json?    // Previous state
  newValue     Json?    // New state
  performedBy  String   // Admin user ID
  createdAt    DateTime @default(now())
}
```

## Email Integration

### Credential Email Template

When `sendCredentials: true` is specified during user creation:

```typescript
await emailService.sendUserCredentials({
  name: user.name,
  email: user.email,
  password: originalPassword,
  role: user.role,
  organization: user.organization,
  loginUrl: process.env.FRONTEND_URL
});
```

### Password Reset Email

When `sendEmail: true` is specified during password reset:

```typescript
await emailService.sendPasswordReset({
  name: user.name,
  email: user.email,
  newPassword: temporaryPassword,
  loginUrl: process.env.FRONTEND_URL
});
```

## Error Handling

### Common Error Responses

1. **401 Unauthorized** - Missing or invalid JWT token
2. **403 Forbidden** - Insufficient permissions (non-admin role)
3. **400 Bad Request** - Validation errors or business rule violations
4. **404 Not Found** - User not found
5. **409 Conflict** - Email already exists

### Example Error Response

```json
{
  "statusCode": 400,
  "message": "User with this email already exists",
  "error": "Bad Request"
}
```

## Testing

### Test Script

Run the test script to verify all endpoints:

```bash
cd backend
node test-admin-endpoints.js
```

### Prerequisites

1. Backend server running on port 3001
2. Admin user with credentials:
   - Email: `test-admin@example.com`
   - Password: `TestPassword123!`

### Test Coverage

- ✅ User creation with validation
- ✅ User listing with filters
- ✅ User details retrieval
- ✅ Password reset functionality
- ✅ Role updates with audit logging
- ✅ User suspension and activation
- ✅ Email notification integration
- ✅ Security and authorization

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/arbitration"

# JWT
JWT_SECRET="your-secret-key"

# Frontend URL for email links
FRONTEND_URL="http://localhost:3000"

# Email service configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## Deployment Considerations

1. **Environment Variables** - Ensure all required env vars are set
2. **Database Migrations** - Run Prisma migrations for schema updates
3. **Email Service** - Configure SMTP settings for production
4. **Security** - Use strong JWT secrets and HTTPS in production
5. **Monitoring** - Set up logging and monitoring for admin actions

## Integration with Frontend

The backend provides the necessary endpoints for the frontend Admin User Management interface:

- User creation form with role selection
- User listing with search and filters
- User detail views with action buttons
- Password reset functionality
- Role management interface
- User status management (active/suspended)

All endpoints return structured JSON responses that can be directly consumed by the React frontend components. 