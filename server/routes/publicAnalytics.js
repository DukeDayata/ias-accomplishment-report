const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const AccomplishmentEntry = require('../models/AccomplishmentEntry');
const Region = require('../models/Region');
const Category = require('../models/Category');
const Indicator = require('../models/Indicator');
const Target = require('../models/Target');
const Report = require('../models/Report');

// Helper to set caching headers for public responses
const setCacheHeaders = (res, maxAge = 60) => {
  res.set('Cache-Control', `public, max-age=${maxAge}`);
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// @route   GET /api/public/analytics/summary
// @desc    Get high-level aggregated KPI statistics
// @access  Public
router.get('/summary', async (req, res) => {
  try {
    setCacheHeaders(res);
    const reportingYear = parseInt(req.query.reportingYear) || new Date().getFullYear();
    const { regionId } = req.query;

    const query = { reportingYear };
    if (regionId && mongoose.Types.ObjectId.isValid(regionId)) {
      query.regionId = new mongoose.Types.ObjectId(regionId);
    }

    // 1. Total Accomplishments Current Year
    const accResult = await AccomplishmentEntry.aggregate([
      { $match: query },
      { $group: { _id: null, totalActual: { $sum: '$actual' }, activityCount: { $sum: { $cond: [{ $eq: ['$reportType', 'activity'] }, 1, 0] } } } }
    ]);

    const totalAccomplishments = accResult.length > 0 ? accResult[0].totalActual : 0;
    const totalActivities = accResult.length > 0 ? accResult[0].activityCount : 0;

    // 2. Previous Year Accomplishments for YoY comparison
    const prevQuery = { reportingYear: reportingYear - 1 };
    if (query.regionId) prevQuery.regionId = query.regionId;

    const prevAccResult = await AccomplishmentEntry.aggregate([
      { $match: prevQuery },
      { $group: { _id: null, totalActual: { $sum: '$actual' } } }
    ]);
    const previousYearTotal = prevAccResult.length > 0 ? prevAccResult[0].totalActual : 0;

    let yoyGrowthPercentage = 0;
    if (previousYearTotal > 0) {
      yoyGrowthPercentage = parseFloat((((totalAccomplishments - previousYearTotal) / previousYearTotal) * 100).toFixed(2));
    }

    // 3. Targets calculation
    const targetQuery = { reportingYear };
    if (query.regionId) targetQuery.regionId = query.regionId;
    const targets = await Target.find(targetQuery);
    let totalTarget = targets.reduce((sum, t) => sum + (t.annualTarget || 0), 0);

    // Fallback if target collection is unpopulated: sum indicator default annual targets across regions
    if (totalTarget === 0) {
      const activeIndicators = await Indicator.find({ active: true });
      const regionCount = query.regionId ? 1 : (await Region.countDocuments({ active: true }));
      const indTargetSum = activeIndicators.reduce((sum, ind) => sum + (ind.annualTarget || 0), 0);
      totalTarget = indTargetSum * regionCount;
    }

    const accomplishmentRate = totalTarget > 0 
      ? parseFloat(((totalAccomplishments / totalTarget) * 100).toFixed(2)) 
      : 0;

    // 4. Counts
    const totalRegions = await Region.countDocuments({ active: true });
    const participatingRegionsResult = await AccomplishmentEntry.distinct('regionId', query);
    const participatingRegionsCount = participatingRegionsResult.length;
    const totalIndicators = await Indicator.countDocuments({ active: true });

    let regionInfo = null;
    if (query.regionId) {
      const regObj = await Region.findById(query.regionId).select('regionCode regionName shortName');
      if (regObj) regionInfo = regObj;
    }

    res.json({
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        reportingYear,
        regionFilter: regionInfo ? regionInfo.shortName : 'All Regions'
      },
      data: {
        reportingYear,
        region: regionInfo,
        totalAccomplishments,
        totalTarget,
        accomplishmentRate,
        totalActivities,
        totalRegions,
        participatingRegionsCount,
        totalIndicators,
        previousYearTotal,
        yoyGrowthPercentage
      }
    });
  } catch (error) {
    console.error('Public Analytics Summary Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to generate analytics summary' });
  }
});

// @route   GET /api/public/analytics/regions
// @desc    Get accomplishments and target fulfillment by CHED Region
// @access  Public
router.get('/regions', async (req, res) => {
  try {
    setCacheHeaders(res);
    const reportingYear = parseInt(req.query.reportingYear) || new Date().getFullYear();
    const { categoryId } = req.query;

    const allRegions = await Region.find({ active: true }).sort({ regionCode: 1 });

    const matchQuery = { reportingYear };
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      matchQuery.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    const aggregatedByRegion = await AccomplishmentEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$regionId',
          totalActual: { $sum: '$actual' },
          entryCount: { $sum: 1 }
        }
      }
    ]);

    const regAggMap = {};
    aggregatedByRegion.forEach(item => {
      regAggMap[String(item._id)] = item;
    });

    // Targets map
    const targetMatch = { reportingYear };
    const allTargets = await Target.find(targetMatch);
    const regTargetMap = {};
    allTargets.forEach(t => {
      const rId = String(t.regionId);
      regTargetMap[rId] = (regTargetMap[rId] || 0) + (t.annualTarget || 0);
    });

    const regionsData = allRegions.map(reg => {
      const rId = String(reg._id);
      const agg = regAggMap[rId] || { totalActual: 0, entryCount: 0 };
      const targetVal = regTargetMap[rId] || 0;
      const rate = targetVal > 0 ? parseFloat(((agg.totalActual / targetVal) * 100).toFixed(2)) : 0;

      return {
        _id: reg._id,
        regionCode: reg.regionCode,
        regionName: reg.regionName,
        shortName: reg.shortName,
        totalAccomplishments: agg.totalActual,
        totalTarget: targetVal,
        accomplishmentRate: rate,
        entriesCount: agg.entryCount
      };
    });

    // Sort by accomplishments descending and assign ranks
    regionsData.sort((a, b) => b.totalAccomplishments - a.totalAccomplishments);
    regionsData.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    res.json({
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        reportingYear,
        totalRegions: regionsData.length
      },
      data: regionsData
    });
  } catch (error) {
    console.error('Public Analytics Regions Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch regional analytics' });
  }
});

// @route   GET /api/public/analytics/categories
// @desc    Get accomplishments aggregated across the 7 official IAS categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    setCacheHeaders(res);
    const reportingYear = parseInt(req.query.reportingYear) || new Date().getFullYear();
    const { regionId } = req.query;

    const allCategories = await Category.find({ active: true }).sort({ displayOrder: 1 });
    const allIndicators = await Indicator.find({ active: true }).sort({ displayOrder: 1 });

    const matchQuery = { reportingYear };
    if (regionId && mongoose.Types.ObjectId.isValid(regionId)) {
      matchQuery.regionId = new mongoose.Types.ObjectId(regionId);
    }

    const aggregated = await AccomplishmentEntry.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { categoryId: '$categoryId', indicatorId: '$indicatorId' },
          totalActual: { $sum: '$actual' },
          entriesCount: { $sum: 1 }
        }
      }
    ]);

    const catMap = {};
    const indMap = {};

    aggregated.forEach(item => {
      const cId = item._id.categoryId ? String(item._id.categoryId) : null;
      const iId = item._id.indicatorId ? String(item._id.indicatorId) : null;

      if (cId) {
        catMap[cId] = (catMap[cId] || 0) + item.totalActual;
      }
      if (iId) {
        indMap[iId] = (indMap[iId] || 0) + item.totalActual;
      }
    });

    const categoriesData = allCategories.map(cat => {
      const cId = String(cat._id);
      const catInds = allIndicators
        .filter(ind => String(ind.categoryId) === cId)
        .map(ind => {
          const iId = String(ind._id);
          return {
            _id: ind._id,
            indicatorCode: ind.indicatorCode,
            indicatorName: ind.indicatorName,
            unitOfMeasure: ind.unitOfMeasure,
            totalAccomplishments: indMap[iId] || 0,
            annualTarget: ind.annualTarget || 0
          };
        });

      return {
        _id: cat._id,
        categoryCode: cat.categoryCode,
        categoryName: cat.categoryName,
        description: cat.description,
        displayOrder: cat.displayOrder,
        totalAccomplishments: catMap[cId] || 0,
        indicatorsCount: catInds.length,
        indicators: catInds
      };
    });

    res.json({
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        reportingYear,
        totalCategories: categoriesData.length
      },
      data: categoriesData
    });
  } catch (error) {
    console.error('Public Analytics Categories Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch category analytics' });
  }
});

// @route   GET /api/public/analytics/trends
// @desc    Get monthly and quarterly accomplishment time-series trends
// @access  Public
router.get('/trends', async (req, res) => {
  try {
    setCacheHeaders(res);
    const reportingYear = parseInt(req.query.reportingYear) || new Date().getFullYear();
    const { regionId, categoryId } = req.query;

    const matchQuery = { reportingYear };
    if (regionId && mongoose.Types.ObjectId.isValid(regionId)) {
      matchQuery.regionId = new mongoose.Types.ObjectId(regionId);
    }
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      matchQuery.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    const entries = await AccomplishmentEntry.find(matchQuery).select('reportType monthIndex startDate actual quarter');

    const monthlyMap = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: MONTH_NAMES[i],
      totalAccomplishments: 0,
      activityCount: 0,
      weeklyCount: 0
    }));

    const quarterlyMap = Array.from({ length: 4 }, (_, i) => ({
      quarter: i + 1,
      quarterName: `Q${i + 1}`,
      totalAccomplishments: 0
    }));

    entries.forEach(item => {
      let mIdx = null;
      if (item.reportType === 'activity' && item.startDate) {
        mIdx = new Date(item.startDate).getMonth();
      } else if (item.monthIndex !== undefined && item.monthIndex !== null) {
        mIdx = item.monthIndex;
      }

      if (mIdx !== null && mIdx >= 0 && mIdx < 12) {
        monthlyMap[mIdx].totalAccomplishments += item.actual || 0;
        if (item.reportType === 'activity') monthlyMap[mIdx].activityCount += 1;
        else monthlyMap[mIdx].weeklyCount += 1;

        const qIdx = Math.floor(mIdx / 3);
        if (qIdx >= 0 && qIdx < 4) {
          quarterlyMap[qIdx].totalAccomplishments += item.actual || 0;
        }
      } else if (item.quarter && item.quarter >= 1 && item.quarter <= 4) {
        quarterlyMap[item.quarter - 1].totalAccomplishments += item.actual || 0;
      }
    });

    res.json({
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        reportingYear
      },
      data: {
        monthly: monthlyMap,
        quarterly: quarterlyMap
      }
    });
  } catch (error) {
    console.error('Public Analytics Trends Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch trend analytics' });
  }
});

// @route   GET /api/public/analytics/indicators
// @desc    Get accomplishment totals and targets per indicator
// @access  Public
router.get('/indicators', async (req, res) => {
  try {
    setCacheHeaders(res);
    const reportingYear = parseInt(req.query.reportingYear) || new Date().getFullYear();
    const { regionId, categoryId } = req.query;

    const matchQuery = { reportingYear };
    if (regionId && mongoose.Types.ObjectId.isValid(regionId)) {
      matchQuery.regionId = new mongoose.Types.ObjectId(regionId);
    }
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      matchQuery.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    const indAgg = await AccomplishmentEntry.aggregate([
      { $match: { ...matchQuery, indicatorId: { $ne: null } } },
      {
        $group: {
          _id: '$indicatorId',
          totalActual: { $sum: '$actual' },
          entriesCount: { $sum: 1 }
        }
      }
    ]);

    const indAggMap = {};
    indAgg.forEach(item => {
      indAggMap[String(item._id)] = item;
    });

    const indFilter = { active: true };
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      indFilter.categoryId = categoryId;
    }

    const indicators = await Indicator.find(indFilter).populate('categoryId', 'categoryCode categoryName').sort({ displayOrder: 1 });

    const resultData = indicators.map(ind => {
      const iId = String(ind._id);
      const agg = indAggMap[iId] || { totalActual: 0, entriesCount: 0 };
      const targetVal = ind.annualTarget || 0;
      const rate = targetVal > 0 ? parseFloat(((agg.totalActual / targetVal) * 100).toFixed(2)) : 0;

      return {
        _id: ind._id,
        indicatorCode: ind.indicatorCode,
        indicatorName: ind.indicatorName,
        unitOfMeasure: ind.unitOfMeasure,
        category: ind.categoryId ? {
          _id: ind.categoryId._id,
          categoryCode: ind.categoryId.categoryCode,
          categoryName: ind.categoryId.categoryName
        } : null,
        totalAccomplishments: agg.totalActual,
        annualTarget: targetVal,
        accomplishmentRate: rate,
        entriesCount: agg.entriesCount
      };
    });

    resultData.sort((a, b) => b.totalAccomplishments - a.totalAccomplishments);

    res.json({
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        reportingYear,
        totalIndicators: resultData.length
      },
      data: resultData
    });
  } catch (error) {
    console.error('Public Analytics Indicators Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch indicator analytics' });
  }
});

// @route   GET /api/public/analytics/matrix
// @desc    Get 17-Region x 7-Category accomplishment matrix
// @access  Public
router.get('/matrix', async (req, res) => {
  try {
    setCacheHeaders(res);
    const reportingYear = parseInt(req.query.reportingYear) || new Date().getFullYear();

    const [regions, categories, entries] = await Promise.all([
      Region.find({ active: true }).sort({ regionCode: 1 }),
      Category.find({ active: true }).sort({ displayOrder: 1 }),
      AccomplishmentEntry.find({ reportingYear }).select('regionId categoryId actual indicatorId')
    ]);

    const catIdToCode = {};
    categories.forEach(c => {
      catIdToCode[String(c._id)] = c.categoryCode;
    });

    const matrixMap = {};
    regions.forEach(r => {
      const rId = String(r._id);
      matrixMap[rId] = {
        _id: r._id,
        regionCode: r.regionCode,
        regionName: r.regionName,
        shortName: r.shortName,
        categories: {},
        totalAccomplishments: 0
      };
      categories.forEach(c => {
        matrixMap[rId].categories[c.categoryCode] = 0;
      });
    });

    entries.forEach(e => {
      const rId = String(e.regionId);
      const cCode = catIdToCode[String(e.categoryId)];
      if (matrixMap[rId] && cCode) {
        matrixMap[rId].categories[cCode] += (e.actual || 0);
        matrixMap[rId].totalAccomplishments += (e.actual || 0);
      }
    });

    const matrixData = Object.values(matrixMap);

    res.json({
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        reportingYear,
        categories: categories.map(c => ({ categoryCode: c.categoryCode, categoryName: c.categoryName })),
        totalRegions: matrixData.length
      },
      data: matrixData
    });
  } catch (error) {
    console.error('Public Analytics Matrix Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to generate analytics matrix' });
  }
});

// @route   GET /api/public/analytics/activities
// @desc    Get paginated public list of activity accomplishments (CAT-7 and special events)
// @access  Public
router.get('/activities', async (req, res) => {
  try {
    setCacheHeaders(res);
    const reportingYear = parseInt(req.query.reportingYear) || new Date().getFullYear();
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const { regionId, categoryId, search } = req.query;

    const query = { reportingYear, reportType: 'activity' };
    if (regionId && mongoose.Types.ObjectId.isValid(regionId)) {
      query.regionId = new mongoose.Types.ObjectId(regionId);
    }
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (search) {
      query.$or = [
        { activityTitle: { $regex: search, $options: 'i' } },
        { activityDescription: { $regex: search, $options: 'i' } },
        { remarks: { $regex: search, $options: 'i' } }
      ];
    }

    const [totalItems, activities] = await Promise.all([
      AccomplishmentEntry.countDocuments(query),
      AccomplishmentEntry.find(query)
        .populate('regionId', 'regionCode regionName shortName')
        .populate('categoryId', 'categoryCode categoryName')
        .sort({ startDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    res.json({
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        reportingYear
      },
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
      },
      data: activities.map(act => ({
        _id: act._id,
        activityTitle: act.activityTitle,
        activityDescription: act.activityDescription,
        startDate: act.startDate,
        endDate: act.endDate,
        actual: act.actual,
        remarks: act.remarks,
        region: act.regionId ? {
          _id: act.regionId._id,
          regionCode: act.regionId.regionCode,
          shortName: act.regionId.shortName,
          regionName: act.regionId.regionName
        } : null,
        category: act.categoryId ? {
          _id: act.categoryId._id,
          categoryCode: act.categoryId.categoryCode,
          categoryName: act.categoryId.categoryName
        } : null
      }))
    });
  } catch (error) {
    console.error('Public Analytics Activities Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to fetch public activities' });
  }
});

// @route   GET /api/public/analytics/export
// @desc    Export full public analytics snapshot JSON payload
// @access  Public
router.get('/export', async (req, res) => {
  try {
    setCacheHeaders(res);
    const reportingYear = parseInt(req.query.reportingYear) || new Date().getFullYear();

    const [regions, categories, indicators, entries, targets] = await Promise.all([
      Region.find({ active: true }).select('regionCode regionName shortName').sort({ regionCode: 1 }),
      Category.find({ active: true }).select('categoryCode categoryName displayOrder').sort({ displayOrder: 1 }),
      Indicator.find({ active: true }).select('indicatorCode indicatorName unitOfMeasure annualTarget categoryId').sort({ displayOrder: 1 }),
      AccomplishmentEntry.find({ reportingYear }).select('regionId categoryId indicatorId reportType actual startDate monthIndex quarter'),
      Target.find({ reportingYear }).select('regionId indicatorId annualTarget')
    ]);

    const totalAccomplishments = entries.reduce((sum, e) => sum + (e.actual || 0), 0);
    const totalTargets = targets.reduce((sum, t) => sum + (t.annualTarget || 0), 0);

    res.json({
      status: 'success',
      meta: {
        timestamp: new Date().toISOString(),
        reportingYear,
        exportVersion: '1.0'
      },
      data: {
        summary: {
          reportingYear,
          totalAccomplishments,
          totalTargets,
          accomplishmentRate: totalTargets > 0 ? parseFloat(((totalAccomplishments / totalTargets) * 100).toFixed(2)) : 0,
          totalRegions: regions.length,
          totalCategories: categories.length,
          totalIndicators: indicators.length,
          totalEntries: entries.length
        },
        regions,
        categories,
        indicators
      }
    });
  } catch (error) {
    console.error('Public Analytics Export Error:', error);
    res.status(500).json({ status: 'error', error: 'Failed to export analytics snapshot' });
  }
});

module.exports = router;
