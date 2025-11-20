#!/bin/bash
# Production Deployment Script
# Usage: ./deploy-prod.sh

set -e

echo "🚀 FindYourKing Production Deployment"
echo "====================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}✗ Vercel CLI not installed${NC}"
    echo "Install: npm i -g vercel"
    exit 1
fi

# Step 1: Build verification
echo -e "${YELLOW}[1/5]${NC} Verifying production build..."
if pnpm build 2>&1 | grep -q "compiled successfully\|Compiled with warnings"; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Step 2: Environment check
echo -e "${YELLOW}[2/5]${NC} Checking environment variables..."
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠ SUPABASE_SERVICE_ROLE_KEY not set in shell${NC}"
    echo "  Set in Vercel: Settings > Environment Variables"
fi
echo -e "${GREEN}✓ Environment check complete${NC}"

# Step 3: Git check
echo -e "${YELLOW}[3/5]${NC} Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠ Uncommitted changes detected${NC}"
    echo "  Commit with: git add . && git commit -m 'message'"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo -e "${GREEN}✓ Git status verified${NC}"

# Step 4: Deploy to Vercel
echo -e "${YELLOW}[4/5]${NC} Deploying to Vercel production..."
vercel deploy --prod --yes

# Step 5: Post-deployment steps
echo ""
echo -e "${YELLOW}[5/5]${NC} Post-deployment steps:"
echo ""
echo "📋 Checklist:"
echo "  [ ] Database migrations pushed (see PRODUCTION_RUNBOOK.md)"
echo "  [ ] Storage RLS policies configured in Supabase dashboard"
echo "  [ ] Stream API keys added to Vercel environment"
echo "  [ ] Auth redirect URLs updated in Supabase"
echo "  [ ] Deployment tests passed"
echo ""
echo -e "${GREEN}✓ Deployment complete!${NC}"
echo ""
echo "🔗 Next steps:"
echo "  1. Visit: https://vercel.com/dashboard to view deployment"
echo "  2. Run: PRODUCTION_RUNBOOK.md for manual steps"
echo "  3. Test the app at your production domain"
echo ""
