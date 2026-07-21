const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  categoryCode: { type: String, required: true, unique: true },
  categoryName: { type: String, required: true },
  description: { type: String },
  displayOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);
