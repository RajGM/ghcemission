const XLSX = require('xlsx');
const fs = require('fs');
const { writeToPath } = require('fast-csv');

const inputFile = 'DHGS_Spend_Jan-Feb.xlsx';
const outputFile = 'sample.csv';
const sampleSize = 100;

// Read the Excel file
try {
    const workbook = XLSX.readFile(inputFile);
    const sheetName = workbook.SheetNames[0]; // Assume data is in the first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert the worksheet to an array of objects
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // { header: 1 } will return the array with headers

    console.log(`Total rows in Excel file: ${data.length}`);
    
    // Extract the first 100 rows (or all if less than 100)
    const headers = data[0]; // Get the headers (first row)
    const sampleData = data.slice(1, sampleSize + 1); // Get the data rows (starting from second row)
    
    console.log(`Extracted ${sampleData.length} rows from ${inputFile}`);
    
    // Combine headers and sample data into one array for CSV
    const csvData = [headers, ...sampleData];

    // Write the sample data to a CSV file with headers
    writeToPath(outputFile, csvData)
        .on('error', err => console.error('Error writing CSV file:', err))
        .on('finish', () => console.log(`Sample CSV file written successfully to ${outputFile}`));
} catch (error) {
    console.error('Error processing Excel file:', error);
}
