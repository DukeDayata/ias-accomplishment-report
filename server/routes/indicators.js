const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Indicator = require('../models/Indicator');

// @route   GET /api/indicators
// @desc    Get all indicators (can filter by category)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const query = { active: true };
    if (req.query.categoryId) {
      query.categoryId = req.query.categoryId;
    }
    
    const indicators = await Indicator.find(query).sort({ displayOrder: 1 }).populate('categoryId');
    res.json(indicators);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
