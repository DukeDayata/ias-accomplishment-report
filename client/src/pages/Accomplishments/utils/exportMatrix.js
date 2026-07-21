import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export const exportMatrixToExcel = ({
  quarters,
  flatWeeks,
  totalWeeks,
  categories,
  activities,
  indicators,
  accomplishments,
  selectedYear
}) => {
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
            const val = accomplishments[ind._id]?.[`${w.monthIndex}-${w.weekNumber}`] || "";
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
  
  const filename = `Accomplishment_Matrix_${selectedYear}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
  XLSX.writeFile(workbook, filename);
};
