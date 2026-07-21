require('dotenv').config();
const mongoose = require('mongoose');
const AccomplishmentEntry = require('./models/AccomplishmentEntry');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to DB. Cleaning up imported entries...');

  // We delete entries that were likely imported (draft status)
  const result = await AccomplishmentEntry.deleteMany({ status: 'Draft' });
  console.log(`Deleted ${result.deletedCount} corrupted draft entries.`);

  console.log('Cleanup complete. You can now re-import the Excel file.');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
