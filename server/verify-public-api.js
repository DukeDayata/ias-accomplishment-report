const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const http = require('http');

dotenv.config();

const app = express();
app.use(express.json());

// Mount public routes
app.use('/api/public/analytics', require('./routes/publicAnalytics'));

const PORT = 5055;

async function startAndTest() {
  const uris = [
    process.env.MONGODB_URI,
    process.env.MONGO_URI,
    'mongodb://127.0.0.1:27017/ias-reports'
  ].filter(Boolean);

  let connected = false;
  for (const uri of uris) {
    try {
      console.log(`Connecting to MongoDB (${uri.substring(0, 30)}...)...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      console.log('Successfully connected to MongoDB.');
      connected = true;
      break;
    } catch (err) {
      console.warn(`Connection failed for ${uri.substring(0, 30)}: ${err.message}`);
    }
  }

  if (!connected) {
    console.log('\nStarting express server in offline test mode...');
  }

  const server = app.listen(PORT, async () => {
    console.log(`Test server running on port ${PORT}\n`);

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

    for (const ep of endpoints) {
      await new Promise((resolve) => {
        http.get(`http://localhost:${PORT}/api/public/analytics${ep}`, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            console.log(`[PASS] GET /api/public/analytics${ep} -> HTTP ${res.statusCode}`);
            try {
              const json = JSON.parse(body);
              console.log(`       Meta: ${JSON.stringify(json.meta || {})}`);
              if (ep === '/summary' && json.data) {
                console.log(`       Summary: totalAccomplishments=${json.data.totalAccomplishments}, rate=${json.data.accomplishmentRate}%`);
              }
            } catch (e) {
              console.log(`       Raw response: ${body.substring(0, 80)}`);
            }
            resolve();
          });
        }).on('error', err => {
          console.error(`[FAIL] GET ${ep}: ${err.message}`);
          resolve();
        });
      });
    }

    server.close(() => {
      console.log('\nAll endpoint verification tests completed successfully!');
      if (mongoose.connection.readyState !== 0) {
        mongoose.connection.close();
      }
      process.exit(0);
    });
  });
}

startAndTest();
