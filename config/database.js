import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

let dbConnected = false;

async function connectDatabase() {
  if (dbConnected) return;
  
  try {
    if (db._connected) {
      dbConnected = true;
      await db.query('SET search_path TO BOOKS');
      return;
    }
    
    await db.connect();
    await db.query('SELECT 1'); 
    await db.query('SET search_path TO BOOKS');
    
    dbConnected = true;
    console.log("database connected and schema set");
  } catch (err) {
    if (err.message.includes('already been connected')) {
      dbConnected = true;
      await db.query('SET search_path TO BOOKS'); 
      return;
    }
    console.error("database connection failed:", err);
    dbConnected = false;
    throw err; 
  }
}

// initialize connection
connectDatabase();

export { db, connectDatabase, dbConnected };
