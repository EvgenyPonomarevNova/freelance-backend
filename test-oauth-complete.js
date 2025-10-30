// test-oauth-complete.js
const http = require('http');

console.log('🔐 Testing complete OAuth implementation...\n');

// Тест 1: Демо OAuth
console.log('1. Testing DEMO OAuth...');
testOAuth('demo_oauth_test_' + Date.now());

// Тест 2: Еще один демо пользователь
setTimeout(() => {
  console.log('\n2. Testing another DEMO OAuth user...');
  testOAuth('demo_oauth_test2_' + Date.now());
}, 1000);

function testOAuth(code) {
  const oauthData = JSON.stringify({ code });

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

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('   Status:', res.statusCode);
      
      try {
        const result = JSON.parse(data);
        
        if (result.success) {
          console.log('   ✅ SUCCESS');
          console.log('   User:', result.user.email);
          console.log('   OAuth Provider:', result.user.profile.oauthProvider);
          console.log('   Is Demo:', result.isDemo);
          console.log('   Token length:', result.token.length);
        } else {
          console.log('   ❌ Failed:', result.error);
        }
      } catch (e) {
        console.log('   Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('   Request failed:', error.message);
  });

  req.write(oauthData);
  req.end();
}