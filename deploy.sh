#!/bin/bash

# Configuration
VPS_USER="root"
VPS_IP="66.181.46.75"
REMOTE_DIR="/var/www/html"

echo "🚀 Starting Deployment..."

# 1. Build the project
echo "📦 Building project..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful."
else
  echo "❌ Build failed. Aborting."
  exit 1
fi

# 2. Upload to VPS
echo "📤 Uploading to VPS ($VPS_IP)..."
scp -r dist/* $VPS_USER@$VPS_IP:$REMOTE_DIR

if [ $? -eq 0 ]; then
  echo "✅ Upload successful."
  echo "🎉 Deployment Complete! Visit https://nenitafarmlechonhausrms.app"
else
  echo "❌ Upload failed. Check your connection or password."
  exit 1
fi
