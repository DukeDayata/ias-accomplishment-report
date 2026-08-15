const http = require('http');

const baseURL = 'http://localhost:5000/api/public/analytics';

const endpoints = [
  '/summary',
  '/regions',
  '/categories',
  '/trends',
  '/indicators',
  '/matrix',
  '/activities',
  '/export'
];

async function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseURL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ path, statusCode: res.statusCode, status: parsed.status, dataType: typeof parsed.data });
        } catch (e) {
          resolve({ path, statusCode: res.statusCode, error: e.message, raw: data.substring(0, 100) });
        }
      });
    }).on('error', err => {
      resolve({ path, error: err.message });
    });
  });
}

async function runTests() {
  console.log('Testing Public Analytics API endpoints...\n');
  for (const path of endpoints) {
    const result = await testEndpoint(path);
    console.log(`Endpoint ${path.padEnd(15)} -> HTTP ${result.statusCode || 'ERR'} | Status: ${result.status || result.error || 'N/A'}`);
  }
}

runTests();
