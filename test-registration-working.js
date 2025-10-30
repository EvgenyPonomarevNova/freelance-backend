// test-registration-working.js
const http = require('http');

console.log('🚀 Testing registration with correct data...\n');

const postData = JSON.stringify({
  email: 'working-test' + Date.now() + '@example.com',
  password: 'test123',
  fullName: 'Работающий Тест',
  role: 'freelancer'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Sending POST to /api/auth/register with data:');
console.log(postData);

const req = http.request(options, (res) => {
  console.log('\n✅ Response received:');
  console.log('Status Code:', res.statusCode);
  console.log('Status Message:', res.statusMessage);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Response Data:', JSON.stringify(result, null, 2));
      
      if (res.statusCode === 201) {
        console.log('\n🎉 SUCCESS: Registration is working!');
        console.log('User created:', result.user.email);
        console.log('Token received:', result.token ? 'Yes' : 'No');
      } else {
        console.log('\n❌ Registration failed with error:', result.error);
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request failed:', error.message);
});

req.write(postData);
req.end();