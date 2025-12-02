const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const updateProductsSchema = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Check if product_type column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='products' AND column_name='product_type';
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ Products schema already updated!');
      await client.query('ROLLBACK');
      return;
    }

    // Add new columns to products table
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN product_type VARCHAR(20) DEFAULT 'item' CHECK (product_type IN ('item', 'service')),
      ADD COLUMN item_type VARCHAR(50),
      ADD COLUMN service_unit VARCHAR(50),
      ADD COLUMN tags TEXT[];
    `);

    // Rename price to rate for clarity (keep both for backward compatibility)
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN rate DECIMAL(10, 2);
    `);

    // Update existing products to have rate = price
    await client.query(`
      UPDATE products SET rate = price WHERE rate IS NULL;
    `);

    // Create tags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        color VARCHAR(7) DEFAULT '#3182ce',
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create service units table
    await client.query(`
      CREATE TABLE IF NOT EXISTS service_units (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        abbreviation VARCHAR(20),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default service units
    const defaultUnits = [
      ['Hour', 'hr'],
      ['Day', 'day'],
      ['Week', 'wk'],
      ['Month', 'mo'],
      ['Resource', 'res'],
      ['Project', 'proj'],
      ['Session', 'sess']
    ];

    for (const [name, abbr] of defaultUnits) {
      await client.query(
        `INSERT INTO service_units (name, abbreviation) 
         VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [name, abbr]
      );
    }

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
      CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
    `);

    await client.query('COMMIT');
    console.log('✅ Products schema updated successfully!');
    console.log('✅ Tags table created!');
    console.log('✅ Service units table created with defaults!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating products schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  updateProductsSchema()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = updateProductsSchema;