const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  reportingPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportingPeriod' },
  reportingYear: { type: Number, required: true },
  quarter: { type: Number },
  month: { type: Number },
  reportType: { type: String, enum: ['Weekly', 'Monthly', 'Quarterly', 'Annual'], required: true },
  status: { 
    type: String, 
    enum: [
      'Draft', 
      'For Regional Review', 
      'Returned by Regional Focal', 
      'For Regional Director Certification', 
      'Returned by Regional Director', 
      'Certified by Regional Director', 
      'Submitted to IAS', 
      'Under IAS Review', 
      'For Regional Compliance', 
      'Resubmitted', 
      'IAS Verified', 
      'IAS Approved', 
      'Locked', 
      'Archived'
    ],
    default: 'Submitted to IAS'
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  certifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedAt: { type: Date },
  certifiedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  regionalRemarks: { type: String },
  iasRemarks: { type: String },
  lockedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
