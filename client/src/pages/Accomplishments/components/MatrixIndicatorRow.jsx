import React from 'react';

export default function MatrixIndicatorRow({ 
  cat, 
  catIdx, 
  catColors, 
  indicators, 
  accomplishments, 
  quarters, 
  totalWeeks, 
  handleInputChange 
}) {
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
          No indicators found. Use the 'List View' to add custom activities and accomplishments for this category.
        </td>
      </tr>
    );
  }

  return (
    <React.Fragment key={cat._id}>
      {catInds.map((ind, indIdx) => {
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
            <td className={`p-2 pl-3 border-r border-slate-300 text-[11px] text-[#2c65a3] bg-white sticky left-[268px] z-10 w-[232px] align-top shadow-[2px_0_4px_rgba(0,0,0,0.02)] leading-tight font-medium ${isFirst ? '' : 'border-t-0'}`}>
              {ind.indicatorName}
            </td>

            {/* Weekly Inputs */}
            {quarters.flatMap(q => q.months).map(m => (
              m.weeks.map(w => {
                const cellKey = `${m.monthIndex}-${w.weekNumber}`;
                const val = accomplishments[ind._id]?.[cellKey];
                return (
                  <td key={`${ind._id}-${cellKey}`} className={`border-r border-slate-200 p-0 relative transition-colors ${val ? 'bg-blue-50/50' : 'bg-transparent hover:bg-slate-50'}`}>
                    <input 
                      type="number"
                      min="0"
                      value={val || ''}
                      onChange={(e) => handleInputChange(ind._id, m.monthIndex, w.weekNumber, e.target.value)}
                      className="w-full h-full min-h-[30px] text-center bg-transparent border-none focus:ring-[1.5px] focus:ring-inset focus:ring-blue-500 outline-none text-slate-700 text-xs font-semibold placeholder:text-slate-300 placeholder:font-normal"
                      placeholder="-"
                    />
                  </td>
                );
              })
            ))}
          </tr>
        );
      })}
    </React.Fragment>
  );
}
