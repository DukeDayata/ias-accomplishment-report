import React from 'react';
import { FileSpreadsheet, Download, Loader2, Send, CheckCircle2 } from 'lucide-react';

export default function MatrixHeader({
  currentYear,
  selectedYear,
  setSelectedYear,
  selectedQuarter,
  setSelectedQuarter,
  onSwitchView,
  handleSave,
  isSaving,
  message,
  exportMatrixToExcel
}) {
  return (
    <>
      <div className="p-4 shrink-0 flex items-center justify-between border-b border-slate-300 shadow-sm z-30 relative bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-green-600" />
            IAS - Accomplishment Report Matrix
          </h2>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reporting Year:</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent border-none text-sm font-bold text-brand-primary outline-none cursor-pointer"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quarter:</label>
            <select 
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
              className="bg-transparent border-none text-sm font-bold text-brand-primary outline-none cursor-pointer"
            >
              <option value={1}>Q1</option>
              <option value={2}>Q2</option>
              <option value={3}>Q3</option>
              <option value={4}>Q4</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportMatrixToExcel} 
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <Download size={16} /> Export Matrix
          </button>
          <div className="inline-flex bg-slate-100 p-1 rounded-lg mr-4">
            <button 
              onClick={() => onSwitchView('list')}
              className="px-4 py-1 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-700 transition-colors"
            >
              List View
            </button>
            <button 
              className="px-4 py-1 text-sm font-semibold rounded-md bg-white shadow-sm text-brand-primary"
            >
              Matrix Entry
            </button>
          </div>

          <button 
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm min-w-[140px] justify-center"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Send size={16} /> 
                <span>Save & Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Success Banner */}
      {message && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-100 border border-green-300 text-green-800 px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={20} className="text-green-600" />
          <span className="font-semibold text-sm">{message}</span>
        </div>
      )}
    </>
  );
}
