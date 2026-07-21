import React, { useState, useEffect } from 'react';
import { Search, Plus, Printer, Download, Eye, Edit, Trash2, X } from 'lucide-react';
import api from '../../lib/axios';
import useAuthStore from '../../store/useAuthStore';
import { format } from 'date-fns';
import { getMondaysForMonth, MONTHS } from '../../lib/dateUtils';
import AddAccomplishmentModal from './components/AddAccomplishmentModal';
import EditAccomplishmentModal from './components/EditAccomplishmentModal';
import ViewAccomplishmentModal from './components/ViewAccomplishmentModal';
import * as XLSX from 'xlsx';

export default function AccomplishmentsList({ onSwitchView }) {
  const { user } = useAuthStore();
  const [accomplishments, setAccomplishments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultFormState = {
    categoryId: '',
    indicatorId: '',
    customIndicatorName: '',
    activityTitle: '',
    activityDescription: '',
    reportingYear: currentYear,
    selectedMonthIndex: 0,
    weekNumber: 1,
    weekStartDate: '',
    startDate: '',
    endDate: '',
    actual: '',
    remarks: ''
  };

  const [formData, setFormData] = useState(defaultFormState);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('All Quarters');
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const activeRegionId = user?.regionId?._id || user?.regionId || user?.region?._id || user?.region;
    if (!activeRegionId && !user?.role.includes('IAS')) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const url = activeRegionId 
        ? `/accomplishments?regionId=${activeRegionId}&reportingYear=${currentYear}`
        : `/accomplishments?reportingYear=${currentYear}`; // IAS view all
        
      const [accRes, catsRes, indsRes] = await Promise.all([
        api.get(url),
        api.get('/categories'),
        api.get('/indicators')
      ]);
      
      setAccomplishments(accRes.data);
      setCategories(catsRes.data);
      setIndicators(indsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthName = (monthIdx) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    if (monthIdx === null || monthIdx === undefined) return '-';
    return months[monthIdx] || '-';
  };

  // Filter logic
  const filteredData = accomplishments.filter(acc => {
    const sQuery = (searchQuery || '').toLowerCase();
    const displayName = acc.reportType === 'activity' ? acc.activityTitle : acc.indicatorId?.indicatorName;
    const indName = (displayName || '').toLowerCase();
    const remarks = (acc.remarks || '').toLowerCase();
    const matchesSearch = indName.includes(sQuery) || remarks.includes(sQuery);

    const matchesQuarter = selectedQuarter === 'All Quarters' || `Q${acc.quarter}` === selectedQuarter;
    
    let accMonth = acc.monthIndex;
    if (acc.reportType === 'activity' && acc.startDate) {
      accMonth = new Date(acc.startDate).getMonth();
    }
    const matchesMonth = selectedMonth === 'All Months' || getMonthName(accMonth) === selectedMonth;
    
    // Category match requires us to know the category of the indicator
    const catId = acc.categoryId || (typeof acc.indicatorId?.categoryId === 'object' ? acc.indicatorId?.categoryId?._id : acc.indicatorId?.categoryId);
    const matchesCat = selectedCategory === 'All Categories' || String(catId) === String(selectedCategory);

    return matchesSearch && matchesQuarter && matchesMonth && matchesCat;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const activeRegionId = user?.regionId?._id || user?.regionId || user?.region?._id || user?.region;
      
      const selectedCategory = categories.find(c => c._id === formData.categoryId);
      const isOtherActivities = selectedCategory?.categoryNumber === 7 || selectedCategory?.categoryName?.toUpperCase().includes('OTHER');
      
      if (isOtherActivities) {
        const payloads = [];
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const current = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

        while (current <= endMonth) {
          const key = `${current.getFullYear()}-${current.getMonth()}`;
          const val = formData.multiMonthActuals?.[key];
          
          if (val !== undefined && val !== '' && parseInt(val) > 0) {
            let sliceStart = new Date(current.getFullYear(), current.getMonth(), 1);
            let sliceEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            
            if (sliceStart < start) sliceStart = start;
            if (sliceEnd > end) sliceEnd = end;

            payloads.push({
              regionId: activeRegionId,
              categoryId: formData.categoryId,
              reportType: 'activity',
              activityTitle: formData.activityTitle,
              activityDescription: formData.activityDescription,
              startDate: format(sliceStart, 'yyyy-MM-dd'),
              endDate: format(sliceEnd, 'yyyy-MM-dd'),
              actual: Number(val),
              remarks: formData.remarks,
            });
          }
          current.setMonth(current.getMonth() + 1);
        }

        for (const p of payloads) {
          await api.post('/accomplishments', p);
        }
      } else {
        const payload = {
          regionId: activeRegionId,
          categoryId: formData.categoryId,
          reportType: 'weekly',
          actual: Number(formData.actual),
          remarks: formData.remarks,
          indicatorId: formData.indicatorId,
          customIndicatorName: formData.customIndicatorName,
          reportingYear: formData.reportingYear,
          monthIndex: formData.selectedMonthIndex,
          weekNumber: formData.weekNumber,
          weekStartDate: formData.weekStartDate,
        };
        await api.post('/accomplishments', payload);
      }
      
      setIsAddModalOpen(false);
      setFormData(defaultFormState);
      fetchData(); // refresh list
    } catch (error) {
      console.error('Failed to save accomplishment', error);
      alert('Failed to save accomplishment. ' + (error.response?.data?.error || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (acc) => {
    setEditTargetId(acc._id);
    
    setFormData({
      categoryId: acc.categoryId || acc.indicatorId?.categoryId || '',
      indicatorId: acc.indicatorId?._id || '',
      customIndicatorName: '',
      activityTitle: acc.activityTitle || '',
      activityDescription: acc.activityDescription || '',
      reportingYear: acc.reportingYear || currentYear,
      selectedMonthIndex: acc.monthIndex || 0,
      weekNumber: acc.weekNumber || 1,
      weekStartDate: acc.weekStartDate ? format(new Date(acc.weekStartDate), 'yyyy-MM-dd') : '',
      startDate: acc.startDate ? format(new Date(acc.startDate), 'yyyy-MM-dd') : '',
      endDate: acc.endDate ? format(new Date(acc.endDate), 'yyyy-MM-dd') : '',
      actual: acc.actual,
      remarks: acc.remarks || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      const selectedCategory = categories.find(c => c._id === formData.categoryId);
      const isOtherActivities = selectedCategory?.categoryNumber === 7 || selectedCategory?.categoryName?.toUpperCase().includes('OTHER');
      
      const payload = {
        actual: Number(formData.actual),
        remarks: formData.remarks
      };

      if (isOtherActivities) {
        payload.activityTitle = formData.activityTitle;
        payload.activityDescription = formData.activityDescription;
        payload.startDate = formData.startDate;
        payload.endDate = formData.endDate;
      } else {
        payload.weekNumber = Number(formData.weekNumber);
        payload.monthIndex = formData.selectedMonthIndex;
        payload.weekStartDate = formData.weekStartDate;
      }

      await api.put(`/accomplishments/${editTargetId}`, payload);
      setIsEditModalOpen(false);
      setEditTargetId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to update', error);
      alert('Failed to update accomplishment. ' + (error.response?.data?.error || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this accomplishment?')) return;
    try {
      await api.delete(`/accomplishments/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete', error);
      alert('Failed to delete accomplishment.');
    }
  };

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

      return {
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accomplishments");
    
    const filename = `Accomplishments_Export_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      
      {/* View Toggle (Top Right) */}
      <div className="flex justify-end">
        <div className="inline-flex bg-slate-100 p-1 rounded-lg">
          <button 
            className="px-4 py-1.5 text-sm font-semibold rounded-md bg-white shadow-sm text-brand-primary"
          >
            List View
          </button>
          <button 
            onClick={() => onSwitchView('matrix')}
            className="px-4 py-1.5 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-700 transition-colors"
          >
            Matrix Entry
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-6 rounded-2xl mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Search className="text-gov-blue" size={20} />
            Filter Accomplishments
          </h2>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gov-blue hover:bg-gov-blue-dark text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus size={16} /> Add Accomplishment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Indicator</label>
            <input 
              type="text" 
              placeholder="Type keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-primary outline-none"
            />
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
            <h3 className="text-lg font-bold text-slate-800">Accomplishments List</h3>
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
                <th className="px-6 py-4">Month</th>
                <th className="px-6 py-4">Indicator</th>
                <th className="px-6 py-4 text-center">Week</th>
                <th className="px-6 py-4 text-right">Actual</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Remarks</th>
                <th className="px-6 py-4 text-right">Actions</th>
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
                filteredData.map(acc => (
                  <tr key={acc._id} className="hover:bg-gov-blue-light/20 transition-colors hover:-translate-y-0.5 duration-300">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {acc.reportType === 'activity' ? format(new Date(acc.startDate), 'MMM yyyy') : getMonthName(acc.monthIndex)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gov-blue max-w-md">
                      <p className="font-medium line-clamp-2">
                        {acc.reportType === 'activity' ? acc.activityTitle : acc.indicatorId?.indicatorName}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-center text-slate-600 font-medium">
                      {acc.reportType === 'activity' ? 'Date Range' : `W${acc.weekNumber}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-gov-blue-dark">
                      {acc.actual}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full shadow-sm bg-green-100 text-green-800">
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate">
                      {acc.remarks || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-slate-400">
                        <button onClick={() => handleViewClick(acc)} className="hover:text-blue-600 transition-colors" title="View"><Eye size={18} /></button>
                        <button onClick={() => handleEditClick(acc)} className="hover:text-amber-500 transition-colors" title="Edit"><Edit size={18} /></button>
                        <button onClick={() => handleDelete(acc._id)} className="hover:text-red-500 transition-colors" title="Delete"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddAccomplishmentModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        indicators={indicators}
        isSubmitting={isSubmitting}
      />

      <EditAccomplishmentModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        isSubmitting={isSubmitting}
      />

      <ViewAccomplishmentModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        viewTarget={viewTarget}
        getMonthName={getMonthName}
      />
    </div>
  );
}
