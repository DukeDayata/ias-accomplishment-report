import { useState, useEffect, useCallback } from 'react';
import api from '../../../lib/axios';
import { getMondaysForMonth } from '../../../lib/dateUtils';

export function useMatrixData(user, selectedYear, selectedQuarter) {
  const [categories, setCategories] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [accomplishments, setAccomplishments] = useState({});
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const activeRegionId = user?.regionId?._id || user?.regionId || user?.region?._id || user?.region;

  const fetchData = useCallback(async () => {
    if (!user || !activeRegionId) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [catsRes, indsRes, accRes] = await Promise.all([
        api.get('/categories'),
        api.get('/indicators'),
        api.get(`/accomplishments?regionId=${activeRegionId}&reportingYear=${selectedYear}`)
      ]);
      
      const catsData = catsRes.data.sort((a, b) => a.displayOrder - b.displayOrder);
      setCategories(catsData);
      setIndicators(indsRes.data);

      const accMap = {};
      const acts = [];
      accRes.data.forEach(acc => {
        if (acc.reportType === 'activity') {
          acts.push(acc);
        } else {
          if (!accMap[acc.indicatorId._id]) {
            accMap[acc.indicatorId._id] = {};
          }
          accMap[acc.indicatorId._id][`${acc.monthIndex}-${acc.weekNumber}`] = acc.actual;
        }
      });
      setAccomplishments(accMap);
      setActivities(acts);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage('Failed to load form data.');
    } finally {
      setIsLoading(false);
    }
  }, [user, activeRegionId, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (indicatorId, monthIndex, weekNumber, value) => {
    setAccomplishments(prev => ({
      ...prev,
      [indicatorId]: {
        ...(prev[indicatorId] || {}),
        [`${monthIndex}-${weekNumber}`]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setMessage('');
      
      const payload = [];
      
      Object.keys(accomplishments).forEach(indicatorId => {
        const ind = indicators.find(i => String(i._id) === String(indicatorId));
        if (!ind) return;
        const categoryId = typeof ind.categoryId === 'object' ? ind.categoryId._id : ind.categoryId;

        Object.keys(accomplishments[indicatorId]).forEach(key => {
          const val = accomplishments[indicatorId][key];
          if (val !== undefined && val !== null && val !== '') {
            const [monthIndex, weekNumber] = key.split('-');
            const mIdx = parseInt(monthIndex);
            
            // Find weekStartDate
            const mondays = getMondaysForMonth(selectedYear, mIdx);
            const monday = mondays.find(m => m.weekNumber === parseInt(weekNumber));

            const entry = {
              regionId: activeRegionId,
              categoryId,
              indicatorId,
              reportType: 'weekly',
              reportingYear: selectedYear,
              monthIndex: mIdx,
              weekNumber: parseInt(weekNumber),
              weekStartDate: monday ? monday.date : null,
              actual: parseInt(val, 10) || 0,
              status: 'Submitted to IAS'
            };

            payload.push(entry);
          }
        });
      });

      for (const entry of payload) {
        await api.post('/accomplishments', entry);
      }
      
      // Create/update the formal Report document for all submitted quarters
      const submittedQuarters = new Set();
      payload.forEach(entry => {
        const q = Math.floor(entry.monthIndex / 3) + 1;
        submittedQuarters.add(q);
      });
      
      // Also add quarter for category 7 if any exist in the payload
      activities.forEach(act => {
        if (act.startDate) {
          const q = Math.floor(new Date(act.startDate).getMonth() / 3) + 1;
          submittedQuarters.add(q);
        }
      });
      
      // If matrix was completely empty, at least submit the selected dropdown quarter
      if (submittedQuarters.size === 0) {
        submittedQuarters.add(selectedQuarter);
      }

      for (const quarter of submittedQuarters) {
        try {
          const reportPayload = {
            regionId: activeRegionId,
            reportingYear: selectedYear,
            quarter: quarter,
            reportType: 'Quarterly',
            status: 'Submitted to IAS',
            submittedBy: user._id
          };
          await api.post('/reports', reportPayload);
        } catch (reportError) {
          console.error(`Failed to submit quarterly report record for Q${quarter}`, reportError);
        }
      }
      
      setMessage('Successfully saved and submitted to IAS.');
      setTimeout(() => setMessage(''), 4000);
      fetchData(); // refresh to get DB IDs and exact state
    } catch (error) {
      console.error(error);
      setMessage('Failed to save accomplishments.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    categories,
    indicators,
    accomplishments,
    activities,
    isLoading,
    isSaving,
    message,
    handleInputChange,
    handleSave,
    activeRegionId
  };
}
