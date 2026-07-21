const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Report = require('../models/Report');
const AccomplishmentEntry = require('../models/AccomplishmentEntry');

// @route   GET /api/reports
// @desc    Get reports
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { regionId, reportingYear, quarter, status, reportType } = req.query;
    
    const query = {};
    if (regionId) query.regionId = regionId;
    else if (req.user.role.startsWith('Regional')) {
      query.regionId = req.user.regionId;
    }

    if (reportingYear) query.reportingYear = reportingYear;
    if (quarter) query.quarter = quarter;
    if (status) query.status = status;
    if (reportType) query.reportType = reportType;

    const reports = await Report.find(query)
      .populate('regionId', 'regionName regionCode')
      .populate('submittedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   POST /api/reports
// @desc    Create or update a report submission
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { regionId, reportingYear, quarter, month, reportType } = req.body;
    
    // Authorization check
    if (req.user.role.startsWith('Regional') && req.user.regionId.toString() !== regionId) {
      return res.status(403).json({ error: 'Not authorized for this region' });
    }

    const filter = {
      regionId,
      reportingYear,
      reportType
    };
    if (quarter) filter.quarter = quarter;
    if (month) filter.month = month;

    const update = {
      $setOnInsert: {
        submittedBy: req.user._id,
        submittedAt: Date.now()
      },
      $set: {
        status: req.body.status || 'Submitted to IAS'
      }
    };

    const options = { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true };
    const savedReport = await Report.findOneAndUpdate(filter, update, options);
    
    res.status(201).json(savedReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @route   PATCH /api/reports/:id/status
// @desc    Update report status (workflow)
// @access  Private
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Auth checks based on new status and user role could be added here
    
    report.status = status;
    if (remarks) {
       if (req.user.role.startsWith('IAS')) report.iasRemarks = remarks;
       else report.regionalRemarks = remarks;
    }

    // Track workflow timestamps
    if (status === 'Certified by Regional Director') {
      report.certifiedBy = req.user._id;
      report.certifiedAt = Date.now();
    } else if (status === 'Submitted to IAS') {
      report.submittedAt = Date.now();
    } else if (status === 'Under IAS Review') {
      report.reviewedBy = req.user._id;
      report.reviewedAt = Date.now();
    } else if (status === 'IAS Approved') {
      report.approvedBy = req.user._id;
      report.approvedAt = Date.now();
    } else if (status === 'Locked') {
      report.lockedAt = Date.now();
    }

    const updatedReport = await report.save();

    // Sync status to AccomplishmentEntry documents for this region/year/quarter
    if (report.quarter) {
      const q = report.quarter;
      const startMonth = (q - 1) * 3;
      const endMonth = startMonth + 2;
      
      const filter = {
        regionId: report.regionId,
        reportingYear: report.reportingYear,
        $or: [
          { reportType: 'weekly', monthIndex: { $gte: startMonth, $lte: endMonth } },
          { 
            reportType: 'activity', 
            $expr: {
              $and: [
                { $gte: [{ $month: "$startDate" }, startMonth + 1] },
                { $lte: [{ $month: "$startDate" }, endMonth + 1] }
              ]
            }
          }
        ]
      };
      
      await AccomplishmentEntry.updateMany(filter, { $set: { status: status === 'Submitted to IAS' ? 'Submitted' : status } });
    }

    res.json(updatedReport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
