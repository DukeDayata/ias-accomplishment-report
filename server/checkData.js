const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const { AccomplishmentEntry } = require('./models/index');

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const activities = await AccomplishmentEntry.find({ reportType: 'activity' });
  console.log(`Total Activities found in DB: ${activities.length}`);
  if (activities.length > 0) {
      console.log('Sample Activity Year:', activities[0].reportingYear, activities[0].startDate);
  }
  
  mongoose.connection.close();
}

checkData();
