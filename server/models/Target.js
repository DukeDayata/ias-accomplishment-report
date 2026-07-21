const mongoose = require('mongoose');

const targetSchema = new mongoose.Schema({
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  indicatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Indicator', required: true },
  reportingYear: { type: Number, required: true },
  annualTarget: { type: Number, required: true, default: 0 },
  quarterlyTargets: [{
    quarter: { type: Number },
    target: { type: Number }
  }],
  monthlyTargets: [{
    month: { type: Number },
    target: { type: Number }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Target', targetSchema);
