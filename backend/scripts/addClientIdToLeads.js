const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const addClientIdToLeads = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if column already exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='leads' AND column_name='client_id';
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ client_id column already exists in leads table!');
      await client.query('ROLLBACK');
      return;
    }

    // Add client_id column to leads
    await client.query(`
      ALTER TABLE leads 
      ADD COLUMN client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL;
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX idx_leads_client_id ON leads(client_id);
    `);

    await client.query('COMMIT');
    console.log('✅ client_id column added to leads table successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding client_id to leads:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  addClientIdToLeads()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = addClientIdToLeads;