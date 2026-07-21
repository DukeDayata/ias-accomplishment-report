const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Region = require('./models/Region');
const Category = require('./models/Category');
const Indicator = require('./models/Indicator');

dotenv.config();

const regionsList = [
  { regionCode: 'R01', regionName: 'CHED Regional Office I – Ilocos Region', shortName: 'Region I' },
  { regionCode: 'R02', regionName: 'CHED Regional Office II – Cagayan Valley', shortName: 'Region II' },
  { regionCode: 'R03', regionName: 'CHED Regional Office III – Central Luzon', shortName: 'Region III' },
  { regionCode: 'R04A', regionName: 'CHED Regional Office IV-A – CALABARZON', shortName: 'Region IV-A' },
  { regionCode: 'R04B', regionName: 'CHED MIMAROPA', shortName: 'MIMAROPA' },
  { regionCode: 'R05', regionName: 'CHED Regional Office V – Bicol Region', shortName: 'Region V' },
  { regionCode: 'R06', regionName: 'CHED Regional Office VI – Western Visayas', shortName: 'Region VI' },
  { regionCode: 'R07', regionName: 'CHED Regional Office VII – Central Visayas', shortName: 'Region VII' },
  { regionCode: 'R08', regionName: 'CHED Regional Office VIII – Eastern Visayas', shortName: 'Region VIII' },
  { regionCode: 'R09', regionName: 'CHED Regional Office IX – Zamboanga Peninsula', shortName: 'Region IX' },
  { regionCode: 'R10', regionName: 'CHED Regional Office X – Northern Mindanao', shortName: 'Region X' },
  { regionCode: 'R11', regionName: 'CHED Regional Office XI – Davao Region', shortName: 'Region XI' },
  { regionCode: 'R12', regionName: 'CHED Regional Office XII – SOCCSKSARGEN', shortName: 'Region XII' },
  { regionCode: 'R13', regionName: 'CHED Regional Office XIII – Caraga', shortName: 'Caraga' },
  { regionCode: 'CAR', regionName: 'CHED Cordillera Administrative Region', shortName: 'CAR' },
  { regionCode: 'NCR', regionName: 'CHED National Capital Region', shortName: 'NCR' },
  { regionCode: 'NIR', regionName: 'CHED Negros Island Region', shortName: 'NIR' }
];

const categoriesData = [
  {
    categoryCode: 'CAT-1',
    categoryName: 'Travel Assessments',
    description: 'Travel assessments for SUC officials and students.',
    displayOrder: 1,
    indicators: [
      { code: 'IND-1-1', name: 'SUC officials and staff travel assessments received and processed', uom: 'Requests' },
      { code: 'IND-1-2', name: 'Student mobility requests received and processed', uom: 'Requests' }
    ]
  },
  {
    categoryCode: 'CAT-2',
    categoryName: 'Partnership Assessments',
    description: 'Review and recording of partnership agreements.',
    displayOrder: 2,
    indicators: [
      { code: 'IND-2-1', name: 'Partnership assessments received and reviewed', uom: 'Assessments' },
      { code: 'IND-2-2', name: 'Partnership agreements recorded in the Partnerships Database', uom: 'Agreements' }
    ]
  },
  {
    categoryCode: 'CAT-3',
    categoryName: 'Transnational Higher Education',
    description: 'Processing of TNHE applications.',
    displayOrder: 3,
    indicators: [
      { code: 'IND-3-1', name: 'TNHE applications received', uom: 'Applications' },
      { code: 'IND-3-2', name: 'TNHE applications reviewed or processed', uom: 'Applications' },
      { code: 'IND-3-3', name: 'TNHE applications approved', uom: 'Applications' },
      { code: 'IND-3-4', name: 'TNHE applications disapproved', uom: 'Applications' }
    ]
  },
  {
    categoryCode: 'CAT-4',
    categoryName: 'Regional Internationalization Initiatives',
    description: 'Information sessions and activities conducted regionally.',
    displayOrder: 4,
    indicators: [
      { code: 'IND-4-1', name: 'Internationalization information sessions conducted', uom: 'Sessions' },
      { code: 'IND-4-2', name: 'TNHE information sessions conducted', uom: 'Sessions' },
      { code: 'IND-4-3', name: 'Internationalization events and activities conducted', uom: 'Events' }
    ]
  },
  {
    categoryCode: 'CAT-5',
    categoryName: 'NCAIM Verifications',
    description: 'Verifications of international higher education institutions.',
    displayOrder: 5,
    indicators: [
      { code: 'IND-5-1', name: 'International HEI verifications received for partnerships', uom: 'Verifications' },
      { code: 'IND-5-2', name: 'International HEI verifications received for degree credentials', uom: 'Verifications' },
      { code: 'IND-5-3', name: 'Other international HEI verifications received', uom: 'Verifications' }
    ]
  },
  {
    categoryCode: 'CAT-6',
    categoryName: 'Support to IAS Operations',
    description: 'Events attended and assistance provided.',
    displayOrder: 6,
    indicators: [
      { code: 'IND-6-1', name: 'Internationalization events, meetings, and information sessions attended', uom: 'Events' },
      { code: 'IND-6-2', name: 'Internationalization activities assisted or co-hosted', uom: 'Activities' },
      { code: 'IND-6-3', name: 'Dissemination of IAS memoranda, announcements, and related information', uom: 'Issuances' }
    ]
  },
  {
    categoryCode: 'CAT-7',
    categoryName: 'Other Internationalization Activities and Accomplishments',
    description: 'Custom activities and other accomplishments.',
    displayOrder: 7,
    indicators: []
  }
];

const seedData = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in .env");
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Region.deleteMany({});
    await Category.deleteMany({});
    await Indicator.deleteMany({});

    // Seed Regions
    console.log('Seeding Regions...');
    const insertedRegions = await Region.insertMany(regionsList);
    const ncrRegion = insertedRegions.find(r => r.regionCode === 'NCR');

    // Seed Categories and Indicators
    console.log('Seeding Categories and Indicators...');
    for (const catData of categoriesData) {
      const category = await Category.create({
        categoryCode: catData.categoryCode,
        categoryName: catData.categoryName,
        description: catData.description,
        displayOrder: catData.displayOrder
      });

      if (catData.indicators.length > 0) {
        const indicatorDocs = catData.indicators.map((ind, index) => ({
          categoryId: category._id,
          indicatorCode: ind.code,
          indicatorName: ind.name,
          unitOfMeasure: ind.uom,
          reportingFrequency: 'Weekly',
          displayOrder: index + 1
        }));
        await Indicator.insertMany(indicatorDocs);
      }
    }

    // Seed Users
    console.log('Seeding Users...');
    
    // Create IAS Super Admin
    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@ched.gov.ph',
      password: 'password123',
      role: 'IAS Super Administrator'
    });

    // Create a Regional Focal for testing
    if (ncrRegion) {
      await User.create({
        firstName: 'Focal',
        lastName: 'Person',
        email: 'ncr.focal@ched.gov.ph',
        password: 'password123',
        role: 'Regional Administrator or IZN Focal Person',
        regionId: ncrRegion._id
      });
      
      // Create a Regional Encoder for testing
      await User.create({
        firstName: 'Encoder',
        lastName: 'Staff',
        email: 'ncr.encoder@ched.gov.ph',
        password: 'password123',
        role: 'Regional Encoder or Project Technical Staff',
        regionId: ncrRegion._id
      });
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
