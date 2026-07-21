const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Region = require('../models/Region');

// @route   GET /api/regions
// @desc    Get all regions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const regions = await Region.find({}).sort({ regionCode: 1 });
    res.json(regions);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/regions/:id
// @desc    Get region by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);
    if (!region) {
      return res.status(404).json({ error: 'Region not found' });
    }
    res.json(region);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
