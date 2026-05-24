#!/bin/bash
# Ticket Lagbe - Hostinger Deployment Script
# Run this script in your Hostinger SSH terminal inside public_html

echo "========================================="
echo "  Ticket Lagbe - Hostinger Deploy Script"
echo "========================================="

# 1. Check Node.js version
echo ""
echo "▶ Node.js version:"
node -v

# 2. Pull latest code from GitHub
echo ""
echo "▶ Pulling latest code from GitHub..."
git pull origin main

# 3. Install all dependencies (rebuilds native modules like better-sqlite3)
echo ""
echo "▶ Installing dependencies (rebuilding native modules)..."
npm install --build-from-source

# 4. Set NODE_ENV and rebuild if needed
echo ""
echo "▶ Rebuilding native modules for current platform..."
npm rebuild better-sqlite3

# 5. Create .env file if not exists
if [ ! -f ".env" ]; then
  echo ""
  echo "▶ Creating .env file..."
  cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
# Add your GEMINI_API_KEY below
GEMINI_API_KEY=your_api_key_here
EOF
  echo "⚠️  Please edit .env and add your GEMINI_API_KEY!"
fi

# 6. Create uploads directory if not exists
mkdir -p uploads

# 7. Create logs directory for PM2
mkdir -p logs

echo ""
echo "========================================="
echo "  ✅ Setup Complete!"
echo "========================================="
echo ""
echo "Now go to hPanel → Node.js → Restart your app"
echo "OR run: node dist/server.cjs"
echo ""
