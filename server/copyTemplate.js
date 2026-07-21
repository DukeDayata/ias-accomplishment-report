const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist') continue; // skip huge folders
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  }
}

const targetDir = 'c:\\Users\\Localuser\\Documents\\CHED Systems\\ias-regions-report';
const publicDir = path.join(targetDir, 'client', 'public');
const destFile = path.join(publicDir, 'template.xlsx');

let found = false;

// Create public dir if it doesn't exist
if (!fs.existsSync(publicDir)){
    fs.mkdirSync(publicDir, { recursive: true });
}

walkDir(targetDir, filePath => {
  if (found) return;
  if (filePath.endsWith('.xlsx') && !filePath.includes('template.xlsx')) {
    console.log('Found potential Excel file:', filePath);
    // Copy it to client/public/template.xlsx
    fs.copyFileSync(filePath, destFile);
    console.log('Successfully copied to:', destFile);
    found = true;
  }
});

if (!found) {
  console.log('No .xlsx files found in the project directory.');
}
