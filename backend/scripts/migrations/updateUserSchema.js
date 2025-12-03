/**
 * Migration: Update user schema + create invite workflow tables
 * Safe to run multiple times (idempotent)
 */

const { pool } = require("../../config/database");

async function runMigration() {
  console.log("🚀 Starting CRM migration...");

  try {
    //
    // 1. Create users_invites table
    //
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_invites (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        role VARCHAR(50) NOT NULL DEFAULT 'general',
        permissions JSONB DEFAULT '[]'::jsonb,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✔ users_invites table ensured");

    //
    // 2. Add missing columns to users table
    //
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
    `);
    console.log("✔ users.is_active added");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by INTEGER REFERENCES users(id);
    `);
    console.log("✔ users.invited_by added");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
    `);
    console.log("✔ users.first_name added");

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
    `);
    console.log("✔ users.last_name added");

    //
    // 3. Patch existing users (activate them + set first/last name if missing)
    //
    await pool.query(`
      UPDATE users
      SET is_active = true
      WHERE is_active = false OR is_active IS NULL;
    `);
    console.log("✔ Existing users activated");

    await pool.query(`
      UPDATE users
      SET first_name = full_name,
          last_name = ''
      WHERE first_name IS NULL;
    `);
    console.log("✔ Existing users given placeholder first_name");

    console.log("🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    pool.end();
  }
}

runMigration();
