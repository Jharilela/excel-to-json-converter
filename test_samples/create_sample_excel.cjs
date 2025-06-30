const XLSX = require('xlsx');
const fs = require('fs');

const json = JSON.parse(fs.readFileSync('test_samples/sample.json', 'utf8'));
const ws = XLSX.utils.json_to_sheet(json);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'test_samples/sample.xlsx');
console.log('sample.xlsx created from sample.json'); 