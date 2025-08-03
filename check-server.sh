#!/bin/bash

echo "🔍 Checking Cynclaim Server Status..."
echo ""

# Check if port is in use
echo "📡 Checking port 3000..."
if lsof -i :3000 >/dev/null 2>&1; then
    echo "✅ Port 3000 is in use (server should be running)"
    
    # Try to get server response
    echo ""
    echo "🌐 Testing server response..."
    if curl -s -m 5 http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Server responds to requests"
        
        # Check if HTML is served
        echo ""
        echo "📄 Checking HTML content..."
        HTML_CONTENT=$(curl -s -m 5 http://localhost:3000)
        if echo "$HTML_CONTENT" | grep -q "root"; then
            echo "✅ HTML with root div is served"
            
            if echo "$HTML_CONTENT" | grep -q "bundle.js"; then
                echo "✅ JavaScript bundle is referenced"
            else
                echo "❌ JavaScript bundle not found in HTML"
            fi
        else
            echo "❌ HTML content seems invalid"
        fi
        
        # Check if JS bundle loads
        echo ""
        echo "📦 Checking JavaScript bundle..."
        if curl -s -m 5 http://localhost:3000/static/js/bundle.js >/dev/null 2>&1; then
            echo "✅ JavaScript bundle loads successfully"
        else
            echo "❌ JavaScript bundle not accessible"
        fi
        
    else
        echo "❌ Server not responding to requests"
    fi
    
else
    echo "❌ Port 3000 is not in use (server not running)"
    echo ""
    echo "🚀 To start the server, run:"
    echo "   npm start"
fi

echo ""
echo "🌐 Try opening these URLs in your browser:"
echo "   • http://localhost:3000"
echo "   • http://127.0.0.1:3000"
echo ""
echo "🔧 If you see a blank page, check the browser console (F12) for errors!"