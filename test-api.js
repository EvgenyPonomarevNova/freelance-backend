// test-api.js
const http = require('http');

const testEndpoints = async () => {
  const baseURL = 'http://localhost:3001/api';
  
  console.log('🚀 Testing API endpoints...\n');
  
  // Функция для выполнения HTTP запросов
  const makeRequest = (options, data = null) => {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            resolve({
              statusCode: res.statusCode,
              data: parsedData
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: responseData
            });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  };
  
  try {
    // 1. Health check
    console.log('1. Testing health check...');
    const healthResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Health check:', healthResult.statusCode, healthResult.data.status);
    
    // 2. Test body parsing
    console.log('\n2. Testing body parsing...');
    const testBodyResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/test-body',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, { test: 'data', number: 123 });
    console.log('✅ Body parsing:', testBodyResult.statusCode, testBodyResult.data.message);
    
    // 3. Test registration
    console.log('\n3. Testing user registration...');
    const registerData = {
      email: 'testuser' + Date.now() + '@example.com',
      password: 'testpassword123',
      fullName: 'Тестовый Пользователь',
      role: 'freelancer'
    };
    
    const registerResult = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, registerData);
    
    if (registerResult.statusCode === 201 || registerResult.statusCode === 200) {
      console.log('✅ Registration successful');
      console.log('   User ID:', registerResult.data.user?.id);
      console.log('   Email:', registerResult.data.user?.email);
      
      // 4. Test login
      console.log('\n4. Testing user login...');
      const loginResult = await makeRequest({
        hostname: 'localhost',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        email: registerData.email,
        password: registerData.password
      });
      
      if (loginResult.statusCode === 200) {
        console.log('✅ Login successful');
        const token = loginResult.data.token;
        console.log('   Token received:', !!token);
        
        // 5. Test protected route
        console.log('\n5. Testing protected route...');
        const meResult = await makeRequest({
          hostname: 'localhost',
          port: 3001,
          path: '/api/auth/me',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (meResult.statusCode === 200) {
          console.log('✅ Protected route access: OK');
          console.log('   User email:', meResult.data.user?.email);
        } else {
          console.log('❌ Protected route failed:', meResult.statusCode, meResult.data?.error);
        }
      } else {
        console.log('❌ Login failed:', loginResult.statusCode, loginResult.data?.error);
      }
    } else {
      console.log('❌ Registration failed:', registerResult.statusCode, registerResult.data?.error);
    }
    
    console.log('\n🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

testEndpoints();