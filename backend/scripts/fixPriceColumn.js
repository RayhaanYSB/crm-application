const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const fixPriceColumn = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Make price column nullable
    await client.query(`
      ALTER TABLE products 
      ALTER COLUMN price DROP NOT NULL;
    `);

    await client.query('COMMIT');
    console.log('✅ Price column is now nullable!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing price column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  fixPriceColumn()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = fixPriceColumn;