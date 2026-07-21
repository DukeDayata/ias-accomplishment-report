import React from 'react';
import MatrixCategory7Row from './MatrixCategory7Row';
import MatrixIndicatorRow from './MatrixIndicatorRow';

export default function MatrixTable({
  quarters,
  flatWeeks,
  totalWeeks,
  categories,
  indicators,
  activities,
  accomplishments,
  handleInputChange,
  catColors
}) {
  return (
    <div className="flex-1 overflow-auto bg-white pb-10">
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
              return (
                <MatrixCategory7Row 
                  key={cat._id}
                  cat={cat}
                  catColors={catColors}
                  activities={activities}
                  flatWeeks={flatWeeks}
                  totalWeeks={totalWeeks}
                />
              );
            } else {
              return (
                <MatrixIndicatorRow 
                  key={cat._id}
                  cat={cat}
                  catIdx={catIdx}
                  catColors={catColors}
                  indicators={indicators}
                  accomplishments={accomplishments}
                  quarters={quarters}
                  totalWeeks={totalWeeks}
                  handleInputChange={handleInputChange}
                />
              );
            }
          })}
        </tbody>
      </table>
    </div>
  );
}
