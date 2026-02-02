/**
 * Build script to fetch all NOAA meteorological stations with wind sensors
 * Generates a static JSON file for use by the wind map
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOAA_API = 'https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json';

async function fetchWindStations() {
  console.log('Fetching meteorological stations from NOAA API...');

  try {
    const response = await fetch(`${NOAA_API}?type=met&expand=sensors`);

    if (!response.ok) {
      throw new Error(`NOAA API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`Received ${data.count || 0} meteorological stations from NOAA`);

    // Filter to stations that have wind sensors (sensorID "C1")
    const windStations = data.stations
      .filter(s => {
        const sensors = s.sensors?.sensors;
        if (!Array.isArray(sensors)) return false;
        return sensors.some(sensor => sensor.sensorID === 'C1');
      })
      .map(s => ({
        id: s.id,
        name: s.name,
        lat: s.lat,
        lng: s.lng,
        state: s.state || '',
      }));

    // Sort by state, then name
    windStations.sort((a, b) => {
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.name.localeCompare(b.name);
    });

    const output = {
      count: windStations.length,
      fetchedAt: new Date().toISOString(),
      stations: windStations,
    };

    // Ensure public directory exists
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, 'wind-stations.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    const stats = fs.statSync(outputPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log(`✓ Successfully fetched ${windStations.length} wind stations`);
    console.log(`✓ Saved to ${outputPath} (${fileSizeKB} KB)`);

    const stateCount = new Set(windStations.map(s => s.state)).size;
    console.log(`✓ Covering ${stateCount} states/territories`);

  } catch (error) {
    console.error('Error fetching wind stations:', error.message);
    process.exit(1);
  }
}

fetchWindStations();
