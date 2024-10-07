import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { getNames } from 'country-list'; // Import country-list

export default async function HomePage() {
  // Read the CSV file from the file system (on the server-side)
  const filePath = path.join(process.cwd(), 'src/files/sample.csv');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  // Parse the CSV file content
  const { data } = Papa.parse(fileContent, {
    header: true, // Include headers in the output
    skipEmptyLines: true, // Skip empty rows
  });

  // Get the list of country names
  const countryNames = getNames();

  // Function to find a country in the item description
  const findCountryInDescription = (description) => {
    for (let country of countryNames) {
      if (description.includes(country)) {
        return country;
      }
    }
    return 'Unknown'; // If no country is found, return 'Unknown'
  };

  // Calculate the total emissions and process the CSV data
  let totalEmissions = 0;

  const processedData = data
    .map((row) => {
      const description = row['Item Description'] || '';
      const quantity = parseFloat(row['Quantity']) || 0;
      const emissionFactor = 2.5; // Example emission factor (CO2e per unit)
      const emissions = quantity * emissionFactor;

      // Search for the country in the item description
      const detectedCountry = findCountryInDescription(description);

      totalEmissions += emissions;

      return {
        ...row,
        emissions: emissions.toFixed(2),
        country: detectedCountry, // Add detected country to each row
      };
    })
    // Filter out rows where country is "Unknown"
    .filter((row) => row.country !== 'Unknown');

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
            <th>Country</th>
            <th>Category Level 0</th>
            <th>Category Level 1</th>
            <th>Category Level 2</th>
            <th>Category Level 3</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((row, index) => (
            <tr key={index}>
              <td>{row['Item Description']}</td>
              <td>{row['Quantity']}</td>
              <td>{row['Unit Price']}</td>
              <td>{row.emissions}</td>
              <td>{row.country}</td>
              <td>{row['Category - Level 0']}</td> {/* Display Category Level 0 */}
              <td>{row['Category - Level 1']}</td> {/* Display Category Level 1 */}
              <td>{row['Category - Level 2']}</td> {/* Display Category Level 2 */}
              <td>{row['Category - Level 3']}</td> {/* Display Category Level 3 */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
