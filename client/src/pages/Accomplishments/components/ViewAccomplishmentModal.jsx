import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

export default function ViewAccomplishmentModal({ isOpen, onClose, viewTarget, getMonthName }) {
  if (!isOpen || !viewTarget) return null;

  const isActivity = viewTarget.reportType === 'activity';

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">Accomplishment Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {isActivity ? 'Activity Title' : 'Indicator Name'}
            </label>
            <div className="font-medium text-[#002b80]">
              {isActivity ? viewTarget.activityTitle : viewTarget.indicatorId?.indicatorName}
            </div>
          </div>

          {isActivity && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
              <div className="font-medium text-slate-600">
                {viewTarget.activityDescription}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {isActivity ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                  <div className="font-medium">{format(new Date(viewTarget.startDate), 'MMM d, yyyy')}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                  <div className="font-medium">{format(new Date(viewTarget.endDate), 'MMM d, yyyy')}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Month</label>
                  <div className="font-medium">{getMonthName(viewTarget.monthIndex)}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reporting Week</label>
                  <div className="font-medium">Week {viewTarget.weekNumber}</div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Actual Accomplishment</label>
              <div className="font-bold text-lg text-slate-900">{viewTarget.actual}</div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
              <div>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  {viewTarget.status}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</label>
            <div className="bg-slate-50 p-3 rounded border border-slate-200 min-h-[60px] italic">
              {viewTarget.remarks || 'No remarks provided.'}
            </div>
          </div>
          
          <div className="pt-4 mt-2 flex justify-end border-t border-slate-200">
            <button 
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
