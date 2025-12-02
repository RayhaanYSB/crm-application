const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

// Get all quotations
router.get('/', authenticateToken, requirePermission('view_quotations'), async (req, res) => {
  try {
    const { client_id } = req.query;
    
    let query = `
      SELECT q.*, 
             c.name as client_name,
             c.email as client_email,
             c.phone as client_phone,
             c.company as client_company,
             c.address as client_address,
             c.city as client_city,
             c.country as client_country,
             COALESCE(CONCAT(pc.first_name, ' ', pc.last_name), c.name) as primary_contact_name,
             COALESCE(pc.email, c.email) as primary_contact_email,
             COALESCE(pc.phone, c.phone) as primary_contact_phone,
             pc.position as primary_contact_position,
             o.title as opportunity_title,
             u.full_name as created_by_name,
             t.name as template_name
      FROM quotations q 
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN contacts pc ON c.id = pc.client_id AND pc.is_primary = true
      LEFT JOIN opportunities o ON q.opportunity_id = o.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN quotation_templates t ON q.template_id = t.id`;
    
    const params = [];
    
    if (client_id) {
      query += ` WHERE q.client_id = $1`;
      params.push(client_id);
    }
    
    query += ` ORDER BY q.created_at DESC`;
    
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get quotations error:', error);
    res.status(500).json({ error: 'Failed to fetch quotations' });
  }
});

// Get single quotation
router.get('/:id', authenticateToken, requirePermission('view_quotations'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT q.*, 
             c.name as client_name,
             c.email as client_email,
             c.phone as client_phone,
             c.company as client_company,
             c.address as client_address,
             c.city as client_city,
             c.country as client_country,
             COALESCE(CONCAT(pc.first_name, ' ', pc.last_name), c.name) as primary_contact_name,
             COALESCE(pc.email, c.email) as primary_contact_email,
             COALESCE(pc.phone, c.phone) as primary_contact_phone,
             pc.position as primary_contact_position,
             o.title as opportunity_title,
             u.full_name as created_by_name,
             t.name as template_name,
             t.company_name,
             t.company_tagline,
             t.company_address,
             t.company_phone,
             t.company_email,
             t.company_website,
             t.company_reg_number,
             t.company_vat_number,
             t.primary_color,
             t.secondary_color,
             t.accent_color,
             t.show_logo,
             t.show_tagline,
             t.show_client_info,
             t.show_description,
             t.show_terms,
             t.show_signature,
             t.default_terms,
             t.default_notes,
             t.vat_rate,
             t.logo_url
      FROM quotations q 
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN contacts pc ON c.id = pc.client_id AND pc.is_primary = true
      LEFT JOIN opportunities o ON q.opportunity_id = o.id
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN quotation_templates t ON q.template_id = t.id
      WHERE q.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get quotation error:', error);
    res.status(500).json({ error: 'Failed to fetch quotation' });
  }
});

// Generate quote number
const generateQuoteNumber = async () => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  
  const result = await db.query(
    `SELECT quote_number FROM quotations 
     WHERE quote_number LIKE $1 
     ORDER BY quote_number DESC LIMIT 1`,
    [`${year}${month}${day}%`]
  );

  let number = 1;
  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].quote_number.slice(-3);
    number = parseInt(lastNumber) + 1;
  }

  return `${year}${month}${day}${number.toString().padStart(3, '0')}`;
};

// Create quotation
router.post('/', authenticateToken, requirePermission('create_quotations'), async (req, res) => {
  try {
    const { 
      client_id, opportunity_id, template_id, valid_until, items, 
      tax_rate, discount, notes, terms, status, description, prepared_by
    } = req.body;

    if (!client_id) {
      return res.status(400).json({ error: 'Client is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.price || 0);
      return sum + itemTotal;
    }, 0);
    
    const discountAmount = parseFloat(discount || 0);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * parseFloat(tax_rate || 0)) / 100;
    const total = taxableAmount + taxAmount;

    const quoteNumber = await generateQuoteNumber();

    // Get default template if none specified
    let finalTemplateId = template_id;
    if (!finalTemplateId) {
      const defaultTemplate = await db.query(
        'SELECT id FROM quotation_templates WHERE is_default = true LIMIT 1'
      );
      if (defaultTemplate.rows.length > 0) {
        finalTemplateId = defaultTemplate.rows[0].id;
      }
    }

    const result = await db.query(
      `INSERT INTO quotations 
       (quote_number, client_id, opportunity_id, template_id, status, valid_until, 
        subtotal, tax_rate, tax_amount, discount, total, items, notes, terms, 
        description, prepared_by, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
       RETURNING *`,
      [quoteNumber, client_id, opportunity_id, finalTemplateId, status || 'draft', 
       valid_until, subtotal, tax_rate || 0, taxAmount, discountAmount, total, 
       JSON.stringify(items), notes, terms, description, prepared_by, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Failed to create quotation' });
  }
});

// Update quotation
router.put('/:id', authenticateToken, requirePermission('edit_quotations'), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      client_id, opportunity_id, template_id, status, valid_until, items, 
      tax_rate, discount, notes, terms, description, prepared_by
    } = req.body;

    // Recalculate totals
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.price || 0);
      return sum + itemTotal;
    }, 0);
    
    const discountAmount = parseFloat(discount || 0);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * parseFloat(tax_rate || 0)) / 100;
    const total = taxableAmount + taxAmount;

    const result = await db.query(
      `UPDATE quotations 
       SET client_id = $1, opportunity_id = $2, template_id = $3, status = $4, 
           valid_until = $5, subtotal = $6, tax_rate = $7, tax_amount = $8, 
           discount = $9, total = $10, items = $11, notes = $12, terms = $13,
           description = $14, prepared_by = $15, updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 
       RETURNING *`,
      [client_id, opportunity_id, template_id, status, valid_until, subtotal, 
       tax_rate || 0, taxAmount, discountAmount, total, JSON.stringify(items), 
       notes, terms, description, prepared_by, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update quotation error:', error);
    res.status(500).json({ error: 'Failed to update quotation' });
  }
});

// Delete quotation
router.delete('/:id', authenticateToken, requirePermission('delete_quotations'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM quotations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    res.json({ message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Delete quotation error:', error);
    res.status(500).json({ error: 'Failed to delete quotation' });
  }
});

// Generate PDF
router.get('/:id/pdf', authenticateToken, requirePermission('generate_pdf'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get quotation with all details including primary contact
    const result = await db.query(
      `SELECT q.*, 
              c.name as client_name, 
              c.email as client_email, 
              c.phone as client_phone,
              c.company as client_company, 
              c.address as client_address, 
              c.city as client_city, 
              c.country as client_country,
              COALESCE(CONCAT(pc.first_name, ' ', pc.last_name), c.name) as primary_contact_name,
              COALESCE(pc.email, c.email) as primary_contact_email,
              COALESCE(pc.phone, c.phone) as primary_contact_phone,
              pc.position as primary_contact_position,
              u.full_name as created_by_name, 
              u.email as created_by_email,
              t.name as template_name,
              t.company_name,
              t.company_tagline,
              t.company_address,
              t.company_phone,
              t.company_email,
              t.company_website,
              t.company_reg_number,
              t.company_vat_number,
              t.primary_color,
              t.secondary_color,
              t.accent_color,
              t.show_logo,
              t.show_tagline,
              t.show_client_info,
              t.show_description,
              t.show_terms,
              t.show_signature,
              t.default_terms,
              t.default_notes,
              t.vat_rate,
              t.logo_url
       FROM quotations q 
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN contacts pc ON c.id = pc.client_id AND pc.is_primary = true
       LEFT JOIN users u ON q.created_by = u.id
       LEFT JOIN quotation_templates t ON q.template_id = t.id
       WHERE q.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quotation not found' });
    }

    const quotation = result.rows[0];
    
    const pdfDir = path.join(__dirname, '../temp');
    const dataPath = path.join(pdfDir, `quote_${id}_data.json`);
    const pdfPath = path.join(pdfDir, `quote_${id}.pdf`);

    // Create temp directory if it doesn't exist
    await fs.mkdir(pdfDir, { recursive: true });

    // Write quotation data to temp file
    await fs.writeFile(dataPath, JSON.stringify(quotation, null, 2));

    // Call Python script to generate PDF
    const scriptPath = path.join(__dirname, '../scripts/generateQuotationPDF.py');
    // Use 'python' on Windows, 'python3' on Unix
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const { stdout, stderr } = await execPromise(`${pythonCmd} "${scriptPath}" "${dataPath}" "${pdfPath}"`);

    if (stderr) {
      console.error('PDF generation warning:', stderr);
    }

    // Read the generated PDF
    const pdfBuffer = await fs.readFile(pdfPath);

    // Clean up temp files
    await fs.unlink(dataPath);
    await fs.unlink(pdfPath);

    // Generate filename in the specified format
    const rawCompany = quotation.client_company || quotation.client_name || 'NA';
    
    // SANITIZE: Remove characters that break filenames (/ \ : * ? " < > |)
    const safeCompany = rawCompany.replace(/[^a-zA-Z0-9 \-_]/g, '').trim();
    
    const createdDate = new Date(quotation.created_at).toISOString().split('T')[0];
    
    // Ensure the filename is safe
    const filename = `ScaryByte Quotation - Quote_ID = ${quotation.quote_number} - ${safeCompany} - ${createdDate}.pdf`;

    // Send PDF
    res.contentType('application/pdf');
    // IMPORTANT: Use encodeURIComponent for the fallback to handle spaces correctly in all browsers
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;