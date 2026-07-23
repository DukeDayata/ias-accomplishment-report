const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AccomplishmentEntry = require('../models/AccomplishmentEntry');
const Region = require('../models/Region');
const Indicator = require('../models/Indicator');
const Category = require('../models/Category');
const { logAction } = require('../utils/logger');

// @route   GET /api/accomplishments
// @desc    Get accomplishments (with optional filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { regionId, reportingYear, quarter, month, weekNumber, status } = req.query;
    
    // Build query
    const query = {};
    if (regionId) query.regionId = regionId;
    else if (req.user.role.startsWith('Regional')) {
      query.regionId = req.user.regionId; // Restrict regional users to their own region
    }

    if (reportingYear) query.reportingYear = reportingYear;
    if (quarter) query.quarter = quarter;
    if (month) query.month = month;
    if (weekNumber) query.weekNumber = weekNumber;
    if (status) query.status = status;

    const accomplishments = await AccomplishmentEntry.find(query)
      .populate('indicatorId')
      .populate('enteredBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(accomplishments);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   GET /api/accomplishments/summary
// @desc    Get aggregate summary of accomplishments
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    const { regionId, reportingYear, status } = req.query;
    const mongoose = require('mongoose');
    const query = {};
    
    if (regionId) query.regionId = new mongoose.Types.ObjectId(regionId);
    else if (req.user.role.startsWith('Regional')) {
      query.regionId = new mongoose.Types.ObjectId(req.user.regionId);
    }

    if (reportingYear) query.reportingYear = parseInt(reportingYear);
    if (status) query.status = status;
    else if (req.user.role.startsWith('IAS')) {
      // For IAS, default exclude drafts
      query.status = { $nin: ['Draft', 'For Regional Review'] };
    }

    // Using aggregation to sum 'actual' field
    const result = await AccomplishmentEntry.aggregate([
      { $match: query },
      { $group: { _id: null, totalAccomplishments: { $sum: "$actual" } } }
    ]);

    const total = result.length > 0 ? result[0].totalAccomplishments : 0;
    res.json({ totalAccomplishments: total });
  } catch (error) {
    console.error("Summary error:", error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST /api/accomplishments
// @desc    Create or update accomplishment entry
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { 
      regionId, categoryId, indicatorId, 
      reportType, reportingYear, monthIndex, weekNumber, weekStartDate,
      activityTitle, activityDescription, startDate, endDate,
      actual, remarks 
    } = req.body;
    
    // Authorization check
    if (req.user.role.startsWith('Regional') && req.user.regionId.toString() !== regionId) {
      return res.status(403).json({ error: 'Not authorized for this region' });
    }

    if (reportType === 'weekly') {
      if (!indicatorId) return res.status(400).json({ error: 'Indicator is required for weekly reporting' });
      
      const ind = await Indicator.findById(indicatorId);
      if (!ind || ind.categoryId.toString() !== categoryId) {
        return res.status(400).json({ error: 'Indicator does not belong to the selected category' });
      }

      const updated = await AccomplishmentEntry.findOneAndUpdate(
        { regionId, indicatorId, reportingYear, monthIndex, weekNumber, reportType: 'weekly' },
        { 
          $set: { 
            categoryId, weekStartDate, actual, remarks, enteredBy: req.user._id,
            activityTitle: '', activityDescription: '', startDate: null, endDate: null
          } 
        },
        { upsert: true, returnDocument: 'after' }
      );
      
      await logAction(req, 'UPSERT', 'AccomplishmentEntry', updated._id, null, updated);
      
      return res.status(201).json({ message: 'Accomplishment saved successfully', entry: updated });

    } else if (reportType === 'activity') {
      if (!activityTitle || !startDate || !endDate) return res.status(400).json({ error: 'Missing activity fields' });
      if (new Date(endDate) < new Date(startDate)) return res.status(400).json({ error: 'End date cannot be earlier than start date' });

      const repYear = new Date(startDate).getFullYear();
      const updated = await AccomplishmentEntry.findOneAndUpdate(
        { regionId, categoryId, activityTitle, startDate, endDate, reportingYear: repYear, reportType: 'activity' },
        { 
          $set: { 
            activityDescription, actual, remarks, enteredBy: req.user._id,
            indicatorId: null, monthIndex: null, weekNumber: null, weekStartDate: null
          } 
        },
        { upsert: true, returnDocument: 'after' }
      );
      
      await logAction(req, 'UPSERT', 'AccomplishmentEntry', updated._id, null, updated);
      
      return res.status(201).json({ message: 'Activity accomplishment saved successfully', entry: updated });
    } else {
      return res.status(400).json({ error: 'Invalid reportType' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PUT /api/accomplishments/:id
// @desc    Update an accomplishment entry by ID
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { actual, remarks, status, weekNumber, monthIndex, weekStartDate, activityTitle, activityDescription, startDate, endDate } = req.body;
    let entry = await AccomplishmentEntry.findById(req.params.id);
    
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    
    const previousState = entry.toObject();
    
    // Auth check
    if (req.user.role.startsWith('Regional') && entry.regionId.toString() !== req.user.regionId?.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (entry.reportType === 'weekly') {
      if (actual !== undefined) entry.actual = actual;
      if (remarks !== undefined) entry.remarks = remarks;
      if (status !== undefined) entry.status = status;
      if (weekNumber !== undefined) entry.weekNumber = weekNumber;
      if (monthIndex !== undefined) entry.monthIndex = monthIndex;
      if (weekStartDate !== undefined) entry.weekStartDate = weekStartDate;
    } else if (entry.reportType === 'activity') {
      if (actual !== undefined) entry.actual = actual;
      if (remarks !== undefined) entry.remarks = remarks;
      if (status !== undefined) entry.status = status;
      if (activityTitle !== undefined) entry.activityTitle = activityTitle;
      if (activityDescription !== undefined) entry.activityDescription = activityDescription;
      if (startDate !== undefined) {
        entry.startDate = startDate;
        entry.reportingYear = new Date(startDate).getFullYear();
      }
      if (endDate !== undefined) entry.endDate = endDate;
      
      if (entry.startDate && entry.endDate && new Date(entry.endDate) < new Date(entry.startDate)) {
         return res.status(400).json({ error: 'End date cannot be earlier than start date' });
      }
    }

    const updatedEntry = await entry.save();
    
    await logAction(req, 'UPDATE', 'AccomplishmentEntry', updatedEntry._id, previousState, updatedEntry);
    
    res.json(updatedEntry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   DELETE /api/accomplishments/:id
// @desc    Delete an accomplishment entry
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    let entry = await AccomplishmentEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    
    // Auth check
    if (req.user.role.startsWith('Regional') && entry.regionId.toString() !== req.user.regionId?.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const previousState = entry.toObject();

    await entry.deleteOne();
    
    await logAction(req, 'DELETE', 'AccomplishmentEntry', entry._id, previousState, null);
    
    res.json({ message: 'Entry removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
