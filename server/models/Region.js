const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  regionCode: { type: String, required: true, unique: true },
  regionName: { type: String, required: true },
  shortName: { type: String, required: true },
  regionalDirector: { type: String },
  iznFocalPerson: { type: String },
  projectTechnicalStaff: { type: String },
  officialEmail: { type: String },
  contactNumber: { type: String },
  officeAddress: { type: String },
  logoUrl: { type: String },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Region', regionSchema);
