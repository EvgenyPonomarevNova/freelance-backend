// test-all.js
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

// Конфигурация axios
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Глобальные переменные для хранения данных между тестами
let clientToken = '';
let freelancerToken = '';
let testProjectId = '';
let testResponseId = '';
let clientUserId = '';
let freelancerUserId = '';

// Функция для красивого вывода результатов
function logTest(name, success, data = null, error = null) {
  const emoji = success ? '✅' : '❌';
  console.log(`${emoji} ${name}`);
  if (data && typeof data === 'object') {
    console.log(`   Данные:`, JSON.stringify(data, null, 2).split('\n').slice(0, 3).join('\n   '));
  } else if (data) {
    console.log(`   Данные: ${data}`);
  }
  if (error) {
    if (typeof error === 'object') {
      console.log(`   Ошибка: ${error.message || JSON.stringify(error)}`);
    } else {
      console.log(`   Ошибка: ${error}`);
    }
  }
  console.log(''); // пустая строка для разделения
}

// Функция задержки
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAllTests() {
  console.log('🚀 ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ API\n');
  console.log('='.repeat(50));

  try {
    // 0. ПРОВЕРКА СЕРВЕРА
    console.log('\n🔍 ПРОВЕРКА СЕРВЕРА');
    console.log('-'.repeat(30));

    try {
      const healthResponse = await client.get('/health');
      logTest('Health check сервера', true, {
        status: healthResponse.data.status,
        database: healthResponse.data.database,
        environment: healthResponse.data.environment
      });
    } catch (error) {
      logTest('Health check сервера', false, null, 'Сервер не запущен или недоступен');
      console.log('💡 Убедитесь, что сервер запущен на порту 3001: node server.js');
      return;
    }

    // 1. ТЕСТИРОВАНИЕ АУТЕНТИФИКАЦИИ
    console.log('\n🔐 ТЕСТИРОВАНИЕ АУТЕНТИФИКАЦИИ');
    console.log('-'.repeat(30));

    // Регистрация клиента
    const clientEmail = `client${Date.now()}@test.com`;
    try {
      const registerResponse = await client.post('/auth/register', {
        email: clientEmail,
        password: 'password123',
        fullName: 'Test Client',
        role: 'client'
      });
      clientToken = registerResponse.data.token;
      clientUserId = registerResponse.data.user.id;
      logTest('Регистрация клиента', true, {
        email: clientEmail,
        userId: clientUserId,
        role: 'client'
      });
    } catch (error) {
      logTest('Регистрация клиента', false, null, error.response?.data || error.message);
    }

    await delay(500); // Небольшая задержка между запросами

    // Регистрация фрилансера
    const freelancerEmail = `freelancer${Date.now()}@test.com`;
    try {
      const registerResponse = await client.post('/auth/register', {
        email: freelancerEmail,
        password: 'password123',
        fullName: 'Test Freelancer',
        role: 'freelancer'
      });
      freelancerToken = registerResponse.data.token;
      freelancerUserId = registerResponse.data.user.id;
      logTest('Регистрация фрилансера', true, {
        email: freelancerEmail,
        userId: freelancerUserId,
        role: 'freelancer'
      });
    } catch (error) {
      logTest('Регистрация фрилансера', false, null, error.response?.data || error.message);
    }

    await delay(500);

    // Логин клиента
    try {
      const loginResponse = await client.post('/auth/login', {
        email: clientEmail,
        password: 'password123'
      });
      clientToken = loginResponse.data.token;
      logTest('Логин клиента', true, {
        user: loginResponse.data.user.profile.name,
        role: loginResponse.data.user.role
      });
    } catch (error) {
      logTest('Логин клиента', false, null, error.response?.data || error.message);
    }

    await delay(500);

    // Получение профиля
    try {
      // Временно устанавливаем токен для этого запроса
      const tempClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        }
      });
      
      const meResponse = await tempClient.get('/auth/me');
      logTest('Получение профиля', true, {
        name: meResponse.data.user.profile.name,
        email: meResponse.data.user.email
      });
    } catch (error) {
      logTest('Получение профиля', false, null, error.response?.data || error.message);
    }

    // 2. ТЕСТИРОВАНИЕ ПРОЕКТОВ
    console.log('\n📋 ТЕСТИРОВАНИЕ ПРОЕКТОВ');
    console.log('-'.repeat(30));

    // Создание проекта
    try {
      const projectData = {
        title: 'Разработка веб-приложения для тестирования API',
        description: 'Нужно разработать современное веб-приложение с использованием React на фронтенде и Node.js на бэкенде. Требуется реализовать аутентификацию, работу с базой данных и красивый UI.',
        category: 'development',
        budget: 75000,
        deadline: '2024-12-31',
        skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'Express']
      };
      
      const tempClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        }
      });
      
      const createResponse = await tempClient.post('/projects', projectData);
      testProjectId = createResponse.data.project.id;
      logTest('Создание проекта', true, {
        id: testProjectId,
        title: createResponse.data.project.title,
        budget: createResponse.data.project.budget,
        category: createResponse.data.project.category
      });
    } catch (error) {
      logTest('Создание проекта', false, null, error.response?.data || error.message);
    }

    await delay(500);

    // Получение всех проектов
    try {
      const projectsResponse = await client.get('/projects?limit=3');
      logTest('Получение всех проектов', true, {
        found: projectsResponse.data.results,
        total: projectsResponse.data.total,
        pages: projectsResponse.data.pages
      });
    } catch (error) {
      logTest('Получение всех проектов', false, null, error.response?.data || error.message);
    }

    // Получение проекта по ID
    try {
      const projectResponse = await client.get(`/projects/${testProjectId}`);
      logTest('Получение проекта по ID', true, {
        title: projectResponse.data.project.title,
        views: projectResponse.data.project.views,
        status: projectResponse.data.project.status
      });
    } catch (error) {
      logTest('Получение проекта по ID', false, null, error.response?.data || error.message);
    }

    // Получение моих проектов (клиента)
    try {
      const tempClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        }
      });
      
      const myProjectsResponse = await tempClient.get('/projects/client/my-projects');
      logTest('Получение моих проектов (клиент)', true, {
        count: myProjectsResponse.data.results
      });
    } catch (error) {
      logTest('Получение моих проектов (клиент)', false, null, error.response?.data || error.message);
    }

    // 3. ТЕСТИРОВАНИЕ ОТКЛИКОВ
    console.log('\n💼 ТЕСТИРОВАНИЕ ОТКЛИКОВ');
    console.log('-'.repeat(30));

    // Отклик на проект (фрилансер)
    try {
      const responseData = {
        proposal: 'Готов взяться за проект! Имею богатый опыт в React и Node.js. Выполню работу качественно и в срок.',
        price: 70000,
        timeline: '3 недели'
      };
      
      const tempClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freelancerToken}`
        }
      });
      
      const respondResponse = await tempClient.post(`/projects/${testProjectId}/respond`, responseData);
      testResponseId = respondResponse.data.response.id;
      logTest('Отклик на проект (фрилансер)', true, {
        responseId: testResponseId,
        status: respondResponse.data.response.status,
        price: respondResponse.data.response.price
      });
    } catch (error) {
      logTest('Отклик на проект (фрилансер)', false, null, error.response?.data || error.message);
    }

    await delay(500);

    // Получение моих откликов (фрилансер)
    try {
      const tempClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freelancerToken}`
        }
      });
      
      const myResponses = await tempClient.get('/projects/my/responses');
      logTest('Получение моих откликов (фрилансер)', true, {
        count: myResponses.data.results
      });
    } catch (error) {
      logTest('Получение моих откликов (фрилансер)', false, null, error.response?.data || error.message);
    }

    // Обновление статуса отклика (клиент)
    try {
      const updateData = {
        status: 'accepted'
      };
      
      const tempClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        }
      });
      
      const updateResponse = await tempClient.patch(`/projects/${testProjectId}/responses/${testResponseId}`, updateData);
      logTest('Обновление статуса отклика (клиент)', true, {
        newStatus: updateResponse.data.response.status,
        message: updateResponse.data.message
      });
    } catch (error) {
      logTest('Обновление статуса отклика (клиент)', false, null, error.response?.data || error.message);
    }

    // 4. ТЕСТИРОВАНИЕ ПОЛЬЗОВАТЕЛЕЙ
    console.log('\n👥 ТЕСТИРОВАНИЕ ПОЛЬЗОВАТЕЛЕЙ');
    console.log('-'.repeat(30));

    // Получение списка фрилансеров
    try {
      const freelancersResponse = await client.get('/users/freelancers?limit=3');
      logTest('Получение списка фрилансеров', true, {
        found: freelancersResponse.data.results,
        total: freelancersResponse.data.total
      });
    } catch (error) {
      logTest('Получение списка фрилансеров', false, null, error.response?.data || error.message);
    }

    // Обновление профиля клиента
    try {
      const profileData = {
        name: 'Обновленное Имя Клиента',
        bio: 'Это обновленная биография тестового пользователя. Занимаюсь управлением проектами.',
        skills: ['Project Management', 'Testing', 'QA', 'Business Analysis'],
        category: 'development'
      };
      
      const tempClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        }
      });
      
      const updateResponse = await tempClient.patch('/users/profile', profileData);
      logTest('Обновление профиля клиента', true, {
        newName: updateResponse.data.user.profile.name,
        skills: updateResponse.data.user.profile.skills.length
      });
    } catch (error) {
      logTest('Обновление профиля клиента', false, null, error.response?.data || error.message);
    }

    // Получение профиля пользователя по ID
    try {
      const userProfile = await client.get(`/users/${clientUserId}`);
      logTest('Получение профиля по ID', true, {
        name: userProfile.data.user.profile.name,
        role: userProfile.data.user.role
      });
    } catch (error) {
      logTest('Получение профиля по ID', false, null, error.response?.data || error.message);
    }

    // 5. ТЕСТИРОВАНИЕ ВАЛИДАЦИИ И ОШИБОК
    console.log('\n⚡ ТЕСТИРОВАНИЕ ВАЛИДАЦИИ И ОШИБОК');
    console.log('-'.repeat(30));

    // Тест валидации (неправильные данные)
    try {
      const invalidData = {
        title: 'Кр', // Слишком короткий заголовок
        description: 'Коротко', // Слишком короткое описание
        category: 'invalid-category', // Невалидная категория
        budget: 500 // Бюджет меньше минимального
      };
      
      const tempClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientToken}`
        }
      });
      
      await tempClient.post('/projects', invalidData);
      logTest('Валидация данных', false, null, 'Ожидалась ошибка валидации, но запрос прошел');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logTest('Валидация данных', true, {
          status: 'Валидация работает корректно',
          code: error.response.status
        });
      } else {
        logTest('Валидация данных', false, null, error.response?.data || error.message);
      }
    }

    // Тест неавторизованного доступа
    try {
      const unauthorizedClient = axios.create({
        baseURL: API_BASE,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      await unauthorizedClient.post('/projects', { title: 'test' });
      logTest('Неавторизованный доступ', false, null, 'Ожидалась ошибка 401');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        logTest('Неавторизованный доступ', true, {
          status: 'Защита маршрутов работает',
          code: error.response.status
        });
      } else {
        logTest('Неавторизованный доступ', false, null, error.response?.data || error.message);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
    console.log('='.repeat(50));
    console.log('\n📊 Сводка:');
    console.log('• Аутентификация и регистрация');
    console.log('• Создание и управление проектами');
    console.log('• Система откликов и статусов');
    console.log('• Управление профилями пользователей');
    console.log('• Валидация и обработка ошибок');
    console.log('\n🚀 Все основные функции API протестированы!');

  } catch (error) {
    console.log('💥 КРИТИЧЕСКАЯ ОШИБКА:', error.message);
  }
}

// Запускаем все тесты
runAllTests();