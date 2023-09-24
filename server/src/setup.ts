import { pool } from './context';
import fs from 'node:fs';

async function main() {
  const sql = fs.readFileSync('./scripts/setup.sql', 'utf-8');

  await pool.query(sql);
}

main();
