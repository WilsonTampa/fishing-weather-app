/**
 * Build script to fetch all NOAA tide stations
 * Runs before build to generate static JSON file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOAA_API = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json';

async function fetchStations() {
  console.log('Fetching tide stations from NOAA API...');

  try {
    const response = await fetch(`${NOAA_API}?type=tidepredictions`);

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`Received ${data.count || 0} stations from NOAA`);

    // Simplify data structure - only keep what we need
    const stations = data.stations.map(s => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      state: s.state || '',
      type: s.type || 'R'
    }));

    // Sort by state, then name for easier debugging
    stations.sort((a, b) => {
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.name.localeCompare(b.name);
    });

    // Create output object
    const output = {
      count: stations.length,
      fetchedAt: new Date().toISOString(),
      stations
    };

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Write to public directory
    const outputPath = path.join(publicDir, 'tide-stations.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    // Calculate file size
    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✓ Successfully fetched ${stations.length} tide stations`);
    console.log(`✓ Saved to ${outputPath} (${fileSizeKB} KB)`);

    // Show some stats
    const stateCount = new Set(stations.map(s => s.state)).size;
    console.log(`✓ Covering ${stateCount} states/territories`);

  } catch (error) {
    console.error('Error fetching tide stations:', error.message);
    process.exit(1);
  }
}

fetchStations();
