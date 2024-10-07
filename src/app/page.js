import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export default async function HomePage() {
  // Read the CSV file from the file system (on the server-side)
  const filePath = path.join(process.cwd(), 'src/files/sample.csv');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Parse the CSV file content
  const { data } = await new Promise((resolve) => {
    Papa.parse(fileContent, {
      header: true, // Include headers in the output
      complete: (results) => resolve(results),
    });
  });

  // Calculate the total emissions
  let totalEmissions = 0;

  const processedData = data.map((row) => {
    const quantity = parseFloat(row['Quantity']) || 0;
    const emissionFactor = 2.5; // Example emission factor (CO2e per unit)
    const emissions = quantity * emissionFactor;

    totalEmissions += emissions;

    return {
      ...row,
      emissions: emissions.toFixed(2),
    };
  });

  return (
    <div>
      <h1>GHG Emissions Calculator</h1>
      <p>Total Emissions: {totalEmissions.toFixed(2)} CO2e</p>

      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Emissions (CO2e)</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((row, index) => (
            <tr key={index}>
              <td>{row['Item Description']}</td>
              <td>{row['Quantity']}</td>
              <td>{row['Unit Price']}</td>
              <td>{row.emissions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
