// debug-routes-correct.js
const http = require('http');

console.log('🔍 Debugging routes with correct methods...\n');

const routes = [
  { path: '/api/health', method: 'GET' },
  { path: '/api/projects', method: 'GET' },
  { path: '/api/users', method: 'GET' },
  { path: '/api/auth/register', method: 'POST' },
  { path: '/api/auth/login', method: 'POST' },
  { path: '/api/auth/oauth/yandex/login', method: 'POST' }
];

routes.forEach(({ path, method }) => {
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: path,
    method: method
  }, (res) => {
    console.log(`${method} ${path}: ${res.statusCode} ${res.statusMessage}`);
  });

  req.on('error', (error) => {
    console.log(`${method} ${path}: ERROR - ${error.message}`);
  });

  // Для POST запросов отправляем пустое тело
  if (method === 'POST') {
    req.write(JSON.stringify({}));
    req.end();
  } else {
    req.end();
  }
});