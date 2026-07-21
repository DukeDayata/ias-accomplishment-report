import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import { getMondaysForMonth, MONTHS } from '../../../lib/dateUtils';
import { format } from 'date-fns';

export default function EditAccomplishmentModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  formData, 
  setFormData, 
  categories, 
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

  const modalTitle = isOtherActivities ? 'Edit Internationalization Activity' : 'Edit Weekly Accomplishment';

  // Validation
  let isSubmitDisabled = isSubmitting;
  if (!formData.actual && formData.actual !== 0) isSubmitDisabled = true;
  if (isOtherActivities) {
    if (!formData.activityTitle || !formData.activityDescription || !formData.startDate || !formData.endDate) {
      isSubmitDisabled = true;
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">{modalTitle}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-sm text-slate-600 mb-4">
            <strong>Note:</strong> You can only edit specific fields. To change the indicator, delete this entry and create a new one.
          </div>

          {!isOtherActivities && (
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
          )}

          {isOtherActivities && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              {isOtherActivities ? 'Number of Activities or Accomplishments' : 'Actual Accomplishment'} <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              min="0" required
              value={formData.actual}
              onChange={(e) => setFormData({...formData, actual: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>

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
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Accomplishment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
