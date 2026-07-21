import React, { useState, useEffect } from 'react';
import { Search, Printer, Download, Eye, CheckCircle, XCircle, X } from 'lucide-react';
import api from '../../lib/axios';
import useAuthStore from '../../store/useAuthStore';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

export default function ReportReviewList({ onSwitchView }) {
  const { user } = useAuthStore();
  const [accomplishments, setAccomplishments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedQuarter, setSelectedQuarter] = useState('All Quarters');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const url = `/accomplishments?reportingYear=${currentYear}`;
        
      const [accRes, catsRes, regionsRes] = await Promise.all([
        api.get(url),
        api.get('/categories'),
        api.get('/regions')
      ]);
      
      setAccomplishments(accRes.data);
      setCategories(catsRes.data);
      setRegions(regionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = (monthIdx) => {
    if (monthIdx === undefined || monthIdx === null) return '-';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[monthIdx] || '-';
  };

  // Filter logic
  const filteredData = accomplishments.filter(acc => {
    const sQuery = (searchQuery || '').toLowerCase();
    const indName = acc.reportType === 'activity' ? (acc.activityTitle || '').toLowerCase() : (acc.indicatorId?.indicatorName || '').toLowerCase();
    const remarks = (acc.remarks || '').toLowerCase();
    const matchesSearch = indName.includes(sQuery) || remarks.includes(sQuery);

    let mIdx = acc.monthIndex;
    if (acc.reportType === 'activity' && acc.startDate) {
      mIdx = new Date(acc.startDate).getMonth();
    }
    
    const q = mIdx !== undefined && mIdx !== null ? Math.floor(mIdx / 3) + 1 : null;

    const matchesQuarter = selectedQuarter === 'All Quarters' || `Q${q}` === selectedQuarter;
    const matchesMonth = selectedMonth === 'All Months' || getMonthName(mIdx) === selectedMonth;
    
    const catId = typeof acc.indicatorId?.categoryId === 'object' ? acc.indicatorId?.categoryId?._id : acc.indicatorId?.categoryId;
    const matchesCat = selectedCategory === 'All Categories' || String(catId) === String(selectedCategory);
    
    const regId = typeof acc.regionId === 'object' ? acc.regionId?._id : acc.regionId;
    const matchesRegion = selectedRegion === 'All Regions' || String(regId) === String(selectedRegion);

    return matchesSearch && matchesQuarter && matchesMonth && matchesCat && matchesRegion;
  });



  const handleViewClick = (acc) => {
    setViewTarget(acc);
    setIsViewModalOpen(true);
  };
  const handleExportXLS = () => {
    const exportData = filteredData.map(acc => {
      let accMonth = acc.monthIndex;
      if (acc.reportType === 'activity' && acc.startDate) {
        accMonth = new Date(acc.startDate).getMonth();
      }
      
      const categoryName = categories.find(c => String(c._id) === String(acc.categoryId))?.categoryName || 
                           (typeof acc.indicatorId?.categoryId === 'object' ? acc.indicatorId?.categoryId?.categoryName : '-');
      
      const regionName = regions.find(r => r._id === acc.regionId)?.regionName || '-';

      return {
        'Region': regionName,
        'Category': categoryName,
        'Indicator / Activity Title': acc.reportType === 'activity' ? acc.activityTitle : acc.indicatorId?.indicatorName,
        'Description': acc.reportType === 'activity' ? acc.activityDescription : '',
        'Year': acc.reportingYear || (acc.startDate ? new Date(acc.startDate).getFullYear() : ''),
        'Quarter': `Q${acc.quarter || 1}`,
        'Month': getMonthName(accMonth),
        'Week': acc.reportType === 'activity' ? '-' : acc.weekNumber,
        'Start Date': acc.startDate ? format(new Date(acc.startDate), 'MMM d, yyyy') : '',
        'End Date': acc.endDate ? format(new Date(acc.endDate), 'MMM d, yyyy') : '',
        'Actual Accomplishment': acc.actual,
        'Status': acc.status,
        'Remarks': acc.remarks || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ReportReview");
    
    const filename = `ReportReview_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      
      {/* View Toggle (Top Right) */}
      <div className="flex justify-end">
        <div className="inline-flex bg-slate-100 p-1 rounded-lg">
          <button 
            className="px-4 py-1.5 text-sm font-semibold rounded-md bg-white shadow-sm text-gov-blue"
          >
            List View
          </button>
          <button 
            onClick={() => onSwitchView('matrix')}
            className="px-4 py-1.5 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-700 transition-colors"
          >
            Matrix View
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-6 rounded-2xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Search className="text-gov-blue" size={20} />
            Filter Region Reports
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search</label>
            <input 
              type="text" 
              placeholder="Keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Region</label>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-white"
            >
              <option value="All Regions">All Regions</option>
              {regions.map(reg => (
                <option key={reg._id} value={reg._id}>{reg.regionName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quarter</label>
            <select 
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-white"
            >
              <option>All Quarters</option>
              <option>Q1</option>
              <option>Q2</option>
              <option>Q3</option>
              <option>Q4</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-white"
            >
              <option>All Months</option>
              {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-white"
            >
              <option>All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.categoryName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-2xl flex-1 flex flex-col min-h-[400px]">
        <div className="p-5 border-b border-slate-200/60 flex justify-between items-center bg-white/50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Submitted Regional Reports</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Showing {filteredData.length} records</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
              <Printer size={16} /> Print Report
            </button>
            <button onClick={handleExportXLS} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gov-blue rounded-lg hover:bg-gov-blue-dark transition-colors">
              <Download size={16} /> Export XLS
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Region</th>
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Indicator</th>
                <th className="px-6 py-4 text-center">Week</th>
                <th className="px-6 py-4 text-right">Actual</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue mx-auto mb-3"></div>
                    Loading records...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 italic">
                    No accomplishments found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredData.map(acc => {
                  const regionObj = regions.find(r => r._id === acc.regionId);
                  const regionName = regionObj ? regionObj.regionName : 'Unknown Region';
                  
                  return (
                    <tr key={acc._id} className="hover:bg-gov-blue-light/20 transition-colors hover:-translate-y-0.5 duration-300">
                      <td className="px-6 py-4 text-sm font-bold text-slate-800">
                        {regionName}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {getMonthName(acc.reportType === 'activity' && acc.startDate ? new Date(acc.startDate).getMonth() : acc.monthIndex)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gov-blue max-w-md">
                        <p className="font-medium line-clamp-2">
                          {acc.reportType === 'activity' ? acc.activityTitle : acc.indicatorId?.indicatorName}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-600 font-medium">
                        {acc.reportType === 'activity' ? 'Activity' : `W${acc.weekNumber}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-bold text-gov-blue-dark">
                        {acc.actual}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm bg-green-100 text-green-800">
                          {acc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 text-slate-400">
                          <button onClick={() => handleViewClick(acc)} className="hover:text-blue-600 transition-colors" title="View Details"><Eye size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Accomplishment Modal */}
      {isViewModalOpen && viewTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">Report Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-sm text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Region</label>
                <div className="font-medium text-slate-900">
                  {regions.find(r => r._id === viewTarget.regionId)?.regionName || 'Unknown Region'}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {viewTarget.reportType === 'activity' ? 'Activity Title' : 'Indicator Name'}
                </label>
                <div className="font-medium text-gov-blue">
                  {viewTarget.reportType === 'activity' ? viewTarget.activityTitle : viewTarget.indicatorId?.indicatorName}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Month</label>
                  <div className="font-medium">
                    {getMonthName(viewTarget.reportType === 'activity' && viewTarget.startDate ? new Date(viewTarget.startDate).getMonth() : viewTarget.monthIndex)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {viewTarget.reportType === 'activity' ? 'Dates' : 'Week Number'}
                  </label>
                  <div className="font-medium">
                    {viewTarget.reportType === 'activity' 
                      ? `${new Date(viewTarget.startDate).toLocaleDateString()} - ${new Date(viewTarget.endDate).toLocaleDateString()}` 
                      : `Week ${viewTarget.weekNumber}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Actual Accomplishment</label>
                  <div className="font-bold text-lg text-slate-900">{viewTarget.actual}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                  <div className="mt-1">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm bg-slate-100 text-slate-600">
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
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
