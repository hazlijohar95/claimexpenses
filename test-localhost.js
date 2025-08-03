#!/usr/bin/env node

const http = require('http');

// Test if localhost:3001 is serving the app
console.log('🧪 Testing localhost:3000...');

const req = http.get('http://localhost:3000', (res) => {
  console.log(`✅ Server responded with status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (data.includes('<title>Cynclaim</title>') || data.includes('Cynclaim')) {
      console.log('✅ App is loading correctly!');
      console.log('🌐 Open your browser and go to: http://localhost:3000');
    } else {
      console.log('⚠️  App is running but may not be loading correctly');
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.log('❌ Server is not responding:', err.message);
  console.log('');
  console.log('💡 Make sure to run: npm start');
  console.log('⚠️  The development server might be starting up...');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.log('⏰ Request timed out - server might still be starting');
  console.log('🔄 Try running: npm start');
  req.destroy();
  process.exit(1);
});