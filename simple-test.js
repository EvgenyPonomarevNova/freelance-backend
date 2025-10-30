// simple-test.js
const http = require('http');

console.log('🚀 Starting simple API test...\n');

// Test 1: Health check
console.log('1. Testing health check...');
const healthReq = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/health',
  method: 'GET'
}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Health check response:');
    console.log('   Status:', res.statusCode);
    console.log('   Data:', JSON.parse(data));
    
    // Test 2: Registration after health check
    testRegistration();
  });
});

healthReq.on('error', (error) => {
  console.log('❌ Health check failed - is server running?');
  console.log('   Error:', error.message);
  console.log('\n💡 Make sure the server is running on port 3001');
  console.log('   Run: npm run dev');
});

healthReq.end();

function testRegistration() {
  console.log('\n2. Testing user registration...');
  
  const postData = JSON.stringify({
    email: 'test' + Date.now() + '@example.com',
    password: 'test123',
    fullName: 'Тестовый Пользователь',
    role: 'freelancer'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Registration response:');
      console.log('   Status:', res.statusCode);
      
      try {
        const result = JSON.parse(data);
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   Success:', result.success);
          console.log('   User email:', result.user?.email);
          console.log('   Token length:', result.token?.length);
        } else {
          console.log('   Error:', result.error);
        }
      } catch (e) {
        console.log('   Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Registration request failed:', error.message);
  });

  req.write(postData);
  req.end();
}