#!/usr/bin/env python3
"""
PDF Quotation Generator
Generates professional PDF quotations from JSON data
"""

import sys
import json
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.pdfgen import canvas

def create_quotation_pdf(data_path, output_path):
    """Generate a professional quotation PDF"""
    
    # Load quotation data
    with open(data_path, 'r') as f:
        data = json.load(f)
    
    # Create PDF
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=0.75*inch,
        leftMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a365d'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2d3748'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4a5568')
    )
    
    # Title
    title = Paragraph("QUOTATION", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2*inch))
    
    # Company and Client Info (side by side)
    info_data = [
        [
            Paragraph("<b>From:</b>", heading_style),
            Paragraph("<b>To:</b>", heading_style)
        ],
        [
            Paragraph(f"{data.get('created_by_name', 'N/A')}<br/>{data.get('created_by_email', '')}", normal_style),
            Paragraph(f"<b>{data.get('client_name', 'N/A')}</b><br/>{data.get('client_company', '')}<br/>{data.get('client_email', '')}<br/>{data.get('client_phone', '')}<br/>{data.get('client_address', '')}", normal_style)
        ]
    ]
    
    info_table = Table(info_data, colWidths=[3.25*inch, 3.25*inch])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Quote Details
    quote_details = [
        [
            Paragraph(f"<b>Quote Number:</b> {data.get('quote_number', 'N/A')}", normal_style),
            Paragraph(f"<b>Date:</b> {datetime.fromisoformat(data.get('created_at', '')).strftime('%B %d, %Y') if data.get('created_at') else 'N/A'}", normal_style)
        ],
        [
            Paragraph(f"<b>Status:</b> {data.get('status', 'N/A').upper()}", normal_style),
            Paragraph(f"<b>Valid Until:</b> {datetime.fromisoformat(data.get('valid_until', '')).strftime('%B %d, %Y') if data.get('valid_until') else 'N/A'}", normal_style)
        ]
    ]
    
    details_table = Table(quote_details, colWidths=[3.25*inch, 3.25*inch])
    details_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f7fafc')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    elements.append(details_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # Items Table
    elements.append(Paragraph("Items", heading_style))
    
    # Table headers
    items_data = [[
        Paragraph("<b>Description</b>", normal_style),
        Paragraph("<b>Quantity</b>", normal_style),
        Paragraph("<b>Unit Price</b>", normal_style),
        Paragraph("<b>Total</b>", normal_style)
    ]]
    
    # Add items
    items = json.loads(data.get('items', '[]')) if isinstance(data.get('items'), str) else data.get('items', [])
    for item in items:
        items_data.append([
            Paragraph(f"{item.get('name', 'N/A')}<br/><i>{item.get('description', '')}</i>", normal_style),
            Paragraph(str(item.get('quantity', 0)), normal_style),
            Paragraph(f"${float(item.get('price', 0)):.2f}", normal_style),
            Paragraph(f"${float(item.get('quantity', 0)) * float(item.get('price', 0)):.2f}", normal_style)
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.25*inch, 1.25*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d3748')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Totals
    subtotal = float(data.get('subtotal', 0))
    discount = float(data.get('discount', 0))
    tax_rate = float(data.get('tax_rate', 0))
    tax_amount = float(data.get('tax_amount', 0))
    total = float(data.get('total', 0))
    
    totals_data = [
        ['', '', Paragraph('<b>Subtotal:</b>', normal_style), Paragraph(f'${subtotal:.2f}', normal_style)],
    ]
    
    if discount > 0:
        totals_data.append(['', '', Paragraph('<b>Discount:</b>', normal_style), Paragraph(f'-${discount:.2f}', normal_style)])
    
    if tax_rate > 0:
        totals_data.append(['', '', Paragraph(f'<b>Tax ({tax_rate}%):</b>', normal_style), Paragraph(f'${tax_amount:.2f}', normal_style)])
    
    totals_data.append(['', '', Paragraph('<b>TOTAL:</b>', heading_style), Paragraph(f'<b>${total:.2f}</b>', heading_style)])
    
    totals_table = Table(totals_data, colWidths=[3*inch, 1*inch, 1.25*inch, 1.25*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('LINEABOVE', (2, -1), (-1, -1), 2, colors.HexColor('#2d3748')),
        ('BACKGROUND', (2, -1), (-1, -1), colors.HexColor('#f7fafc')),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    
    # Notes
    if data.get('notes'):
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph("Notes", heading_style))
        elements.append(Paragraph(data.get('notes', ''), normal_style))
    
    # Terms
    if data.get('terms'):
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph("Terms & Conditions", heading_style))
        elements.append(Paragraph(data.get('terms', ''), normal_style))
    
    # Build PDF
    doc.build(elements)
    print(f"PDF generated successfully: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 generatePDF.py <data_json_path> <output_pdf_path>")
        sys.exit(1)
    
    data_path = sys.argv[1]
    output_path = sys.argv[2]
    
    try:
        create_quotation_pdf(data_path, output_path)
    except Exception as e:
        print(f"Error generating PDF: {str(e)}", file=sys.stderr)
        sys.exit(1)
