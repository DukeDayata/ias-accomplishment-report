const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  regionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  indicatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Indicator' },
  findingNumber: { type: String, required: true },
  finding: { type: String, required: true },
  requiredAction: { type: String },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateIssued: { type: Date, default: Date.now },
  dueDate: { type: Date },
  regionalResponse: { type: String },
  resolution: { type: String },
  status: { 
    type: String, 
    enum: ['Open', 'For Regional Action', 'Response Submitted', 'Under IAS Review', 'Resolved', 'Closed', 'Overdue'],
    default: 'Open'
  },
  resolvedAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Finding', findingSchema);
