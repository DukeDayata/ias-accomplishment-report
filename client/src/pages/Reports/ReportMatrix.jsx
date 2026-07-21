import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../lib/axios';
import { getMondaysForMonth, MONTHS } from '../../lib/dateUtils';
import { format, addDays } from 'date-fns';

export default function ReportMatrix({ onSwitchView }) {
  const [categories, setCategories] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [accomplishments, setAccomplishments] = useState({});
  const [activities, setActivities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [isLoading, setIsLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
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

  const catColors = {
    1: { bg: 'bg-gov-blue', text: 'text-gov-blue' },
    2: { bg: 'bg-[#508d98]', text: 'text-[#508d98]' },
    3: { bg: 'bg-gov-gold-dark', text: 'text-gov-gold-dark' },
    4: { bg: 'bg-[#3c7816]', text: 'text-[#3c7816]' },
    5: { bg: 'bg-[#e712f2]', text: 'text-[#e712f2]' },
    6: { bg: 'bg-[#291753]', text: 'text-[#291753]' },
    7: { bg: 'bg-gov-blue-dark', text: 'text-gov-blue-dark' }
  };

  useEffect(() => {
    fetchData();
  }, [selectedRegion, selectedYear]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const url = selectedRegion !== 'All Regions' 
        ? `/accomplishments?regionId=${selectedRegion}&reportingYear=${selectedYear}`
        : `/accomplishments?reportingYear=${selectedYear}`;

      const [catsRes, indsRes, accRes, regionsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/indicators'),
        api.get(url),
        api.get('/regions')
      ]);
      
      setCategories(catsRes.data.sort((a, b) => a.displayOrder - b.displayOrder));
      setIndicators(indsRes.data);
      setRegions(regionsRes.data);

      const accMap = {};
      const acts = [];
      // For Admin Matrix, if 'All Regions', we sum up the accomplishments.
      accRes.data.forEach(acc => {
        if (acc.reportType === 'activity') {
          acts.push(acc);
        } else {
          if (!accMap[acc.indicatorId._id]) {
            accMap[acc.indicatorId._id] = {};
          }
          const key = `${acc.monthIndex}-${acc.weekNumber}`;
          if (!accMap[acc.indicatorId._id][key]) {
              accMap[acc.indicatorId._id][key] = 0;
          }
          accMap[acc.indicatorId._id][key] += acc.actual || 0;
        }
      });
      setAccomplishments(accMap);
      setActivities(acts);
      
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue"></div>
        Loading Matrix...
      </div>
    );
  }

  const flatWeeks = quarters.flatMap(q => q.months).flatMap(m => m.weeks.map(w => ({ ...w, monthIndex: m.monthIndex })));
  const totalWeeks = flatWeeks.length;

  const exportMatrixToExcel = () => {
    const aoa = [];
    const merges = [];
    
    // Header Row 1: Quarters
    const row1 = ["DETAILS", "", ""]; 
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } });
    let colIdx = 3;
    quarters.forEach(q => {
      row1.push(q.name);
      const qCols = q.months.reduce((acc, m) => acc + m.weeks.length, 0);
      for(let i = 1; i < qCols; i++) row1.push("");
      if (qCols > 1) {
        merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + qCols - 1 } });
      }
      colIdx += qCols;
    });
    aoa.push(row1);

    // Header Row 2: Months
    const row2 = ["DELIVERABLES", "", ""];
    merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 2 } });
    colIdx = 3;
    quarters.flatMap(q => q.months).forEach(m => {
      row2.push(m.name);
      const mCols = m.weeks.length;
      for(let i = 1; i < mCols; i++) row2.push("");
      if (mCols > 1) {
        merges.push({ s: { r: 1, c: colIdx }, e: { r: 1, c: colIdx + mCols - 1 } });
      }
      colIdx += mCols;
    });
    aoa.push(row2);

    // Header Row 3: Dates
    const row3 = ["", "", ""];
    merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 2 } });
    flatWeeks.forEach(w => {
      row3.push(w.date);
    });
    aoa.push(row3);

    let currentRow = 3;

    categories.forEach(cat => {
      // Category Header Row
      const catRow = [cat.categoryNumber || "", cat.categoryName, ""];
      merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 2 } });
      for (let i = 0; i < totalWeeks; i++) catRow.push("");
      aoa.push(catRow);
      currentRow++;

      const isOtherActivities = cat.categoryNumber === 7 || cat.categoryName?.toUpperCase().includes('OTHER');
      
      if (isOtherActivities) {
        const catActs = activities;
        if (catActs.length === 0) {
           const emptyRow = ["", "Activity timelines mapped automatically.", ""];
           merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 2 } });
           for (let i = 0; i < totalWeeks; i++) emptyRow.push("");
           aoa.push(emptyRow);
           currentRow++;
        } else {
           const groupedActs = [];
           for (let m = 0; m < 12; m++) {
             const mActs = catActs.filter(a => new Date(a.startDate).getMonth() === m);
             if (mActs.length > 0) groupedActs.push({ monthIndex: m, acts: mActs });
           }

           groupedActs.forEach(group => {
             const rowSpan = group.acts.length;
             group.acts.forEach((act, idx) => {
               const isFirstInMonth = idx === 0;
               let desc = act.activityTitle;
               if (act.activityDescription && act.activityDescription.trim().toLowerCase() !== act.activityTitle.trim().toLowerCase()) {
                 desc += `\n${act.activityDescription}`;
               }
               desc += `\n${format(new Date(act.startDate), 'MMM d, yyyy')} - ${format(new Date(act.endDate), 'MMM d, yyyy')}`;
               
               const actRow = ["", desc, ""];
               merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 2 } });
               
               let monthCellRendered = false;
               flatWeeks.forEach((w, wIdx) => {
                 if (w.monthIndex === group.monthIndex) {
                   if (!isFirstInMonth) {
                     actRow.push("");
                   } else {
                     if (!monthCellRendered) {
                       monthCellRendered = true;
                       actRow.push(rowSpan);
                       let targetMonthCols = 0;
                       flatWeeks.forEach(fw => { if (fw.monthIndex === group.monthIndex) targetMonthCols++; });
                       
                       const colStart = 3 + wIdx;
                       merges.push({ 
                         s: { r: currentRow, c: colStart }, 
                         e: { r: currentRow + rowSpan - 1, c: colStart + targetMonthCols - 1 } 
                       });
                     } else {
                       actRow.push("");
                     }
                   }
                 } else {
                   actRow.push("");
                 }
               });
               
               aoa.push(actRow);
               currentRow++;
             });
           });
        }
      } else {
        const catInds = indicators.filter(ind => ind.categoryId === cat._id).sort((a, b) => a.order - b.order);
        catInds.forEach(ind => {
           const indRow = ["", ind.indicatorName, ind.target ? ind.target : ""];
           flatWeeks.forEach(w => {
             const val = accomplishments[ind._id]?.[`${w.monthIndex}-${w.weekNumber}`]?.actual || "";
             indRow.push(val);
           });
           aoa.push(indRow);
           currentRow++;
        });
      }
    });

    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!merges'] = merges;
    
    const colWidths = [{ wch: 5 }, { wch: 40 }, { wch: 10 }];
    for (let i = 0; i < totalWeeks; i++) colWidths.push({ wch: 5 });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matrix_Export");
    
    const filename = `Report_Matrix_${selectedYear}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="bg-white rounded-xl flex flex-col h-[calc(100vh-6rem)] overflow-hidden border border-slate-300 shadow-sm">
      <div className="p-4 shrink-0 flex items-center justify-between border-b border-slate-300 shadow-sm z-30 relative bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="text-gov-blue" />
            Report Review Matrix
          </h2>
          <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-slate-50 font-medium"
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
          </select>
          <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-brand-primary outline-none appearance-none bg-slate-50 font-medium"
            >
              <option value="All Regions">All Regions (Aggregated)</option>
              {regions.map(reg => (
                <option key={reg._id} value={reg._id}>{reg.regionName}</option>
              ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportMatrixToExcel} 
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-gov-blue rounded-lg hover:bg-gov-blue-dark transition-colors"
          >
            <Download size={16} /> Export Matrix
          </button>
          <div className="inline-flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => onSwitchView('list')}
              className="px-4 py-1 text-sm font-semibold rounded-md text-slate-500 hover:text-slate-700 transition-colors"
            >
              List View
            </button>
            <button 
              className="px-4 py-1 text-sm font-semibold rounded-md bg-white shadow-sm text-gov-blue"
            >
              Matrix View
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white relative pb-10">
        {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-40 flex items-center justify-center backdrop-blur-[1px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue"></div>
            </div>
        )}
        <table className="w-full text-left text-xs border-collapse">
          <thead className="sticky top-0 z-20 font-medium bg-slate-100 text-slate-700 select-none shadow-sm">
            {/* Top Row: Details & Quarters */}
            <tr className="bg-slate-700 text-slate-100 uppercase text-center text-[11px] tracking-wider">
              <th className="sticky left-0 z-30 bg-slate-700 border-r border-slate-600 p-1 min-w-[500px]" colSpan={3}>DETAILS</th>
              {quarters.map((q) => (
                <th key={q.name} colSpan={q.months.reduce((acc, m) => acc + m.weeks.length, 0)} className="p-1 border-r border-slate-600">
                  {q.name}
                </th>
              ))}
            </tr>
            {/* Second Row: Deliverables & Months */}
            <tr className="text-center bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px]">
              <th className="sticky left-0 z-30 bg-slate-100 border-r border-slate-300 p-2 text-left" colSpan={3}>
                <div className="flex items-end justify-between pl-12 pr-4 text-slate-500">
                  <span>DELIVERABLES</span>
                  <span className="font-normal italic text-[9px] w-32 leading-tight">Enter the date of the first Monday of each month --&gt;</span>
                </div>
              </th>
              {quarters.flatMap(q => q.months).map((m, idx) => (
                <th key={`${m.name}-${idx}`} colSpan={m.weeks.length} className="p-1 border-r border-slate-300">
                  {m.name}
                </th>
              ))}
            </tr>
            {/* Third Row: Dates */}
            <tr className="text-center bg-slate-50 border-b-4 border-double border-slate-400 text-[10px] text-slate-500 font-semibold">
              <th className="sticky left-0 z-30 bg-slate-50 border-r border-slate-300 p-1" colSpan={3}></th>
              {flatWeeks.map((w, i) => (
                <th key={`${w.fullDate}-${i}`} className="p-1 border-r border-slate-300 min-w-[28px]" title={w.fullDate}>
                  {w.date}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="divide-y divide-slate-200">
            {categories.map((cat, catIdx) => {
              const isCat7 = cat.categoryNumber === 7 || cat.categoryName.toUpperCase().includes('OTHER');
              
              if (isCat7) {
                const catNum = cat.displayOrder || 7;
                const colors = catColors[7] || { bg: 'bg-[#155a8e]', text: 'text-[#155a8e]' };
                
                return (
                  <React.Fragment key={cat._id}>
                    <tr className="bg-slate-50 border-t-2 border-slate-400">
                      <td className={`${colors.bg} text-white font-bold text-center w-12 text-sm border-r border-b border-white sticky left-0 z-10 p-0`}>
                        {catNum}
                      </td>
                      <td colSpan={2} className={`bg-white ${colors.text} font-extrabold uppercase p-3 text-[11px] leading-snug border-r border-slate-300 sticky left-[48px] z-10 shadow-[2px_0_4px_rgba(0,0,0,0.03)]`}>
                        {cat.categoryName}
                      </td>
                      <td colSpan={totalWeeks} className="p-4 text-center text-slate-500 italic text-xs font-medium bg-slate-50/50">
                        {activities.length === 0 ? "No activities recorded for this year." : "Activity timelines mapped automatically."}
                      </td>
                    </tr>
                    {(() => {
                      // Group activities by month
                      const groupedActs = [];
                      for (let m = 0; m < 12; m++) {
                        const mActs = activities.filter(a => new Date(a.startDate).getMonth() === m);
                        if (mActs.length > 0) groupedActs.push({ monthIndex: m, acts: mActs });
                      }

                      return groupedActs.map(group => {
                        return group.acts.map((act, idx) => {
                          const isFirstInMonth = idx === 0;
                          const rowSpan = group.acts.length;
                          
                          return (
                            <tr key={act._id} className="hover:bg-slate-50 group border-b border-slate-100">
                              <td className="sticky left-0 z-10 bg-white border-r border-slate-200"></td>
                              <td colSpan={2} className="p-3 border-r border-slate-300 sticky left-[48px] z-10 bg-white shadow-[2px_0_4px_rgba(0,0,0,0.02)] min-w-[300px]">
                                <div className="font-bold text-slate-800 text-[11px]">{act.activityTitle}</div>
                                {selectedRegion === 'All Regions' && (
                                  <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 px-1 py-0.5 rounded mr-2 mt-1 inline-block">
                                    {regions.find(r => r._id === act.regionId)?.shortName || 'Unknown Region'}
                                  </span>
                                )}
                                {act.activityDescription && act.activityDescription.trim().toLowerCase() !== act.activityTitle.trim().toLowerCase() && (
                                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{act.activityDescription}</div>
                                )}
                                <div className="text-[9px] font-medium text-slate-400 mt-1">
                                  {format(new Date(act.startDate), 'MMM d, yyyy')} - {format(new Date(act.endDate), 'MMM d, yyyy')}
                                </div>
                              </td>
                              
                              {(() => {
                                const renderedCells = [];
                                let targetMonthCols = 0;
                                
                                flatWeeks.forEach(w => {
                                  if (w.monthIndex === group.monthIndex) targetMonthCols++;
                                });
                                
                                let monthCellRendered = false;

                                flatWeeks.forEach((w, wIdx) => {
                                  if (w.monthIndex === group.monthIndex) {
                                    if (!isFirstInMonth) return;
                                    
                                    if (!monthCellRendered) {
                                      monthCellRendered = true;
                                      renderedCells.push(
                                        <td key={`merged-${group.monthIndex}`} rowSpan={rowSpan} colSpan={targetMonthCols} className="border border-blue-200/50 p-0 text-center align-middle bg-blue-50/70 shadow-sm relative z-0">
                                          <span className="font-extrabold text-gov-blue text-sm">{rowSpan}</span>
                                        </td>
                                      );
                                    }
                                  } else {
                                    renderedCells.push(
                                      <td key={`${w.fullDate}-${wIdx}`} className="border-r border-slate-200 p-0 text-center align-middle"></td>
                                    );
                                  }
                                });
                                
                                return renderedCells;
                              })()}
                            </tr>
                          );
                        });
                      });
                    })()}
                  </React.Fragment>
                );
              }

              // Categories 1-6
              const catInds = indicators.filter(ind => {
                const indCatId = typeof ind.categoryId === 'object' ? ind.categoryId._id : ind.categoryId;
                if (indCatId !== cat._id) return false;
                if (!ind.indicatorCode?.startsWith('CUST-')) return true;
                return accomplishments[ind._id] && Object.keys(accomplishments[ind._id]).length > 0;
              });
              
              const catNum = cat.displayOrder || (catIdx + 1);
              const colors = catColors[catNum] || { bg: 'bg-slate-500', text: 'text-slate-700' };

              if (catInds.length === 0) {
                return (
                  <tr key={cat._id} className="bg-slate-50">
                    <td className={`${colors.bg} text-white font-bold text-center w-12 text-sm border-r border-b border-white sticky left-0 z-10 p-0`}>
                      {catNum}
                    </td>
                    <td className={`bg-white ${colors.text} font-extrabold uppercase w-[220px] p-3 text-[11px] leading-snug border-r border-slate-300 sticky left-[48px] z-10 align-top shadow-[2px_0_4px_rgba(0,0,0,0.03)]`}>
                      {cat.categoryName}
                    </td>
                    <td colSpan={totalWeeks + 1} className="p-4 text-center text-slate-500 italic text-xs font-medium border-t-0">
                      No indicators found for this category.
                    </td>
                  </tr>
                );
              }

              return catInds.map((ind, indIdx) => {
                const isFirst = indIdx === 0;
                
                return (
                  <tr key={ind._id} className="hover:bg-blue-50/30 group">
                    {/* Render Category Blocks only on the first row of the category */}
                    {isFirst && (
                      <>
                        <td rowSpan={catInds.length} className={`${colors.bg} text-white font-bold text-center w-12 text-sm border-r border-b border-white sticky left-0 z-10 p-0`}>
                          {catNum}
                        </td>
                        <td rowSpan={catInds.length} className={`bg-white ${colors.text} font-extrabold uppercase w-[220px] p-3 text-[11px] leading-snug border-r border-slate-300 sticky left-[48px] z-10 align-top shadow-[2px_0_4px_rgba(0,0,0,0.03)]`}>
                          {cat.categoryName}
                        </td>
                      </>
                    )}
                    
                    {/* Indicator Name */}
                    <td className={`p-2 pl-3 border-r border-slate-300 text-[11px] text-gov-blue bg-white sticky left-[268px] z-10 w-[232px] align-top shadow-[2px_0_4px_rgba(0,0,0,0.02)] leading-tight font-medium ${isFirst ? '' : 'border-t-0'}`}>
                      {ind.indicatorName}
                    </td>

                    {/* Weekly Data */}
                    {quarters.flatMap(q => q.months).map(m => (
                      m.weeks.map(w => {
                        const cellKey = `${m.monthIndex}-${w.weekNumber}`;
                        const val = accomplishments[ind._id]?.[cellKey];
                        return (
                          <td key={`${ind._id}-${cellKey}`} className={`border-r border-slate-200 p-0 relative transition-colors ${val ? 'bg-gov-blue-light/30' : 'bg-transparent'}`}>
                            <div className="w-full h-full min-h-[30px] flex items-center justify-center text-slate-800 text-xs font-bold">
                                {val || '-'}
                            </div>
                          </td>
                        );
                      })
                    ))}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
