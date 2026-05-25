import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, seedDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firstNamesPath = path.join(__dirname, '..', 'first_names.txt');
const lastNamesPath = path.join(__dirname, '..', 'last_names.txt');

function run() {
  console.log('--- Starting Salary Management Seeder ---');
  
  if (!fs.existsSync(firstNamesPath) || !fs.existsSync(lastNamesPath)) {
    console.error('Error: first_names.txt or last_names.txt not found in the root directory.');
    process.exit(1);
  }

  // Slice to exactly 100 elements to ensure exactly 10,000 high-performance combinations
  const firstNames = fs.readFileSync(firstNamesPath, 'utf-8').split('\n').filter(Boolean).slice(0, 100);
  const lastNames = fs.readFileSync(lastNamesPath, 'utf-8').split('\n').filter(Boolean).slice(0, 100);

  console.log(`Loaded ${firstNames.length} first names and ${lastNames.length} last names (sliced to 100 each for 10,000 records).`);
  console.log(`Generating combinations...`);

  // Initialize DB and create schema/indexes
  initDb();

  console.log('Seeding employees table...');
  const result = seedDb(firstNames, lastNames);

  console.log('--- Seeding Completed Successfully ---');
  console.log(`Total Employees Inserted: ${result.count}`);
  console.log(`Duration: ${result.durationMs} ms (${(result.durationMs / 1000).toFixed(3)} seconds)`);
  console.log(`Rate: ${Math.round(result.count / (result.durationMs / 1000))} rows/second`);
}

run();
