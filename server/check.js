const AuditLog = require('./models/AuditLog');
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const logs = await AuditLog.find({});
    console.log('LOGS in DB:', logs.length);
    process.exit(0);
  });
