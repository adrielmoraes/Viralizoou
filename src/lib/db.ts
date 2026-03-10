import { neon } from '@neondatabase/serverless';

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL não configurada no .env');
  }
  return neon(databaseUrl);
}

export async function initializeDatabase() {
  const sql = getDb();

  try {
    console.log("Creating users...");
    await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          plan VARCHAR(50) DEFAULT 'free',
          stripe_customer_id VARCHAR(255),
          stripe_subscription_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
        `;

    console.log("Creating projects...");
    await sql`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'draft',
          script_data JSONB,
          config JSONB,
          grid_images TEXT[],
          refined_images TEXT[],
          videos TEXT[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
        `;

    console.log("Creating characters...");
    await sql`
        CREATE TABLE IF NOT EXISTS characters (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          reference_image TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
        `;

    console.log("All tables created successfully");
  } catch (e: any) {
    console.error("Failed executing sql:", e);
    throw new Error("DB Init Error: " + e.message);
  }
}
