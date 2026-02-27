import xlsx from 'xlsx';
import path from 'path';

const filePath = 'f:/AI-Auto/example.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log('Sheet Name:', sheetName);
console.log('First 2 rows:', JSON.stringify(data.slice(0, 2), null, 2));
console.log('Columns:', Object.keys(data[0] || {}));
