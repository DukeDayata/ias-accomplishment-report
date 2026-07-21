const mongoose = require('mongoose');

const reportingPeriodSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  quarter: { type: Number, required: true },
  month: { type: Number, required: true },
  weekNumber: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  submissionDeadline: { type: Date },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  locked: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReportingPeriod', reportingPeriodSchema);
