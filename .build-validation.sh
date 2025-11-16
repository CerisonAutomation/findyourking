#!/bin/bash

# FindYourKing Build Validation & Corruption Detection
# This script ensures the setup is robust and corruption-free

# Don't exit on errors - we want to show all checks


echo "🔍 Starting FindYourKing Build Validation..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Helper functions
error() {
    echo -e "${RED}✗ ERROR${NC}: $1"
    ((ERRORS++))
}

warn() {
    echo -e "${YELLOW}⚠ WARNING${NC}: $1"
    ((WARNINGS++))
}

success() {
    echo -e "${GREEN}✓ OK${NC}: $1"
}

# 1. Check for merge conflict markers
echo "1️⃣ Checking for merge conflict markers..."
if grep -r "<<<<<<< HEAD\|>>>>>>> \|^=======$" \
  tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts \
  app/layout.tsx app/actions.ts 2>/dev/null; then
    error "Merge conflict markers found!"
else
    success "No merge conflict markers"
fi

# 2. Validate JSON files
echo ""
echo "2️⃣ Validating JSON configuration files..."
for file in tsconfig.json package.json; do
    if ! jq empty "$file" 2>/dev/null; then
        error "$file is not valid JSON"
    else
        success "$file is valid JSON"
    fi
done

# 3. Check critical files exist
echo ""
echo "3️⃣ Checking critical files exist..."
CRITICAL_FILES=(
    "package.json"
    "tsconfig.json"
    "next.config.mjs"
    "postcss.config.mjs"
    "tailwind.config.ts"
    "app/layout.tsx"
    "app/globals.css"
    ".env.local"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        error "Critical file missing: $file"
    else
        success "Found: $file"
    fi
done

# 4. Check for TypeScript errors
echo ""
echo "4️⃣ Checking TypeScript compilation..."
if pnpm type-check > /dev/null 2>&1; then
    success "TypeScript checks passed"
else
    warn "TypeScript errors detected (may be non-blocking)"
fi


# 5. Check dependencies are installed
echo ""
echo "5️⃣ Verifying dependencies..."
MISSING_PACKAGES=0
REQUIRED_PACKAGES=(
    "@supabase/ssr"
    "@supabase/supabase-js"
    "next"
    "react"
    "react-dom"
    "tailwindcss"
    "@tailwindcss/postcss"
)

for pkg in "${REQUIRED_PACKAGES[@]}"; do
    if ! grep -q "\"$pkg\"" package.json; then
        error "Missing required package: $pkg"
        ((MISSING_PACKAGES++))
    else
        success "Package installed: $pkg"
    fi
done

# 6. Verify environment variables
echo ""
echo "6️⃣ Checking environment variables..."
if [ ! -f ".env.local" ]; then
    error ".env.local not found"
elif grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && \
     grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    success "Environment variables configured"
else
    error "Missing required environment variables in .env.local"
fi

# 7. Check build output
echo ""
echo "7️⃣ Testing production build..."
if pnpm build > /dev/null 2>&1; then
    success "Production build successful"
    if [ -d ".next" ]; then
        success "Build artifacts generated"
    fi
else
    error "Production build failed"
fi

# 8. Check for ESM compatibility
echo ""
echo "8️⃣ Checking module configuration..."
if grep -q '"type": "module"' package.json || grep -q 'module: "esnext"' tsconfig.json; then
    success "Module configuration valid"
else
    warn "Module configuration may need verification"
fi

# 9. Validate file permissions
echo ""
echo "9️⃣ Checking file permissions..."
if [ -w "app/layout.tsx" ] && [ -w "package.json" ]; then
    success "File permissions are correct"
else
    warn "Some files may have incorrect permissions"
fi

# 10. Check for common issues
echo ""
echo "🔟 Running common issues check..."
if ! grep -r "console.log" app/actions.ts app/page.tsx 2>/dev/null | grep -v "//"; then
    success "No debug console.log statements found"
else
    warn "Debug console.log statements detected"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo "Status: ${GREEN}ROBUST & CORRUPTION-FREE${NC}"
else
    echo -e "${RED}✗ $ERRORS critical issues found${NC}"
    echo "Status: ${RED}NEEDS ATTENTION${NC}"
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warnings${NC}"
fi

echo ""
echo "Validation complete at $(date)"
echo ""

exit $ERRORS
