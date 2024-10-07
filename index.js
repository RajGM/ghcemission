const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { writeToPath } = require('fast-csv');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Function to clean column names
const cleanColumnName = (name) => name.toLowerCase().replace(/\s+/g, '_');

// Function to extract country from item description
const extractCountry = (description) => {
    console.log(description)
    const words = description.split(' ');
    return words[words.length - 1];
};

// Function to assign emission factors (placeholder implementation)
const assignEmissionFactor = (category, subcategory, country, emissionFactors) => {
    if (emissionFactors[`${category},${subcategory},${country}`]) {
        return emissionFactors[`${category},${subcategory},${country}`];
    } else if (emissionFactors[`${category},${country}`]) {
        return emissionFactors[`${category},${country}`];
    } else if (emissionFactors[category]) {
        return emissionFactors[category];
    }
    return 1.0; // Default factor
};

// Function to calculate average emission factors (placeholder implementation)
const calculateAverageEmissionFactors = (data) => {
    const emissionFactors = {};
    const categories = [...new Set(data.map(row => row.category_level_2))];
    const subcategories = [...new Set(data.map(row => row.category_level_3))];
    const countries = [...new Set(data.map(row => row.country))];

    categories.forEach(category => {
        emissionFactors[category] = Math.random() * (2.0 - 0.1) + 0.1;
        countries.forEach(country => {
            emissionFactors[`${category},${country}`] = emissionFactors[category] * (Math.random() * (1.2 - 0.8) + 0.8);
            subcategories.forEach(subcategory => {
                emissionFactors[`${category},${subcategory},${country}`] = emissionFactors[`${category},${country}`] * (Math.random() * (1.1 - 0.9) + 0.9);
            });
        });
    });

    return emissionFactors;
};

// Function to generate chart
const generateChart = async (data, title, filename) => {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
    
    const configuration = {
        type: 'bar',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: 'Emissions',
                data: data.map(d => d.value),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: title
                }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    fs.writeFileSync(path.join(__dirname, filename), image);
};

// Main function to process the CSV file
const processCSV = (inputFile, detailedOutputFile, summaryOutputFile) => {
    const results = [];

    fs.createReadStream(inputFile)
        .pipe(parse({ columns: header => header.map(cleanColumnName) }))
        .on('data', (row) => {
            console.log(row)
            row.country = extractCountry(row.item_description);
            results.push(row);
        })
        .on('end', () => {
            const emissionFactors = calculateAverageEmissionFactors(results);

            results.forEach(row => {
                row.emission_factor = assignEmissionFactor(row.category_level_2, row.category_level_3, row.country, emissionFactors);
                row.emissions = row.received_amount * row.emission_factor;
            });

            // Write detailed results
            writeToPath(detailedOutputFile, results)
                .on('error', err => console.error(err))
                .on('finish', () => console.log('Detailed CSV file written successfully'));

            // Generate summary
            const summary = results.reduce((acc, row) => {
                const key = `${row.bu_name},${row.category_level_2},${row.category_level_3},${row.country},${row.supplier_name}`;
                if (!acc[key]) {
                    acc[key] = { ...row, count: 1 };
                } else {
                    acc[key].emissions += row.emissions;
                    acc[key].received_amount += row.received_amount;
                    acc[key].count += 1;
                }
                return acc;
            }, {});

            const summaryResults = Object.values(summary).map(row => ({
                ...row,
                emissions_intensity: row.emissions / row.received_amount
            }));

            // Write summary results
            writeToPath(summaryOutputFile, summaryResults)
                .on('error', err => console.error(err))
                .on('finish', () => console.log('Summary CSV file written successfully'));

            // Generate charts
            const topCategories = Object.entries(
                summaryResults.reduce((acc, row) => {
                    acc[row.category_level_2] = (acc[row.category_level_2] || 0) + row.emissions;
                    return acc;
                }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 10);

            generateChart(topCategories.map(([label, value]) => ({ label, value })), 'Top 10 Categories by Emissions', 'top_categories_emissions.png');

            const topCountries = Object.entries(
                summaryResults.reduce((acc, row) => {
                    acc[row.country] = (acc[row.country] || 0) + row.emissions;
                    return acc;
                }, {})
            ).sort((a, b) => b[1] - a[1]).slice(0, 10);

            generateChart(topCountries.map(([label, value]) => ({ label, value })), 'Top 10 Countries by Emissions', 'country_emissions.png');
        });
};

// Run the script
processCSV('sample.csv', 'detailed_emissions.csv', 'emissions_summary.csv');