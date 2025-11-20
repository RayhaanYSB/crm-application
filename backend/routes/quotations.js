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
             o.title as opportunity_title,
             u.full_name as created_by_name
      FROM quotations q 
      LEFT JOIN clients c ON q.client_id = c.id
      LEFT JOIN opportunities o ON q.opportunity_id = o.id
      LEFT JOIN users u ON q.created_by = u.id`;
    
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
    const result = await db.query(
      `SELECT q.*, 
              c.name as client_name, c.email as client_email, c.phone as client_phone,
              c.company as client_company, c.address as client_address,
              o.title as opportunity_title,
              u.full_name as created_by_name
       FROM quotations q 
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN opportunities o ON q.opportunity_id = o.id
       LEFT JOIN users u ON q.created_by = u.id 
       WHERE q.id = $1`,
      [id]
    );

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
  const result = await db.query(
    `SELECT quote_number FROM quotations 
     WHERE quote_number LIKE $1 
     ORDER BY quote_number DESC LIMIT 1`,
    [`QT-${year}-%`]
  );

  let number = 1;
  if (result.rows.length > 0) {
    const lastNumber = result.rows[0].quote_number.split('-')[2];
    number = parseInt(lastNumber) + 1;
  }

  return `QT-${year}-${number.toString().padStart(4, '0')}`;
};

// Create quotation
router.post('/', authenticateToken, requirePermission('create_quotations'), async (req, res) => {
  try {
    const { 
      client_id, opportunity_id, valid_until, items, 
      tax_rate, discount, notes, terms, status 
    } = req.body;

    if (!client_id || !items || items.length === 0) {
      return res.status(400).json({ error: 'Client and items are required' });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const discountAmount = discount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (tax_rate || 0)) / 100;
    const total = taxableAmount + taxAmount;

    const quoteNumber = await generateQuoteNumber();

    const result = await db.query(
      `INSERT INTO quotations 
       (quote_number, client_id, opportunity_id, status, valid_until, subtotal, 
        tax_rate, tax_amount, discount, total, items, notes, terms, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING *`,
      [quoteNumber, client_id, opportunity_id, status || 'draft', valid_until, 
       subtotal, tax_rate || 0, taxAmount, discountAmount, total, 
       JSON.stringify(items), notes, terms, req.user.id]
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
      client_id, opportunity_id, status, valid_until, items, 
      tax_rate, discount, notes, terms 
    } = req.body;

    // Recalculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const discountAmount = discount || 0;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * (tax_rate || 0)) / 100;
    const total = taxableAmount + taxAmount;

    const result = await db.query(
      `UPDATE quotations 
       SET client_id = $1, opportunity_id = $2, status = $3, valid_until = $4, 
           subtotal = $5, tax_rate = $6, tax_amount = $7, discount = $8, total = $9, 
           items = $10, notes = $11, terms = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13 
       RETURNING *`,
      [client_id, opportunity_id, status, valid_until, subtotal, tax_rate || 0, 
       taxAmount, discountAmount, total, JSON.stringify(items), notes, terms, id]
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
    
    // Get quotation with all details
    const result = await db.query(
      `SELECT q.*, 
              c.name as client_name, c.email as client_email, c.phone as client_phone,
              c.company as client_company, c.address as client_address, 
              c.city as client_city, c.country as client_country,
              u.full_name as created_by_name, u.email as created_by_email
       FROM quotations q 
       LEFT JOIN clients c ON q.client_id = c.id
       LEFT JOIN users u ON q.created_by = u.id 
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
    const scriptPath = path.join(__dirname, '../scripts/generatePDF.py');
    const { stdout, stderr } = await execPromise(`python3 ${scriptPath} ${dataPath} ${pdfPath}`);

    if (stderr) {
      console.error('PDF generation warning:', stderr);
    }

    // Read the generated PDF
    const pdfBuffer = await fs.readFile(pdfPath);

    // Clean up temp files
    await fs.unlink(dataPath);
    await fs.unlink(pdfPath);

    // Send PDF
    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${quotation.quote_number}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

module.exports = router;
