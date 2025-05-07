#!/bin/bash

# Exit on error
set -e

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Server Component Fix Tool =====${NC}"
echo -e "${YELLOW}This script will identify and help fix server component issues${NC}"
echo ""

# Create a temp directory
mkdir -p .tmp

# Check for client hooks in server components
echo -e "${BLUE}Checking for client hooks in server components...${NC}"

# Find all pages without "use client" directive that might use client hooks
POTENTIALLY_PROBLEMATIC=$(grep -L "use client" --include="*.tsx" --include="*.jsx" app/**/page.tsx 2>/dev/null || true)

# For each potentially problematic file, check for client hooks
for file in $POTENTIALLY_PROBLEMATIC; do
  CLIENT_HOOKS=$(grep -E "useRouter|useSearchParams|useState|useEffect|useCallback|useMemo|useRef|useContext|useAuth" "$file" 2>/dev/null || true)
  
  if [ ! -z "$CLIENT_HOOKS" ]; then
    echo -e "${RED}Found client hooks in server component: ${file}${NC}"
    echo "Hooks found:"
    echo "$CLIENT_HOOKS"
    echo ""
    
    # Extract the component name
    COMPONENT_NAME=$(basename "$file" .tsx)
    COMPONENT_NAME="${COMPONENT_NAME^}" # Capitalize first letter
    
    echo -e "${YELLOW}Creating a fix for ${file}...${NC}"
    
    # Generate client component path
    CLIENT_COMPONENT_PATH="components/$(echo $COMPONENT_NAME | sed 's/Page/-client/' | tr '[:upper:]' '[:lower:]').tsx"
    
    echo -e "Suggested fix: Convert to server component and create ${GREEN}${CLIENT_COMPONENT_PATH}${NC}"
    echo "1. Move client logic to the client component"
    echo "2. Update server component to use Suspense boundary"
    echo ""
  fi
done

echo -e "${BLUE}All server component issues have been identified.${NC}"
echo -e "${YELLOW}Remember to:${NC}"
echo "1. Use 'use client' directive in all components using client-side hooks"
echo "2. Wrap client components with Suspense in server components"
echo "3. Make sure all pages using client hooks are properly structured"
echo "" 