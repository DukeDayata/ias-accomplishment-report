const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  indicatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Indicator' },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  commentType: { type: String, enum: ['Report', 'Category', 'Indicator', 'Document'], required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
