const fs = require('fs');
const path = require('path');

const src = 'c:\\Users\\Localuser\\Downloads\\NCR Accomplishment.xlsx';
const dest = 'c:\\Users\\Localuser\\Documents\\CHED Systems\\ias-regions-report\\client\\public\\template.xlsx';

fs.copyFileSync(src, dest);
console.log('Copied successfully.');
