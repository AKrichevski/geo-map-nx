// libs/db/src/connection.ts
import * as fs from 'fs';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

// Database file path from environment variables
export const DB_PATH =
  process.env.DB_PATH ||
  path.resolve(__dirname, '../../../data/geodata.db');

// Ensure the data directory exists
export const ensureDataDirectory = (): void => {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get a database connection
export const getDb = async (): Promise<Database> => {
  ensureDataDirectory();

  try {
    return await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
  } catch (error: any) {
    console.error(`Failed to connect to database at ${DB_PATH}:`, error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Initialize database
export const initializeDatabase = async (): Promise<void> => {
  const db = await getDb();

  try {
    // Create Layers table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS layers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Polygons table with standard features
    await db.exec(`
      CREATE TABLE IF NOT EXISTS polygons (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          layer_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          color TEXT NOT NULL,
          size_km2 REAL NOT NULL,
          geometry_json TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (layer_id) REFERENCES layers(id) ON DELETE CASCADE
      );
    `);

    console.log('Database schema initialized');
  } catch (error: any) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    await db.close();
  }
};
