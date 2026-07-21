import React, { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import { getMondaysForMonth, MONTHS } from '../../lib/dateUtils';
import { useMatrixData } from './hooks/useMatrixData';
import { exportMatrixToExcel } from './utils/exportMatrix';
import MatrixHeader from './components/MatrixHeader';
import MatrixTable from './components/MatrixTable';

export default function AccomplishmentMatrix({ onSwitchView }) {
  const { user } = useAuthStore();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(1);

  const {
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
  } = useMatrixData(user, selectedYear, selectedQuarter);

  // Generate matrix calendar structure
  const quarters = useMemo(() => {
    const qStructure = [
      { q: 1, name: 'Q1', months: [] },
      { q: 2, name: 'Q2', months: [] },
      { q: 3, name: 'Q3', months: [] },
      { q: 4, name: 'Q4', months: [] },
    ];
    
    for (let m = 0; m < 12; m++) {
      const qIdx = Math.floor(m / 3);
      const mondays = getMondaysForMonth(selectedYear, m);
      qStructure[qIdx].months.push({
        name: MONTHS[m].toUpperCase().substring(0, 3),
        monthIndex: m,
        weeks: mondays.map(mon => ({
          weekNumber: mon.weekNumber,
          date: mon.day,
          fullDate: mon.date
        }))
      });
    }
    return qStructure;
  }, [selectedYear]);

  const flatWeeks = quarters.flatMap(q => q.months).flatMap(m => m.weeks.map(w => ({ ...w, monthIndex: m.monthIndex })));
  const totalWeeks = flatWeeks.length;

  const catColors = {
    1: { bg: 'bg-[#155a8e]', text: 'text-[#155a8e]' },
    2: { bg: 'bg-[#508d98]', text: 'text-[#508d98]' },
    3: { bg: 'bg-[#b16223]', text: 'text-[#b16223]' },
    4: { bg: 'bg-[#3c7816]', text: 'text-[#3c7816]' },
    5: { bg: 'bg-[#e712f2]', text: 'text-[#e712f2]' },
    6: { bg: 'bg-[#291753]', text: 'text-[#291753]' },
    7: { bg: 'bg-[#155a8e]', text: 'text-[#155a8e]' }
  };

  const handleExport = () => {
    exportMatrixToExcel({
      quarters,
      flatWeeks,
      totalWeeks,
      categories,
      activities,
      indicators,
      accomplishments,
      selectedYear
    });
  };

  if (!activeRegionId) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-800">No Region Assigned</h2>
        <p className="text-slate-500">Your account is not linked to a specific region for encoding.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-sm flex items-center justify-center min-h-[400px] text-slate-500 animate-pulse">
        Loading Encoding Form...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl flex flex-col h-[calc(100vh-6rem)] overflow-hidden border border-slate-300 relative">
      <MatrixHeader 
        currentYear={currentYear}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedQuarter={selectedQuarter}
        setSelectedQuarter={setSelectedQuarter}
        onSwitchView={onSwitchView}
        handleSave={handleSave}
        isSaving={isSaving}
        message={message}
        exportMatrixToExcel={handleExport}
      />
      
      <MatrixTable 
        quarters={quarters}
        flatWeeks={flatWeeks}
        totalWeeks={totalWeeks}
        categories={categories}
        indicators={indicators}
        activities={activities}
        accomplishments={accomplishments}
        handleInputChange={handleInputChange}
        catColors={catColors}
      />
    </div>
  );
}
