const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Region = require('./models/Region');
const Category = require('./models/Category');
const Indicator = require('./models/Indicator');
const AccomplishmentEntry = require('./models/AccomplishmentEntry');
const User = require('./models/User');
const Target = require('./models/Target');

dotenv.config();

const regionsList = [
  { regionCode: 'R01', regionName: 'CHED Regional Office I – Ilocos Region', shortName: 'Region I' },
  { regionCode: 'R02', regionName: 'CHED Regional Office II – Cagayan Valley', shortName: 'Region II' },
  { regionCode: 'R03', regionName: 'CHED Regional Office III – Central Luzon', shortName: 'Region III' },
  { regionCode: 'R04A', regionName: 'CHED Regional Office IV-A – CALABARZON', shortName: 'Region IV-A' },
  { regionCode: 'R05', regionName: 'CHED Regional Office V – Bicol Region', shortName: 'Region V' },
  { regionCode: 'NCR', regionName: 'CHED National Capital Region', shortName: 'NCR' }
];

const categoriesList = [
  { categoryCode: 'CAT-1', categoryName: 'Travel Assessments', displayOrder: 1 },
  { categoryCode: 'CAT-2', categoryName: 'Partnership Assessments', displayOrder: 2 },
  { categoryCode: 'CAT-3', categoryName: 'Transnational Higher Education', displayOrder: 3 },
  { categoryCode: 'CAT-4', categoryName: 'Regional Internationalization Initiatives', displayOrder: 4 },
  { categoryCode: 'CAT-5', categoryName: 'NCAIM Verifications', displayOrder: 5 },
  { categoryCode: 'CAT-6', categoryName: 'Support to IAS Operations', displayOrder: 6 },
  { categoryCode: 'CAT-7', categoryName: 'Other Internationalization Activities and Accomplishments', displayOrder: 7 }
];

async function seedLocal() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/ias-reports');
    console.log('Connected to local MongoDB for seeding...');

    await Region.deleteMany({});
    await Category.deleteMany({});
    await Indicator.deleteMany({});
    await AccomplishmentEntry.deleteMany({});
    await Target.deleteMany({});

    const savedRegions = await Region.insertMany(regionsList);
    const savedCategories = await Category.insertMany(categoriesList);

    const ind1 = await Indicator.create({
      categoryId: savedCategories[0]._id,
      indicatorCode: 'IND-1-1',
      indicatorName: 'SUC officials and staff travel assessments received and processed',
      unitOfMeasure: 'Requests',
      annualTarget: 100
    });

    const ind2 = await Indicator.create({
      categoryId: savedCategories[1]._id,
      indicatorCode: 'IND-2-1',
      indicatorName: 'Partnership assessments received and reviewed',
      unitOfMeasure: 'Assessments',
      annualTarget: 50
    });

    // Create user for enteredBy
    const testUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'localadmin@ched.gov.ph',
      password: 'password123',
      role: 'IAS Super Administrator'
    });

    // Create sample accomplishments
    await AccomplishmentEntry.create({
      regionId: savedRegions[0]._id,
      categoryId: savedCategories[0]._id,
      indicatorId: ind1._id,
      reportType: 'weekly',
      reportingYear: 2026,
      monthIndex: 0,
      weekNumber: 1,
      actual: 15,
      enteredBy: testUser._id,
      status: 'IAS Approved'
    });

    await AccomplishmentEntry.create({
      regionId: savedRegions[5]._id, // NCR
      categoryId: savedCategories[1]._id,
      indicatorId: ind2._id,
      reportType: 'weekly',
      reportingYear: 2026,
      monthIndex: 1,
      weekNumber: 2,
      actual: 28,
      enteredBy: testUser._id,
      status: 'IAS Approved'
    });

    await AccomplishmentEntry.create({
      regionId: savedRegions[5]._id, // NCR
      categoryId: savedCategories[6]._id, // CAT-7
      reportType: 'activity',
      reportingYear: 2026,
      activityTitle: 'ASEAN Higher Education Summit 2026',
      activityDescription: 'International delegation hosting and bilateral discussions.',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-12'),
      actual: 1,
      remarks: 'Successfully organized with 15 international partner universities.',
      enteredBy: testUser._id,
      status: 'IAS Approved'
    });

    console.log('Local MongoDB seeded successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Local seed error:', err);
    process.exit(1);
  }
}

seedLocal();
