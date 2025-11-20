const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const addContactsTable = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if contacts table already exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'contacts'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Contacts table already exists!');
      await client.query('ROLLBACK');
      return;
    }

    // Create contacts table
    await client.query(`
      CREATE TABLE contacts (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        position VARCHAR(100),
        department VARCHAR(100),
        is_primary BOOLEAN DEFAULT false,
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX idx_contacts_client_id ON contacts(client_id);
      CREATE INDEX idx_contacts_is_primary ON contacts(is_primary);
    `);

    // Add trigger to ensure only one primary contact per client
    await client.query(`
      CREATE OR REPLACE FUNCTION ensure_single_primary_contact()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.is_primary = true THEN
          UPDATE contacts 
          SET is_primary = false 
          WHERE client_id = NEW.client_id 
            AND id != NEW.id 
            AND is_primary = true;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      CREATE TRIGGER trigger_ensure_single_primary_contact
      BEFORE INSERT OR UPDATE ON contacts
      FOR EACH ROW
      EXECUTE FUNCTION ensure_single_primary_contact();
    `);

    await client.query('COMMIT');
    console.log('✅ Contacts table created successfully!');
    console.log('✅ Primary contact constraint added!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating contacts table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  addContactsTable()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = addContactsTable;