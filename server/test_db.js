require('dotenv').config();
const mongoose = require('mongoose');
const Entry = require('./models/AccomplishmentEntry');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const entries = await Entry.find({reportType: 'weekly'}).populate('indicatorId');
  console.log(JSON.stringify(entries.slice(0, 10), null, 2));
  process.exit(0);
});
