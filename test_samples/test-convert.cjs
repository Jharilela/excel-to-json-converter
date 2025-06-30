const XLSX = require('xlsx');
const Papa = require('papaparse');
const fs = require('fs');

function isArrayOfObjects(arr) {
  return Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object' && !Array.isArray(arr[0]);
}

// Read JSON
const json = JSON.parse(fs.readFileSync('test_samples/sample.json', 'utf8'));
console.log('JSON loaded:', json);

// JSON to CSV
const csv = Papa.unparse(json);
fs.writeFileSync('test_samples/from_json.csv', csv);
console.log('Converted JSON to CSV: from_json.csv');
// Validate CSV
const parsedFromJsonCsv = Papa.parse(fs.readFileSync('test_samples/from_json.csv', 'utf8'), { header: true }).data;
if (isArrayOfObjects(parsedFromJsonCsv)) {
  console.log('PASS: from_json.csv is valid CSV with headers.');
} else {
  console.error('FAIL: from_json.csv is not valid.');
}

// JSON to Excel
const ws = XLSX.utils.json_to_sheet(json);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'test_samples/from_json.xlsx');
console.log('Converted JSON to Excel: from_json.xlsx');
// Validate Excel
const wbCheck1 = XLSX.readFile('test_samples/from_json.xlsx');
const wsCheck1 = wbCheck1.Sheets[wbCheck1.SheetNames[0]];
const excelJsonCheck1 = XLSX.utils.sheet_to_json(wsCheck1);
if (isArrayOfObjects(excelJsonCheck1)) {
  console.log('PASS: from_json.xlsx is valid Excel with headers.');
} else {
  console.error('FAIL: from_json.xlsx is not valid.');
}

// Read CSV
const csvData = fs.readFileSync('test_samples/sample.csv', 'utf8');
const parsedCsv = Papa.parse(csvData, { header: true }).data;
console.log('CSV loaded:', parsedCsv);

// CSV to JSON
fs.writeFileSync('test_samples/from_csv.json', JSON.stringify(parsedCsv, null, 2));
console.log('Converted CSV to JSON: from_csv.json');
// Validate JSON
const fromCsvJson = JSON.parse(fs.readFileSync('test_samples/from_csv.json', 'utf8'));
if (isArrayOfObjects(fromCsvJson)) {
  console.log('PASS: from_csv.json is valid JSON array of objects.');
} else {
  console.error('FAIL: from_csv.json is not valid.');
}

// CSV to Excel
const ws2 = XLSX.utils.json_to_sheet(parsedCsv);
const wb2 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb2, ws2, 'Sheet1');
XLSX.writeFile(wb2, 'test_samples/from_csv.xlsx');
console.log('Converted CSV to Excel: from_csv.xlsx');
// Validate Excel
const wbCheck2 = XLSX.readFile('test_samples/from_csv.xlsx');
const wsCheck2 = wbCheck2.Sheets[wbCheck2.SheetNames[0]];
const excelJsonCheck2 = XLSX.utils.sheet_to_json(wsCheck2);
if (isArrayOfObjects(excelJsonCheck2)) {
  console.log('PASS: from_csv.xlsx is valid Excel with headers.');
} else {
  console.error('FAIL: from_csv.xlsx is not valid.');
}

// Read Excel
const wb3 = XLSX.readFile('test_samples/sample.xlsx');
const ws3 = wb3.Sheets[wb3.SheetNames[0]];
const excelJson = XLSX.utils.sheet_to_json(ws3);
console.log('Excel loaded:', excelJson);

// Excel to JSON
fs.writeFileSync('test_samples/from_excel.json', JSON.stringify(excelJson, null, 2));
console.log('Converted Excel to JSON: from_excel.json');
// Validate JSON
const fromExcelJson = JSON.parse(fs.readFileSync('test_samples/from_excel.json', 'utf8'));
if (isArrayOfObjects(fromExcelJson)) {
  console.log('PASS: from_excel.json is valid JSON array of objects.');
} else {
  console.error('FAIL: from_excel.json is not valid.');
}

// Excel to CSV
const excelCsv = Papa.unparse(excelJson);
fs.writeFileSync('test_samples/from_excel.csv', excelCsv);
console.log('Converted Excel to CSV: from_excel.csv');
// Validate CSV
const parsedFromExcelCsv = Papa.parse(fs.readFileSync('test_samples/from_excel.csv', 'utf8'), { header: true }).data;
if (isArrayOfObjects(parsedFromExcelCsv)) {
  console.log('PASS: from_excel.csv is valid CSV with headers.');
} else {
  console.error('FAIL: from_excel.csv is not valid.');
} 