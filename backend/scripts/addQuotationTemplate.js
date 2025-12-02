const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const addQuotationTemplates = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create quotation templates table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quotation_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_default BOOLEAN DEFAULT false,
        
        -- Company Information
        company_name VARCHAR(200),
        company_tagline VARCHAR(200),
        company_address TEXT,
        company_phone VARCHAR(50),
        company_email VARCHAR(100),
        company_website VARCHAR(100),
        company_reg_number VARCHAR(100),
        company_vat_number VARCHAR(100),
        logo_url TEXT,
        
        -- Template Design
        primary_color VARCHAR(7) DEFAULT '#8B0000',
        secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
        accent_color VARCHAR(7) DEFAULT '#000000',
        
        -- Sections Visibility
        show_logo BOOLEAN DEFAULT true,
        show_tagline BOOLEAN DEFAULT true,
        show_client_info BOOLEAN DEFAULT true,
        show_description BOOLEAN DEFAULT true,
        show_terms BOOLEAN DEFAULT true,
        show_signature BOOLEAN DEFAULT true,
        
        -- Default Content
        default_terms TEXT,
        default_notes TEXT,
        
        -- VAT Settings
        vat_rate DECIMAL(5, 2) DEFAULT 15.00,
        vat_number VARCHAR(50),
        
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Update quotations table to include template reference
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='quotations' AND column_name='template_id';
    `);

    if (columnCheck.rows.length === 0) {
      await client.query(`
        ALTER TABLE quotations 
        ADD COLUMN template_id INTEGER REFERENCES quotation_templates(id) ON DELETE SET NULL,
        ADD COLUMN description TEXT,
        ADD COLUMN prepared_by VARCHAR(100);
      `);
    }

    // Insert default ScaryByte template
    await client.query(`
      INSERT INTO quotation_templates 
      (name, is_default, company_name, company_tagline, company_address, 
       company_phone, company_email, company_website, company_reg_number, 
       company_vat_number, primary_color, secondary_color, vat_rate,
       default_terms, show_logo, show_tagline, show_client_info, 
       show_description, show_terms, show_signature)
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT DO NOTHING
    `, [
      'ScaryByte Default',
      true,
      'ScaryByte (Pty) Ltd',
      'MILITARY GRADE CYBER SOLUTIONS',
      '165 West Street, Sandton, Johannesburg',
      '+27 (0) 10 006 3999',
      'support@scarybyte.co.za',
      'WWW.SCARYBYTE.CO.ZA',
      '2021/324782/07',
      '4500299245',
      '#8B0000',
      '#FFFFFF',
      15.00,
      'This quotation is not a contract nor a bill. This document serves as an accurate representation of monies due to ScaryByte for services/products that have been provided by ScaryByte. Clients will be billed after ScaryByte has received a signed copy of the quotation which indicates an acceptance of the quotation. Please email all completed documents to support@scarybyte.co.za. All prices are in South African Rands (ZAR).',
      true, true, true, true, true, true
    ]);

    await client.query('COMMIT');
    console.log('✅ Quotation templates table created!');
    console.log('✅ Default ScaryByte template added!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating quotation templates:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

if (require.main === module) {
  addQuotationTemplates()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = addQuotationTemplates;