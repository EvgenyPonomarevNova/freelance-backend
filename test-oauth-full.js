// test-oauth-full.js
const http = require('http');

console.log('🔐 Testing complete OAuth flow...\n');

// Тестируем OAuth с демо-данными
const oauthData = JSON.stringify({
  code: 'demo_oauth_code_' + Date.now(),
  provider: 'yandex'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/oauth/yandex/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(oauthData)
  }
};

console.log('Testing OAuth with demo data...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('OAuth Response Status:', res.statusCode);
    
    try {
      const result = JSON.parse(data);
      console.log('OAuth Response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n🎉 OAuth flow is working!');
        console.log('User:', result.user?.email);
        console.log('OAuth Provider:', result.user?.profile?.oauthProvider);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('OAuth request failed:', error.message);
});

req.write(oauthData);
req.end();