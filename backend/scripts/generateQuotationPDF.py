#!/usr/bin/env python3
import sys
import json
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def register_custom_fonts():
    """
    Attempts to register Oswald-Regular and Oswald-Bold.
    Falls back to Helvetica if files are not found.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    font_dirs = [
        os.path.join(script_dir, '..', 'fonts'),
        os.path.join(script_dir, 'fonts'),
        os.path.join(script_dir, 'assets', 'fonts'),
    ]
    
    regular_font_path = None
    bold_font_path = None
    
    for d in font_dirs:
        r_path = os.path.join(d, 'Oswald-Regular.ttf')
        b_path = os.path.join(d, 'Oswald-Bold.ttf')
        if os.path.exists(r_path) and os.path.exists(b_path):
            regular_font_path = r_path
            bold_font_path = b_path
            break
            
    try:
        if regular_font_path and bold_font_path:
            pdfmetrics.registerFont(TTFont('Oswald', regular_font_path))
            pdfmetrics.registerFont(TTFont('Oswald-Bold', bold_font_path))
            return 'Oswald', 'Oswald-Bold'
        else:
            pdfmetrics.registerFont(pdfmetrics.getFont('Helvetica'))
            pdfmetrics.registerFont(pdfmetrics.getFont('Helvetica-Bold'))
            return 'Helvetica', 'Helvetica-Bold'
    except Exception:
        return 'Helvetica', 'Helvetica-Bold'

def create_quotation_pdf(data_path, output_path):
    # --- 1. LOAD DATA ---
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON data: {e}")
        sys.exit(1)
    
    items = data.get('items', [])
    if isinstance(items, str):
        try:
            items = json.loads(items)
        except:
            items = []

    # --- 2. SETUP GLOBALS & ASSETS ---
    font_reg, font_bold = register_custom_fonts()
    
    # Colors
    primary_color = colors.HexColor('#8B0000')
    text_dark = colors.HexColor('#212121')
    text_light = colors.HexColor('#757575')
    header_bg_grey = colors.HexColor('#CCCCCC') 

    # Header/Footer Vars
    address = data.get('company_address', '165 West Street, Sandton, Johannesburg')
    phone = data.get('company_phone', '+27 (0) 10 006 3999')
    email = data.get('company_email', 'support@scarybyte.co.za')
    company_name = data.get('company_name', 'ScaryByte (Pty) Ltd')
    tagline = data.get('company_tagline', 'MILITARY GRADE CYBER SOLUTIONS')
    website = data.get('company_website', 'www.scarybyte.co.za')
    reg_num = data.get('company_reg_number', '2021/324782/07')
    vat_num = data.get('company_vat_number', '4500299245')

    # Logo Logic
    logo_path = None
    script_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        os.path.join(script_dir, '..', 'logos', 'scarybyte-logo.png'),
        os.path.join(script_dir, 'logos', 'scarybyte-logo.png'),
        os.path.join(script_dir, 'scarybyte-logo.png'), 
    ]
    for path in possible_paths:
        if os.path.exists(path):
            logo_path = path
            break
    
    # --- 3. DEFINE HEADER & FOOTER CANVAS FUNCTION ---
    def draw_header_footer(canvas, doc):
        canvas.saveState()
        side_margin = 15*mm
        page_width = A4[0]
        
        # --- HEADER LAYOUT ---
        top_y = A4[1] - 10*mm 
        
        # 1. LOGO (Top Left)
        logo_width = 80*mm
        logo_height = 25*mm
        logo_y = top_y - logo_height
        
        if logo_path:
            try:
                canvas.drawImage(logo_path, side_margin, logo_y, width=logo_width, height=logo_height, preserveAspectRatio=True, mask='auto')
            except Exception:
                pass
        
        # 2. SLOGAN (Left - Under Logo)
        # UPDATED: Larger font size (11) and Black color
        canvas.setFont(font_reg, 11) 
        canvas.setFillColor(colors.black)
        slogan_y = logo_y - 5*mm # Slightly more space for larger font
        canvas.drawString(side_margin, slogan_y, tagline)

        # 3. HEADER TABLE (Top Right)
        created_date = datetime.fromisoformat(data.get('created_at', datetime.now().isoformat()).replace('Z', '+00:00')).strftime('%d/%m/%Y')
        valid_date_str = data.get('valid_until')
        if valid_date_str:
            try:
                valid_date = datetime.fromisoformat(valid_date_str.replace('Z', '+00:00')).strftime('%d/%m/%Y')
            except:
                valid_date = valid_date_str[:10]
        else:
            valid_date = "N/A"

        header_info_data = [
            ['QUOTE ID', 'DATE'],
            [data.get('quote_number', '0000'), created_date],
            ['VALID UNTIL', 'PREPARED BY'],
            [valid_date, data.get('prepared_by', 'R.Younuss')]
        ]

        t_header_info = Table(header_info_data, colWidths=[35*mm, 35*mm])
        t_header_info.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), font_reg),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BACKGROUND', (0,0), (-1,0), header_bg_grey),
            ('FONTNAME', (0,0), (-1,0), font_bold),
            ('TEXTCOLOR', (0,0), (-1,0), colors.black),
            ('BACKGROUND', (0,1), (-1,1), colors.white),
            ('TEXTCOLOR', (0,1), (-1,1), text_light),
            ('BACKGROUND', (0,2), (-1,2), header_bg_grey),
            ('FONTNAME', (0,2), (-1,2), font_bold),
            ('TEXTCOLOR', (0,2), (-1,2), colors.black),
            ('BACKGROUND', (0,3), (-1,3), colors.white),
            ('TEXTCOLOR', (0,3), (-1,3), text_light),
            ('GRID', (0,0), (-1,-1), 0.5, colors.black),
            ('BOX', (0,0), (-1,-1), 0.5, colors.black),
            ('TOPPADDING', (0,0), (-1,-1), 3), 
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ]))
        
        w_hi, h_hi = t_header_info.wrap(80*mm, 40*mm)
        t_header_info.drawOn(canvas, page_width - side_margin - w_hi, top_y - h_hi)

        # 4. ADDRESS LINE (Centered)
        styles = getSampleStyleSheet()
        contact_style = ParagraphStyle('Contact', parent=styles['Normal'], 
                                     fontName=font_reg, fontSize=9, leading=11, 
                                     alignment=TA_CENTER, textColor=text_dark)
        
        contact_text = f"<b>{company_name}</b> | {address} | <b>Tel:</b> {phone} | <b>Email:</b> {email}"
        p_contact = Paragraph(contact_text, contact_style)
        w_c, h_c = p_contact.wrap(page_width - 2*side_margin, 15*mm)
        
        lowest_y = min(slogan_y, top_y - h_hi)
        contact_y = lowest_y - h_c - 3*mm
        p_contact.drawOn(canvas, side_margin, contact_y)

        # --- 5. QUOTATION STRIP ---
        block_height = 15*mm 
        strip_y = contact_y - 2*mm - block_height

        title_style = ParagraphStyle('QTitle', parent=styles['Heading1'], 
                                   fontName=font_bold, fontSize=24, 
                                   textColor=text_dark, alignment=TA_LEFT)
        p_title = Paragraph("QUOTATION", title_style)

        reg_data = [
            ["Company Registration", ":", reg_num],
            ["VAT Registration", ":", vat_num]
        ]
        t_reg = Table(reg_data, colWidths=[40*mm, 5*mm, 35*mm])
        t_reg.setStyle(TableStyle([
            ('FONTNAME', (0,0), (-1,-1), font_reg),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('TEXTCOLOR', (0,0), (-1,-1), text_light),
            ('ALIGN', (0,0), (0,-1), 'LEFT'),
            ('ALIGN', (1,0), (1,-1), 'CENTER'),
            ('ALIGN', (2,0), (2,-1), 'RIGHT'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))

        strip_data = [[p_title, t_reg]]
        t_strip = Table(strip_data, colWidths=[100*mm, 80*mm])
        t_strip.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (0,0), (0,0), 'LEFT'),
            ('ALIGN', (1,0), (1,0), 'RIGHT'),
            ('LINEABOVE', (0,0), (-1,0), 1, colors.grey),
            ('LINEBELOW', (0,0), (-1,0), 1, colors.grey),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))

        t_strip.wrapOn(canvas, page_width - 2*side_margin, block_height)
        t_strip.drawOn(canvas, side_margin, strip_y)

        # --- FOOTER ---
        canvas.setStrokeColor(colors.lightgrey)
        canvas.setLineWidth(0.5)
        canvas.line(side_margin, 20*mm, page_width - side_margin, 20*mm)
        
        canvas.setFont(font_reg, 8)
        canvas.setFillColor(text_light)
        canvas.drawString(side_margin, 15*mm, company_name)
        canvas.drawRightString(page_width - side_margin, 15*mm, website.lower())
        canvas.restoreState()

    # --- 4. BUILD CONTENT ---

    # Create PDF title in specified format
    quote_id = data.get('quote_number', '0000')
    client_company = data.get('client_company') or data.get('client_name', 'N/A')
    created_date = datetime.fromisoformat(data.get('created_at', datetime.now().isoformat()).replace('Z', '+00:00')).strftime('%d-%m-%Y')
    pdf_title = f"ScaryByte Quotation - Quote ID_{quote_id} - {client_company} - {created_date}"
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=68*mm, 
        bottomMargin=15*mm,
        title=pdf_title
    )
    
    elements = []
    styles = getSampleStyleSheet()
    
    normal_style = ParagraphStyle('NormalCustom', parent=styles['Normal'], fontName=font_reg, fontSize=9, leading=12)
    header_style = ParagraphStyle('HeaderCustom', parent=styles['Heading3'], fontName=font_bold, fontSize=11, textColor=primary_color, spaceAfter=5, spaceBefore=10)
    total_width = A4[0] - 30*mm

    # 1. Client Information
    # Use primary contact if available, otherwise fall back to client info
    primary_contact_name = data.get('primary_contact_name') or data.get('client_name', 'N/A')
    primary_contact_email = data.get('primary_contact_email') or data.get('client_email', 'N/A')
    primary_contact_phone = data.get('primary_contact_phone') or data.get('client_phone', 'N/A')
    primary_contact_position = data.get('primary_contact_position', '')

    # Format contact person with position if available
    contact_person_display = primary_contact_name
    if primary_contact_position and primary_contact_position != 'N/A':
        contact_person_display = f"{primary_contact_name} [{primary_contact_position}]"

    client_info_data = [
        ["CLIENT INFORMATION", ""], # Header row
        ["Organization:", data.get('client_company') or data.get('client_name', 'N/A')],
        ["Contact Person:", contact_person_display],
        ["Phone:", primary_contact_phone],
        ["Physical Address:", data.get('client_address', 'N/A')],
        ["Email:", primary_contact_email]
    ]
        
    c_table = Table(client_info_data, colWidths=[total_width*0.25, total_width*0.75])
    c_table.setStyle(TableStyle([
        # Header Style
        ('SPAN', (0,0), (1,0)), 
        ('BACKGROUND', (0,0), (1,0), primary_color),
        ('TEXTCOLOR', (0,0), (1,0), colors.white),
        ('FONTNAME', (0,0), (1,0), font_bold),
        ('ALIGN', (0,0), (1,0), 'LEFT'),
        ('TOPPADDING', (0,0), (-1,0), 8), 
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        # Content Style
        ('FONTNAME', (0,1), (-1,-1), font_reg),
        ('TEXTCOLOR', (0,1), (-1,-1), text_dark),
        ('FONTNAME', (0,1), (0,-1), font_bold), 
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('BOTTOMPADDING', (0,1), (-1,-1), 8),
        ('TOPPADDING', (0,1), (-1,-1), 8),
    ]))
    elements.append(c_table)
    elements.append(Spacer(1, 8*mm))
    
    # 2. Description
    if data.get('show_description', True) and data.get('description'):
        desc_data = [
            ["DESCRIPTION OF SERVICES"],
            [Paragraph(data['description'], normal_style)]
        ]
        t_desc = Table(desc_data, colWidths=[total_width])
        t_desc.setStyle(TableStyle([
            # Header Style
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), font_bold),
            ('ALIGN', (0,0), (-1,0), 'LEFT'),
            ('TOPPADDING', (0,0), (-1,0), 8), 
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            # Content Style
            ('VALIGN', (0,1), (-1,-1), 'TOP'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
            ('TOPPADDING', (0,1), (-1,-1), 8),
            ('BOTTOMPADDING', (0,1), (-1,-1), 8),
        ]))
        elements.append(t_desc)
        elements.append(Spacer(1, 8*mm))
        
    # 3. Items
    item_data = [
        ["ITEMIZED COSTS", "", "", ""], # Title Row
        ["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"] # Column Headers
    ]
    
    for item in items:
        name = item.get('name', 'Item')
        desc = item.get('description', '')
        qty = float(item.get('quantity', 0))
        price = float(item.get('price', 0))
        total_line = qty * price
        
        desc_txt = f"<font fontName='{font_bold}'>{name}</font>"
        if desc:
            desc_txt += f"<br/><font fontName='{font_reg}' color='grey' size=8>{desc}</font>"
            
        item_data.append([
            Paragraph(desc_txt, normal_style),
            f"{qty:g}",
            f"R {price:,.2f}",
            f"R {total_line:,.2f}"
        ])

    w_d, w_q, w_p, w_a = total_width*0.45, total_width*0.15, total_width*0.20, total_width*0.20
    t_items = Table(item_data, colWidths=[w_d, w_q, w_p, w_a])
    t_items.setStyle(TableStyle([
        # -- Title Row --
        ('SPAN', (0,0), (-1,0)),
        ('BACKGROUND', (0,0), (-1,0), colors.black), # Changed to BLACK
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), font_bold),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('TOPPADDING', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        
        # -- Column Headers --
        ('BACKGROUND', (0,1), (-1,1), primary_color),
        ('TEXTCOLOR', (0,1), (-1,1), colors.white),
        ('FONTNAME', (0,1), (-1,1), font_bold),
        ('ALIGN', (1,1), (-1,1), 'RIGHT'), 
        ('ALIGN', (0,1), (0,1), 'LEFT'),
        ('TOPPADDING', (0,1), (-1,1), 8),
        ('BOTTOMPADDING', (0,1), (-1,1), 8),
        
        # -- Data --
        ('FONTNAME', (0,2), (-1,-1), font_reg),
        ('FONTNAME', (0,2), (0,-1), font_bold), 
        ('ALIGN', (1,2), (-1,-1), 'RIGHT'),
        ('ALIGN', (0,2), (0,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('TOPPADDING', (0,2), (-1,-1), 8),
        ('BOTTOMPADDING', (0,2), (-1,-1), 8),
    ]))
    elements.append(t_items)
    
    # 4. Totals
    subtotal = float(data.get('subtotal', 0))
    tax = float(data.get('tax_amount', 0))
    total = float(data.get('total', 0))
    
    total_data = [
        ["Subtotal (Excl. VAT):", f"R {subtotal:,.2f}"],
        ["VAT (15%):", f"R {tax:,.2f}"],
        ["TOTAL (Incl. VAT):", f"R {total:,.2f}"]
    ]
    
    t_total = Table(total_data, colWidths=[total_width - w_a, w_a])
    t_total.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,-1), font_bold),
        ('TEXTCOLOR', (-1,-1), (-1,-1), primary_color),
        ('LINEABOVE', (0,-1), (-1,-1), 1, primary_color),
        ('TOPPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_total)
    
    # ==================== PAGE 2 ====================
    elements.append(PageBreak())
    elements.append(Spacer(1, 1*mm))
    
    accept_style = ParagraphStyle('AcceptTitle', parent=styles['Heading1'], fontName=font_bold, fontSize=18, textColor=primary_color, alignment=TA_CENTER, spaceAfter=10)
    elements.append(Paragraph("CUSTOMER ACCEPTANCE", accept_style))
    
    # Terms & Conditions Section
    terms_title_style = ParagraphStyle('TermsTitle', parent=styles['Heading2'], fontName=font_bold, fontSize=12, textColor=colors.white, alignment=TA_LEFT, spaceAfter=8)
    terms_item_style = ParagraphStyle('TermsItem', parent=styles['Normal'], fontName=font_reg, fontSize=6, leading=8, leftIndent=0, spaceBefore=2)
    
    terms_conditions = [
        ("Inclusive of VAT", "All prices quoted include a 15% Value Added Tax (VAT)."),
        ("Validity of Quotation", "This quotation is valid for 7 (seven) working days from the date of issue, unless otherwise specified in writing by ScaryByte."),
        ("Payment Terms", "Payment is due within 1 (one) working week / 7 (seven) working days from the date of invoice following acceptance of this quotation."),
        ("Currency", "All amounts quoted are in South African Rand (ZAR)."),
        ("Acceptance of Quotation", "Acceptance of this quotation constitutes agreement to ScaryByte's standard invoicing terms and conditions, including payment terms, ownership terms, and surcharge conditions."),
        ("Late Payment", "In the event of late or overdue payment, the customer agrees to cover all costs reasonably incurred by ScaryByte, including any applicable and approved additional fees."),
        ("Credit Authorisation", "Any credit notes, discounts, or adjustments remain subject to the approval and discretion of ScaryByte's management team."),
        ("Ownership of Goods", "All goods and deliverables remain the property of ScaryByte until full and final payment has been made."),
        ("Overdue Payments & Surcharges", "Payments not received within 15 (fifteen) days from the invoice date will be deemed overdue. ScaryByte reserves the right to suspend or terminate services or apply a surcharge calculated at an interest rate of 2% for every 10 (ten) days of delayed payment."),
        ("Amendments", "ScaryByte reserves the right to revise or update these terms and conditions at any time. Any changes affecting an already accepted quotation will be communicated in writing.")
    ]
    
    # Create Terms & Conditions table
    tc_data = [["Terms & Conditions (Applicable to This Quotation)"]]
    
    for idx, (title, content) in enumerate(terms_conditions, 1):
        term_text = f"<b>{idx}. {title}</b><br/>{content}"
        tc_data.append([Paragraph(term_text, terms_item_style)])
    
    t_terms = Table(tc_data, colWidths=[total_width])
    t_terms.setStyle(TableStyle([
        # Header Style
        ('BACKGROUND', (0,0), (-1,0), colors.black),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), font_bold),
        ('FONTSIZE', (0,0), (-1,0), 11),
        ('ALIGN', (0,0), (-1,0), 'LEFT'),
        ('TOPPADDING', (0,0), (-1,0), 6),
        ('BOTTOMPADDING', (0,0), (-1,0), 6),
        # Content Style
        ('VALIGN', (0,1), (-1,-1), 'TOP'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.lightgrey),
        ('TOPPADDING', (0,1), (-1,-1), 6),
        ('BOTTOMPADDING', (0,1), (-1,-1), 6),
        ('LEFTPADDING', (0,1), (-1,-1), 8),
        ('RIGHTPADDING', (0,1), (-1,-1), 8),
    ]))
    elements.append(t_terms)
    elements.append(Spacer(1, 10*mm))
    
    sig_data = [
        ["SIGNED AT: _______________________", "DATE: ______________________________"],
        ["", ""],
        ["FULL NAME: _______________________", "DESIGNATION: _______________________"],
        ["", ""],
        ["SIGNATURE: _______________________", "STAMP:"] 
    ]
    
    t_sig = Table(sig_data, colWidths=[total_width/2, total_width/2])
    t_sig.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), font_bold),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t_sig)
    elements.append(Spacer(1, 20*mm))
    
    
    # Build
    doc.build(elements, onFirstPage=draw_header_footer, onLaterPages=draw_header_footer)
    print(f"PDF generated successfully: {output_path}")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python generateQuotationPDF.py <data_json> <output_pdf>")
        sys.exit(1)
    
    create_quotation_pdf(sys.argv[1], sys.argv[2])