const mongoose = require('mongoose');

const indicatorSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  indicatorCode: { type: String, required: true, unique: true },
  indicatorName: { type: String, required: true },
  description: { type: String },
  unitOfMeasure: { type: String },
  reportingFrequency: { type: String, enum: ['Weekly', 'Monthly', 'Quarterly', 'Semiannual', 'Annual'], default: 'Weekly' },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  annualTarget: { type: Number, default: 100 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Indicator', indicatorSchema);
