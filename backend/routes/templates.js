const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Get all templates
router.get('/', authenticateToken, requirePermission('view_quotations'), async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM quotation_templates ORDER BY is_default DESC, name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', authenticateToken, requirePermission('view_quotations'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM quotation_templates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create template
router.post('/', authenticateToken, requirePermission('create_quotations'), async (req, res) => {
  try {
    const {
      name, is_default, company_name, company_tagline, company_address,
      company_phone, company_email, company_website, company_reg_number,
      company_vat_number, logo_url, primary_color, secondary_color,
      accent_color, show_logo, show_tagline, show_client_info,
      show_description, show_terms, show_signature, default_terms,
      default_notes, vat_rate
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query('UPDATE quotation_templates SET is_default = false');
    }

    const result = await db.query(
      `INSERT INTO quotation_templates 
       (name, is_default, company_name, company_tagline, company_address,
        company_phone, company_email, company_website, company_reg_number,
        company_vat_number, logo_url, primary_color, secondary_color,
        accent_color, show_logo, show_tagline, show_client_info,
        show_description, show_terms, show_signature, default_terms,
        default_notes, vat_rate, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
               $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
       RETURNING *`,
      [name, is_default || false, company_name, company_tagline, company_address,
       company_phone, company_email, company_website, company_reg_number,
       company_vat_number, logo_url, primary_color || '#8B0000',
       secondary_color || '#FFFFFF', accent_color || '#000000',
       show_logo !== false, show_tagline !== false, show_client_info !== false,
       show_description !== false, show_terms !== false, show_signature !== false,
       default_terms, default_notes, vat_rate || 15.00, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', authenticateToken, requirePermission('edit_quotations'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, is_default, company_name, company_tagline, company_address,
      company_phone, company_email, company_website, company_reg_number,
      company_vat_number, logo_url, primary_color, secondary_color,
      accent_color, show_logo, show_tagline, show_client_info,
      show_description, show_terms, show_signature, default_terms,
      default_notes, vat_rate
    } = req.body;

    // If setting as default, unset other defaults
    if (is_default) {
      await db.query('UPDATE quotation_templates SET is_default = false WHERE id != $1', [id]);
    }

    const result = await db.query(
      `UPDATE quotation_templates 
       SET name = $1, is_default = $2, company_name = $3, company_tagline = $4,
           company_address = $5, company_phone = $6, company_email = $7,
           company_website = $8, company_reg_number = $9, company_vat_number = $10,
           logo_url = $11, primary_color = $12, secondary_color = $13,
           accent_color = $14, show_logo = $15, show_tagline = $16,
           show_client_info = $17, show_description = $18, show_terms = $19,
           show_signature = $20, default_terms = $21, default_notes = $22,
           vat_rate = $23, updated_at = CURRENT_TIMESTAMP
       WHERE id = $24
       RETURNING *`,
      [name, is_default, company_name, company_tagline, company_address,
       company_phone, company_email, company_website, company_reg_number,
       company_vat_number, logo_url, primary_color, secondary_color,
       accent_color, show_logo, show_tagline, show_client_info,
       show_description, show_terms, show_signature, default_terms,
       default_notes, vat_rate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', authenticateToken, requirePermission('delete_quotations'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Don't allow deleting the default template
    const checkDefault = await db.query(
      'SELECT is_default FROM quotation_templates WHERE id = $1',
      [id]
    );

    if (checkDefault.rows.length > 0 && checkDefault.rows[0].is_default) {
      return res.status(400).json({ error: 'Cannot delete the default template' });
    }

    const result = await db.query(
      'DELETE FROM quotation_templates WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

module.exports = router;