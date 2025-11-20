const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'crm_db',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Drop existing tables (for development)
    await client.query(`
      DROP TABLE IF EXISTS quotations CASCADE;
      DROP TABLE IF EXISTS opportunities CASCADE;
      DROP TABLE IF EXISTS leads CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS user_permissions CASCADE;
      DROP TABLE IF EXISTS permissions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Permissions table
    await client.query(`
      CREATE TABLE permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // User permissions (many-to-many)
    await client.query(`
      CREATE TABLE user_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
        granted_by INTEGER REFERENCES users(id),
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, permission_id)
      );
    `);

    // Clients table
    await client.query(`
      CREATE TABLE clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        company VARCHAR(100),
        address TEXT,
        city VARCHAR(50),
        country VARCHAR(50),
        tax_number VARCHAR(50),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Products table
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        sku VARCHAR(50) UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        cost DECIMAL(10, 2),
        category VARCHAR(50),
        unit VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Leads table
    await client.query(`
      CREATE TABLE leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        company VARCHAR(100),
        source VARCHAR(50),
        status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'lost', 'converted')),
        assigned_to INTEGER REFERENCES users(id),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Opportunities table
    await client.query(`
      CREATE TABLE opportunities (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        client_id INTEGER REFERENCES clients(id),
        lead_id INTEGER REFERENCES leads(id),
        value DECIMAL(10, 2),
        stage VARCHAR(20) DEFAULT 'prospecting' CHECK (stage IN ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
        probability INTEGER CHECK (probability >= 0 AND probability <= 100),
        expected_close_date DATE,
        assigned_to INTEGER REFERENCES users(id),
        notes TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Quotations table
    await client.query(`
      CREATE TABLE quotations (
        id SERIAL PRIMARY KEY,
        quote_number VARCHAR(50) UNIQUE NOT NULL,
        client_id INTEGER REFERENCES clients(id),
        opportunity_id INTEGER REFERENCES opportunities(id),
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
        valid_until DATE,
        subtotal DECIMAL(10, 2) NOT NULL,
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        discount DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL,
        items JSONB NOT NULL,
        notes TEXT,
        terms TEXT,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default permissions
    const permissionsData = [
      ['view_clients', 'View clients list and details', 'clients'],
      ['create_clients', 'Create new clients', 'clients'],
      ['edit_clients', 'Edit existing clients', 'clients'],
      ['delete_clients', 'Delete clients', 'clients'],
      
      ['view_products', 'View products list and details', 'products'],
      ['create_products', 'Create new products', 'products'],
      ['edit_products', 'Edit existing products', 'products'],
      ['delete_products', 'Delete products', 'products'],
      
      ['view_leads', 'View leads list and details', 'leads'],
      ['create_leads', 'Create new leads', 'leads'],
      ['edit_leads', 'Edit existing leads', 'leads'],
      ['delete_leads', 'Delete leads', 'leads'],
      
      ['view_opportunities', 'View opportunities list and details', 'opportunities'],
      ['create_opportunities', 'Create new opportunities', 'opportunities'],
      ['edit_opportunities', 'Edit existing opportunities', 'opportunities'],
      ['delete_opportunities', 'Delete opportunities', 'opportunities'],
      
      ['view_quotations', 'View quotations list and details', 'quotations'],
      ['create_quotations', 'Create new quotations', 'quotations'],
      ['edit_quotations', 'Edit existing quotations', 'quotations'],
      ['delete_quotations', 'Delete quotations', 'quotations'],
      ['generate_pdf', 'Generate PDF quotations', 'quotations'],
      
      ['manage_users', 'Manage user accounts', 'admin'],
      ['manage_permissions', 'Manage user permissions', 'admin'],
      ['view_reports', 'View analytics and reports', 'admin'],
    ];

    for (const [name, description, category] of permissionsData) {
      await client.query(
        'INSERT INTO permissions (name, description, category) VALUES ($1, $2, $3)',
        [name, description, category]
      );
    }

    // Create default admin user (password: admin123)
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const adminResult = await client.query(
      `INSERT INTO users (username, email, password, full_name, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['admin', 'admin@crm.com', adminPassword, 'System Administrator', 'admin']
    );

    // Grant all permissions to admin
    const permissionsResult = await client.query('SELECT id FROM permissions');
    for (const perm of permissionsResult.rows) {
      await client.query(
        'INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES ($1, $2, $3)',
        [adminResult.rows[0].id, perm.id, adminResult.rows[0].id]
      );
    }

    // Create default standard user (password: user123)
    const userPassword = await bcrypt.hash('user123', 10);
    const userResult = await client.query(
      `INSERT INTO users (username, email, password, full_name, role) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      ['user', 'user@crm.com', userPassword, 'Standard User', 'user']
    );

    // Grant basic permissions to standard user
    const basicPermissions = [
      'view_clients', 'view_products', 'view_leads', 'view_opportunities', 'view_quotations'
    ];
    
    for (const permName of basicPermissions) {
      const permResult = await client.query('SELECT id FROM permissions WHERE name = $1', [permName]);
      if (permResult.rows.length > 0) {
        await client.query(
          'INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES ($1, $2, $3)',
          [userResult.rows[0].id, permResult.rows[0].id, adminResult.rows[0].id]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✅ Database initialized successfully!');
    console.log('📝 Default admin user: admin / admin123');
    console.log('📝 Default standard user: user / user123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = initDatabase;
