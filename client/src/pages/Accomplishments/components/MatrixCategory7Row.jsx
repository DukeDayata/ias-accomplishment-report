import React from 'react';
import { format } from 'date-fns';

export default function MatrixCategory7Row({ cat, catColors, activities, flatWeeks, totalWeeks }) {
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
          Category 7 timelines are generated automatically. Use 'List View' to add or edit activities.
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
                  {act.activityDescription && act.activityDescription.trim().toLowerCase() !== act.activityTitle.trim().toLowerCase() && (
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{act.activityDescription}</div>
                  )}
                  <div className="text-[9px] font-medium text-slate-400 mt-1 inline-block mr-2">
                    {format(new Date(act.startDate), 'MMM d, yyyy')} - {format(new Date(act.endDate), 'MMM d, yyyy')}
                  </div>
                  {act.remarks && <div className="text-[9px] text-[#508d98] font-semibold italic mt-1 inline-block">{act.remarks}</div>}
                </td>
                
                {(() => {
                  const renderedCells = [];
                  let targetMonthCols = 0;
                  
                  flatWeeks.forEach(fw => {
                    if (fw.monthIndex === group.monthIndex) targetMonthCols++;
                  });

                  let monthCellRendered = false;
                  
                  flatWeeks.forEach((w, wIdx) => {
                    if (w.monthIndex === group.monthIndex) {
                      if (!monthCellRendered) {
                        monthCellRendered = true;
                        renderedCells.push(
                          <td 
                            key={`act-span-${wIdx}`}
                            colSpan={targetMonthCols}
                            className="bg-blue-50/30 border-r border-b border-slate-200 p-2 align-middle text-center"
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="font-bold text-blue-700 text-xs">{act.actual || 0}</span>
                              <div className="w-full h-1.5 bg-blue-400 rounded-full mt-1 opacity-70"></div>
                            </div>
                          </td>
                        );
                      }
                    } else {
                      renderedCells.push(
                        <td key={`empty-${wIdx}`} className="border-r border-slate-100 bg-transparent"></td>
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
