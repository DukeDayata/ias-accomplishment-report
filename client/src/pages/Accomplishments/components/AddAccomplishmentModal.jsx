import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { getMondaysForMonth, MONTHS } from '../../../lib/dateUtils';
import { format } from 'date-fns';

export default function AddAccomplishmentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  categories, 
  indicators, 
  isSubmitting 
}) {
  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const selectedCategory = categories.find(c => c._id === formData.categoryId);
  const isOtherActivities = selectedCategory?.categoryNumber === 7 || selectedCategory?.categoryName?.toUpperCase().includes('OTHER');

  const mondays = useMemo(() => {
    if (isOtherActivities) return [];
    return getMondaysForMonth(formData.reportingYear || currentYear, formData.selectedMonthIndex);
  }, [formData.reportingYear, formData.selectedMonthIndex, isOtherActivities, currentYear]);

  const coveredMonths = useMemo(() => {
    if (!isOtherActivities || !formData.startDate || !formData.endDate) return [];
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (end < start) return [];

    const months = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= endMonth) {
      months.push({
        year: current.getFullYear(),
        monthIndex: current.getMonth(),
        label: `${MONTHS[current.getMonth()]} ${current.getFullYear()}`
      });
      current.setMonth(current.getMonth() + 1);
    }
    return months;
  }, [isOtherActivities, formData.startDate, formData.endDate]);

  // Handle month change and auto-select first monday
  const handleMonthChange = (e) => {
    const newMonthIdx = parseInt(e.target.value);
    const newMondays = getMondaysForMonth(formData.reportingYear || currentYear, newMonthIdx);
    setFormData({
      ...formData, 
      selectedMonthIndex: newMonthIdx,
      weekNumber: newMondays[0]?.weekNumber || 1,
      weekStartDate: newMondays[0]?.date || ''
    });
  };

  const handleYearChange = (e) => {
    const year = parseInt(e.target.value);
    const newMondays = getMondaysForMonth(year, formData.selectedMonthIndex);
    setFormData({
      ...formData, 
      reportingYear: year,
      weekNumber: newMondays[0]?.weekNumber || 1,
      weekStartDate: newMondays[0]?.date || ''
    });
  };

  const handleWeekChange = (e) => {
    const weekNum = parseInt(e.target.value);
    const selectedMonday = mondays.find(m => m.weekNumber === weekNum);
    setFormData({
      ...formData,
      weekNumber: weekNum,
      weekStartDate: selectedMonday?.date || ''
    });
  };

  // Validation
  let isSubmitDisabled = isSubmitting;
  if (!formData.categoryId) isSubmitDisabled = true;

  if (isOtherActivities) {
    if (!formData.activityTitle || !formData.activityDescription || !formData.startDate || !formData.endDate) {
      isSubmitDisabled = true;
    }
    if (coveredMonths.length > 0) {
      const hasValue = Object.values(formData.multiMonthActuals || {}).some(v => v !== '' && parseInt(v) > 0);
      if (!hasValue) isSubmitDisabled = true;
    } else {
      isSubmitDisabled = true;
    }
  } else {
    if (!formData.actual && formData.actual !== 0) isSubmitDisabled = true;
    if (!formData.indicatorId && !formData.customIndicatorName) isSubmitDisabled = true;
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">Add New Accomplishment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Category <span className="text-red-500">*</span></label>
            <select 
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value, indicatorId: '', customIndicatorName: ''})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            >
              <option value="">Select a Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
              ))}
            </select>
          </div>

          {!isOtherActivities && formData.categoryId && (
            <>
              <div className="space-y-1.5 animate-in fade-in slide-in-from-right-2">
                <label className="text-xs font-bold text-slate-700">Indicator <span className="text-red-500">*</span></label>
                {selectedCategory?.categoryName?.toUpperCase().includes('OTHER') ? (
                  <input 
                    type="text"
                    required
                    placeholder="Type the custom activity or accomplishment..."
                    value={formData.customIndicatorName}
                    onChange={(e) => setFormData({...formData, customIndicatorName: e.target.value, indicatorId: ''})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                ) : (
                  <select 
                    required
                    disabled={!formData.categoryId}
                    value={formData.indicatorId}
                    onChange={(e) => setFormData({...formData, indicatorId: e.target.value, customIndicatorName: ''})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none disabled:bg-slate-100"
                  >
                    <option value="">Select an Indicator</option>
                    {indicators.filter(ind => ind.categoryId._id === formData.categoryId || ind.categoryId === formData.categoryId).map(ind => (
                      <option key={ind._id} value={ind._id}>{ind.indicatorName}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-sm text-slate-600 mb-4 animate-in fade-in">
                <strong>Note:</strong> The selected reporting week corresponds to the Monday date displayed in the annual report.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-right-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Reporting Year <span className="text-red-500">*</span></label>
                  <select 
                    required
                    value={formData.reportingYear}
                    onChange={handleYearChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  >
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Reporting Month <span className="text-red-500">*</span></label>
                  <select 
                    required
                    value={formData.selectedMonthIndex}
                    onChange={handleMonthChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Reporting Week <span className="text-red-500">*</span></label>
                  <select 
                    required
                    value={formData.weekNumber}
                    onChange={handleWeekChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  >
                    {mondays.map(m => (
                      <option key={m.weekNumber} value={m.weekNumber}>
                        Week {m.weekNumber} — {MONTHS[formData.selectedMonthIndex]} {m.day}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          {isOtherActivities && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
              <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 text-sm text-slate-600 mb-4">
                <strong>Note:</strong> Activity dates will determine where this accomplishment appears in the annual timeline.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Activity or Accomplishment Title <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.activityTitle}
                  onChange={(e) => setFormData({...formData, activityTitle: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Detailed Description <span className="text-red-500">*</span></label>
                <textarea 
                  rows="3"
                  required
                  value={formData.activityDescription}
                  onChange={(e) => setFormData({...formData, activityDescription: e.target.value})}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Start Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">End Date <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    required
                    min={formData.startDate}
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {isOtherActivities ? (
            <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-right-2">
              <label className="text-xs font-bold text-slate-700">Monthly Activities or Accomplishments <span className="text-red-500">*</span></label>
              {coveredMonths.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {coveredMonths.map(m => {
                    const key = `${m.year}-${m.monthIndex}`;
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                        <span className="text-sm font-semibold text-slate-700">{m.label}</span>
                        <input 
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formData.multiMonthActuals?.[key] || ''}
                          onChange={(e) => setFormData({
                            ...formData, 
                            multiMonthActuals: { ...formData.multiMonthActuals, [key]: e.target.value }
                          })}
                          className="w-24 border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none font-bold text-center"
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                  Please select a valid start and end date first.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700">
                Weekly Actual Accomplishment <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                min="0" required
                value={formData.actual}
                onChange={(e) => setFormData({...formData, actual: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Remarks (Optional)</label>
            <textarea 
              rows="3"
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none resize-none"
              placeholder="Add any additional context..."
            ></textarea>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitDisabled}
              className="bg-[#002b80] hover:bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Accomplishment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
