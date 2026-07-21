const mongoose = require('mongoose');

const accomplishmentEntrySchema = new mongoose.Schema({
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  indicatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Indicator', default: null },
  reportingPeriodId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReportingPeriod' },
  
  reportType: { type: String, enum: ['weekly', 'activity'], required: true },
  
  reportingYear: { type: Number, required: true },
  quarter: { type: Number, default: 1 }, // Keep for compatibility but not strict
  monthIndex: { type: Number, min: 0, max: 11, default: null }, // 0 for Jan, 11 for Dec
  weekNumber: { type: Number, min: 1, max: 6, default: null }, // Week 1-5(or 6) of the month
  weekStartDate: { type: Date, default: null },
  
  activityTitle: { type: String, trim: true, default: '' },
  activityDescription: { type: String, trim: true, default: '' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  
  target: { type: Number, default: 0 },
  actual: { type: Number, min: 0, required: true },
  cumulativeActual: { type: Number, default: 0 },
  variance: { type: Number, default: 0 },
  accomplishmentPercentage: { type: Number, default: 0 },
  
  remarks: { type: String, trim: true, default: '' },
  evidenceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'Submitted to IAS' }
}, {
  timestamps: true
});

accomplishmentEntrySchema.index(
  {
    regionId: 1,
    indicatorId: 1,
    reportingYear: 1,
    monthIndex: 1,
    weekNumber: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      reportType: "weekly"
    }
  }
);

accomplishmentEntrySchema.index(
  {
    regionId: 1,
    categoryId: 1,
    activityTitle: 1,
    startDate: 1,
    endDate: 1,
    reportingYear: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      reportType: "activity"
    }
  }
);

module.exports = mongoose.model('AccomplishmentEntry', accomplishmentEntrySchema);
