#!/bin/bash

# VoteWithYourWallet Deployment Script
# This script helps deploy the application to various platforms

echo "🚀 Starting VoteWithYourWallet deployment process..."

# Navigate to the project directory
cd "$(dirname "$0")"

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -f "app.json" ]; then
    echo "❌ Not in the VoteWithYourWallet project directory"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build the web version
echo "🌐 Building web version..."
npx expo export -p web

if [ $? -eq 0 ]; then
    echo "✅ Web build completed successfully!"
    echo "📁 Static files are available in the 'dist/' directory"
    echo ""
    echo "🚀 Deployment Options:"
    echo "========================"
    echo ""
    echo "1. EAS Hosting (Recommended for web):"
    echo "   a) Login to Expo: npx expo login"
    echo "   b) Deploy to EAS: npx eas build --platform web --profile preview"
    echo ""
    echo "2. Static Hosting (Vercel, Netlify, etc.):"
    echo "   a) The 'dist/' directory contains all static files"
    echo "   b) Deploy these files to your preferred static hosting service"
    echo ""
    echo "3. Mobile Deployment:"
    echo "   a) iOS: npx eas build --platform ios --profile preview"
    echo "   b) Android: npx eas build --platform android --profile preview"
    echo ""
    echo "4. Local Development:"
    echo "   a) Start Expo: npx expo start"
    echo "   b) Open in browser: npx expo start --web"
    echo ""
    echo "📋 Next Steps:"
    echo "============="
    echo "1. Choose your preferred deployment method from above"
    echo "2. Follow the corresponding instructions"
    echo "3. Test the deployed application"
    echo "4. Share the URL with users"
    echo ""
    echo "💡 The API routes are already configured and will work with the Turso database"
    echo "   in production environments."
else
    echo "❌ Web build failed. Please check the error messages above."
    exit 1
fi

echo "✅ Deployment preparation completed!"
echo "🎉 VoteWithYourWallet is ready for deployment!"