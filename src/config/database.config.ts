import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error(JSON.stringify({
    level: 'error',
    message: 'Unexpected error on idle database client',
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  }));
  process.exit(-1);
});

export const testConnection = async () => {
  try {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Testing database connection',
      config: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER
      },
      timestamp: new Date().toISOString()
    }));

    const client = await pool.connect();

    console.log(JSON.stringify({
      level: 'info',
      message: 'Database connected successfully',
      timestamp: new Date().toISOString()
    }));

    client.release();
    return true;
  } catch (error) {
    console.error(JSON.stringify({
      level: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }));
    return false;
  }
};
