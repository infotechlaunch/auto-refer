#!/bin/bash

# Configuration
PROJECT_DIR="/home/ubuntu/auto-refer/backend"

echo "🚀 Starting Deployment..."

# Navigate to project directory
cd $PROJECT_DIR || exit

# Pull latest changes (assuming the server is already authenticated with git)
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Restart/Reload PM2 process
echo "🔄 Reloading PM2 processes..."
pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

# Save PM2 list
pm2 save

echo "✅ Deployment Successful!"
