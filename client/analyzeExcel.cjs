const XLSX = require('xlsx');

const filePath = 'c:\\Users\\Localuser\\Downloads\\NCR Accomplishment.xlsx';
const workbook = XLSX.readFile(filePath);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

console.log(`Sheet Name: ${sheetName}`);
console.log(`Total Rows: ${rows.length}`);

for (let i = 25; i < Math.min(45, rows.length); i++) {
  console.log(`Row ${i}:`, JSON.stringify(rows[i]));
}
