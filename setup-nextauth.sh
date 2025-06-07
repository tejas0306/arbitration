#!/bin/bash

# Create .env.local file
echo "Creating .env.local with NextAuth settings..."

# Create a secure random secret for NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)

cat > .env.local << EOF
# NextAuth.js configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# API URL (should match existing config)
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF

echo "Environment file created successfully!"
echo "You can now restart your application for the changes to take effect." 