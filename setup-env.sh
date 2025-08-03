#!/bin/bash

# Cynclaim Production Setup and Validation Script

echo "🚀 Setting up Cynclaim for production deployment..."
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "Please create a .env file with the required environment variables."
    exit 1
fi

echo "✅ .env file found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check

if [ $? -eq 0 ]; then
    echo "✅ Type check passed"
else
    echo "❌ Type check failed"
    exit 1
fi

# Build the application
echo "🏗️  Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 Setup complete! Your expense claims app is ready for production."
echo ""
echo "✅ All systems ready for deployment"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm start' to test locally"
echo "2. Deploy the 'build' folder to Netlify"
echo "3. Set environment variables in Netlify dashboard"
echo ""
echo "🔗 Resources:"
echo "- Supabase Dashboard: https://supabase.com/dashboard/project/dhhsmadffhlztiofrvjf"
echo "- Netlify Dashboard: https://app.netlify.com/"
echo ""
echo "📚 For help, see TROUBLESHOOTING.md" 