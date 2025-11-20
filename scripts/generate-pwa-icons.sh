#!/bin/bash

# =====================================================
# PWA Icon Generator Script
# Generates required PWA icons from logo
# Per Next.js PWA docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
# =====================================================

set -e  # Exit on error

echo "🎨 Generating PWA Icons for FindYourKing..."

# Check if source logo exists
if [ ! -f "public/fyklogo.png" ]; then
  echo "❌ Error: public/fyklogo.png not found"
  exit 1
fi

# Check if ImageMagick is installed
if command -v convert &> /dev/null; then
  echo "✅ Using ImageMagick..."
  
  # Generate 192x192 icon
  convert public/fyklogo.png -resize 192x192 -quality 95 public/icon-192.png
  echo "✅ Generated icon-192.png"
  
  # Generate 512x512 icon
  convert public/fyklogo.png -resize 512x512 -quality 95 public/icon-512.png
  echo "✅ Generated icon-512.png"
  
  # Generate favicon.ico (multi-size)
  convert public/fyklogo.png -define icon:auto-resize=64,48,32,16 public/favicon.ico
  echo "✅ Generated favicon.ico"
  
  # Generate apple-touch-icon
  convert public/fyklogo.png -resize 180x180 -quality 95 public/apple-touch-icon.png
  echo "✅ Generated apple-touch-icon.png"
  
# Check if sharp-cli is available (Node.js)
elif command -v npx &> /dev/null; then
  echo "✅ Using sharp-cli (Node.js)..."
  
  # Install sharp-cli if not present
  if ! npx sharp-cli --version &> /dev/null; then
    echo "📦 Installing sharp-cli..."
    npm install -g sharp-cli
  fi
  
  # Generate icons using sharp
  npx sharp-cli -i public/fyklogo.png -o public/icon-192.png resize 192 192
  npx sharp-cli -i public/fyklogo.png -o public/icon-512.png resize 512 512
  npx sharp-cli -i public/fyklogo.png -o public/apple-touch-icon.png resize 180 180
  
  echo "✅ Generated all icons using sharp"
  
else
  echo "❌ Error: Neither ImageMagick nor Node.js (npx) found"
  echo "📋 Please install one of the following:"
  echo "   - ImageMagick: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
  echo "   - Or use Node.js: npm install -g sharp-cli"
  exit 1
fi

# Verify generated files
echo ""
echo "📊 Verification:"
ls -lh public/icon-*.png public/apple-touch-icon.png 2>/dev/null || echo "⚠️  Some icons missing"

echo ""
echo "✅ PWA Icon Generation Complete!"
echo "📱 Your app is now ready for PWA installation"
echo ""
echo "🚀 Next steps:"
echo "   1. Test PWA installation: Open app in mobile browser"
echo "   2. Add to Home Screen: Should show FindYourKing icon"
echo "   3. Check manifest: Visit /manifest.webmanifest in browser"
