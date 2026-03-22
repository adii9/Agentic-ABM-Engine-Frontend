import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import os from 'os';
import path from 'path';

export const dynamic = 'force-dynamic';

// Helper to open the db
async function openDb() {
  const dbPath = path.join(os.homedir(), 'Library/Application Support/abm_engine/flow_states.db');
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

export async function GET(request) {
  try {
    const db = await openDb();
    const states = await db.all('SELECT * FROM flow_states ORDER BY timestamp DESC LIMIT 100');
    // Parse the JSON state object so frontend has easier time parsing it
    const parsedStates = states.map(s => {
      try {
        return {
          ...s,
          state_json: JSON.parse(s.state_json)
        };
      } catch (e) {
        return s;
      }
    });
    await db.close();
    return Response.json({ success: true, data: parsedStates });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
