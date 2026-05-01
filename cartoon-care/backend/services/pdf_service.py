"""
pdf_service.py — Builds a beautiful PDF storybook with optimized file size
Each story page gets its OWN PDF page: image on top, text below.
Clean, symmetric, professional children's book layout.
Images are compressed to reduce PDF size from ~10MB to ~1-2MB.
"""

import os
import logging
from typing import List
from PIL import Image
import io

logger = logging.getLogger(__name__)


def compress_image_for_pdf(img_path: str, max_width: int = 800, quality: int = 60) -> str:
    """
    Compress and resize image to reduce PDF file size.
    
    Args:
        img_path: Path to original image
        max_width: Maximum width in pixels (default 800px is good for PDF)
        quality: JPEG quality 1-100 (default 60 is good balance)
    
    Returns:
        Path to compressed image
    """
    try:
        # Open image
        img = Image.open(img_path)
        
        # Convert RGBA to RGB if needed (for JPEG)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Resize if too large
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save compressed version
        compressed_path = img_path.rsplit('.', 1)[0] + '_compressed.jpg'
        img.save(compressed_path, 'JPEG', quality=quality, optimize=True)
        
        # Log compression results
        original_size = os.path.getsize(img_path) / 1024  # KB
        compressed_size = os.path.getsize(compressed_path) / 1024  # KB
        reduction = ((original_size - compressed_size) / original_size) * 100
        logger.info(f"📦 Compressed image: {original_size:.1f}KB → {compressed_size:.1f}KB ({reduction:.0f}% reduction)")
        
        return compressed_path
    except Exception as e:
        logger.warning(f"⚠️ Image compression failed: {e}, using original")
        return img_path


async def build_pdf(story, pages_data: List[dict]) -> str:
    from app.config import settings

    story_output_dir = os.path.join(settings.OUTPUT_DIR, f"story_{story.id}")
    os.makedirs(story_output_dir, exist_ok=True)
    pdf_path = os.path.join(story_output_dir, "storybook.pdf")

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Image as RLImage,
            PageBreak, HRFlowable, KeepTogether,
        )
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        # ── Register Hindi/Devanagari font ────────────────────────────
        # Try to use system fonts that support Hindi/Devanagari
        hindi_font_registered = False
        try:
            # Try system fonts first (most reliable)
            possible_fonts = [
                # Windows - Arial Unicode MS supports Hindi and many other scripts
                ("C:/Windows/Fonts/ARIALUNI.TTF", "Arial Unicode MS"),
                # Windows - Mangal is the default Hindi font on Windows
                ("C:/Windows/Fonts/mangal.ttf", "Mangal"),
                ("C:/Windows/Fonts/MANGAL.TTF", "Mangal"),
                # Linux
                ("/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf", "Noto Sans Devanagari"),
                ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "DejaVu Sans"),
                # macOS
                ("/System/Library/Fonts/Supplemental/DevanagariSangamMN.ttc", "Devanagari Sangam MN"),
            ]
            
            for font_path, font_name in possible_fonts:
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont('HindiFont', font_path))
                        pdfmetrics.registerFont(TTFont('HindiFont-Bold', font_path))  # Use same for bold
                        hindi_font_registered = True
                        logger.info(f"✅ Registered Hindi font: {font_name}")
                        break
                    except Exception as e:
                        logger.debug(f"Failed to register {font_name}: {e}")
                        continue
            
            if not hindi_font_registered:
                logger.warning("⚠️ No Hindi font found - Hindi text will show as boxes in PDF")
                logger.warning("💡 Install 'Mangal' font on Windows or 'Noto Sans Devanagari' on Linux/Mac")
        except Exception as e:
            logger.warning(f"⚠️ Font registration error: {e}")

        W, H = A4
        MARGIN = 2.2 * cm
        CONTENT_W = W - 2 * MARGIN

        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=A4,
            rightMargin=MARGIN,
            leftMargin=MARGIN,
            topMargin=MARGIN,
            bottomMargin=MARGIN,
            compress=1,  # Enable PDF compression
        )

        # ── Color palette ─────────────────────────────────────────────────
        TEAL       = colors.HexColor("#2EC4B6")
        ORANGE     = colors.HexColor("#FF9F1C")
        DARK       = colors.HexColor("#1E293B")
        MUTED      = colors.HexColor("#64748B")
        LIGHT_TEAL = colors.HexColor("#e6faf9")
        WHITE      = colors.white

        # ── Styles ────────────────────────────────────────────────────────
        # Use Hindi font if registered, otherwise fall back to Helvetica
        base_font = "HindiFont" if hindi_font_registered else "Helvetica"
        bold_font = "HindiFont-Bold" if hindi_font_registered else "Helvetica-Bold"
        
        cover_title = ParagraphStyle(
            "CoverTitle",
            fontName=bold_font,
            fontSize=28,
            textColor=WHITE,
            alignment=TA_CENTER,
            spaceAfter=10,
            leading=36,
        )
        cover_sub = ParagraphStyle(
            "CoverSub",
            fontName=base_font,
            fontSize=14,
            textColor=colors.HexColor("#a0f0eb"),
            alignment=TA_CENTER,
            spaceAfter=6,
        )
        cover_meta = ParagraphStyle(
            "CoverMeta",
            fontName=base_font,
            fontSize=11,
            textColor=colors.HexColor("#94a3b8"),
            alignment=TA_CENTER,
            spaceAfter=4,
        )
        page_badge = ParagraphStyle(
            "PageBadge",
            fontName=bold_font,
            fontSize=11,
            textColor=WHITE,
            alignment=TA_LEFT,
            spaceAfter=0,
        )
        story_heading = ParagraphStyle(
            "StoryHeading",
            fontName=bold_font,
            fontSize=16,
            textColor=DARK,
            alignment=TA_LEFT,
            spaceAfter=8,
            leading=24,
        )
        story_body = ParagraphStyle(
            "StoryBody",
            fontName=base_font,
            fontSize=14,
            textColor=DARK,
            alignment=TA_JUSTIFY,
            spaceAfter=6,
            leading=24,
        )
        end_title = ParagraphStyle(
            "EndTitle",
            fontName=bold_font,
            fontSize=32,
            textColor=WHITE,
            alignment=TA_CENTER,
            spaceAfter=12,
        )
        end_sub = ParagraphStyle(
            "EndSub",
            fontName=base_font,
            fontSize=16,
            textColor=colors.HexColor("#fde68a"),
            alignment=TA_CENTER,
            spaceAfter=8,
        )

        # Page theme colors cycling per page
        THEME_COLORS = [
            colors.HexColor("#2EC4B6"),  # teal
            colors.HexColor("#FF9F1C"),  # orange
            colors.HexColor("#4CAF50"),  # green
            colors.HexColor("#0ea5e9"),  # sky
            colors.HexColor("#f59e0b"),  # amber
            colors.HexColor("#f43f5e"),  # rose
        ]

        elements = []
        sorted_pages = sorted(pages_data, key=lambda p: p["page_number"])

        # ════════════════════════════════════════════════════════════════
        # COVER PAGE — full dark background with teal accents
        # ════════════════════════════════════════════════════════════════
        def draw_cover(canvas, doc):
            canvas.saveState()
            # Dark background
            canvas.setFillColor(colors.HexColor("#1E293B"))
            canvas.rect(0, 0, W, H, fill=1, stroke=0)
            # Teal accent bar at top
            canvas.setFillColor(TEAL)
            canvas.rect(0, H - 0.8*cm, W, 0.8*cm, fill=1, stroke=0)
            # Teal accent bar at bottom
            canvas.rect(0, 0, W, 0.8*cm, fill=1, stroke=0)
            # Subtle teal circle decoration
            canvas.setFillColor(colors.HexColor("#2EC4B620"))
            canvas.circle(W * 0.15, H * 0.75, 3*cm, fill=1, stroke=0)
            canvas.circle(W * 0.85, H * 0.25, 4*cm, fill=1, stroke=0)
            canvas.restoreState()

        # Cover content
        elements.append(Spacer(1, 3.5*cm))
        elements.append(Paragraph("✦  CartoonCare  ✦", cover_meta))
        elements.append(Spacer(1, 0.8*cm))
        elements.append(Paragraph(f"{story.child_name}'s Adventure", cover_title))
        elements.append(Spacer(1, 0.5*cm))
        elements.append(Paragraph(
            f"A story about <b>{story.disease.title()}</b>",
            cover_sub,
        ))
        elements.append(Spacer(1, 0.4*cm))
        elements.append(Paragraph(
            f"Age {story.age}  ·  {story.language}  ·  {len(sorted_pages)} Pages",
            cover_meta,
        ))
        elements.append(Spacer(1, 2*cm))
        # Decorative line
        elements.append(HRFlowable(
            width=8*cm, thickness=2, color=TEAL,
            hAlign="CENTER", spaceAfter=1.5*cm,
        ))
        elements.append(Paragraph(
            "AI-Illustrated Medical Storybook",
            cover_meta,
        ))
        elements.append(PageBreak())

        # ════════════════════════════════════════════════════════════════
        # STORY PAGES — each page on its own PDF page
        # IMAGE (top half) + TEXT (bottom half)
        # ════════════════════════════════════════════════════════════════
        for page in sorted_pages:
            page_num  = page["page_number"]
            text      = page.get("text", "").strip()
            img_path  = page.get("image_path")
            theme_col = THEME_COLORS[(page_num - 1) % len(THEME_COLORS)]

            page_elements = []

            # ── Page number badge ─────────────────────────────────────
            from reportlab.platypus import Table, TableStyle
            badge_data = [[Paragraph(f"  Page {page_num}  ", page_badge)]]
            badge = Table(badge_data, colWidths=[3*cm])
            badge.setStyle(TableStyle([
                ("BACKGROUND",  (0,0), (-1,-1), theme_col),
                ("ROUNDEDCORNERS", [4]),
                ("TOPPADDING",  (0,0), (-1,-1), 4),
                ("BOTTOMPADDING", (0,0), (-1,-1), 4),
                ("LEFTPADDING",  (0,0), (-1,-1), 6),
            ]))
            page_elements.append(badge)
            page_elements.append(Spacer(1, 0.4*cm))

            # ── Image (top section) ───────────────────────────────────
            if img_path and os.path.exists(img_path):
                try:
                    # Compress image to reduce PDF size
                    compressed_img_path = compress_image_for_pdf(
                        img_path,
                        max_width=800,  # 800px width is sufficient for PDF
                        quality=60      # 60% quality - good balance of size/quality
                    )
                    
                    img_h = 10*cm
                    img = RLImage(compressed_img_path, width=CONTENT_W, height=img_h)
                    img.hAlign = "CENTER"
                    # Rounded frame around image
                    from reportlab.platypus import Table as ImgTable, TableStyle as ImgTS
                    img_table = ImgTable([[img]], colWidths=[CONTENT_W])
                    img_table.setStyle(ImgTS([
                        ("BOX",        (0,0), (-1,-1), 1.5, theme_col),
                        ("ROUNDEDCORNERS", [8]),
                        ("TOPPADDING",    (0,0), (-1,-1), 0),
                        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
                        ("LEFTPADDING",   (0,0), (-1,-1), 0),
                        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
                    ]))
                    page_elements.append(img_table)
                except Exception as e:
                    logger.warning(f"Image embed failed page {page_num}: {e}")
            else:
                # Placeholder box when no image
                from reportlab.platypus import Table as PT, TableStyle as PTS
                ph = PT([[Paragraph("🎨  Illustration", cover_meta)]], colWidths=[CONTENT_W])
                ph.setStyle(PTS([
                    ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
                    ("BOX",           (0,0), (-1,-1), 1, theme_col),
                    ("ALIGN",         (0,0), (-1,-1), "CENTER"),
                    ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
                    ("TOPPADDING",    (0,0), (-1,-1), 40),
                    ("BOTTOMPADDING", (0,0), (-1,-1), 40),
                ]))
                page_elements.append(ph)

            page_elements.append(Spacer(1, 0.5*cm))

            # ── Divider line in theme color ───────────────────────────
            page_elements.append(HRFlowable(
                width="100%", thickness=1.5, color=theme_col,
                spaceAfter=0.4*cm,
            ))

            # ── Story text ────────────────────────────────────────────
            if text:
                sentences = [s.strip() for s in
                             __import__('re').split(r'(?<=[.!?])\s+', text)
                             if s.strip()]

                if sentences:
                    # First sentence — bold heading style
                    safe = sentences[0].replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                    page_elements.append(Paragraph(safe, story_heading))

                # Remaining sentences — body style
                for s in sentences[1:4]:  # max 3 more sentences
                    safe = s.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")
                    page_elements.append(Paragraph(safe, story_body))

            page_elements.append(Spacer(1, 0.3*cm))

            # ── Child name watermark at bottom ────────────────────────
            page_elements.append(HRFlowable(
                width="100%", thickness=0.5,
                color=colors.HexColor("#e2e8f0"),
                spaceAfter=0.2*cm,
            ))
            page_elements.append(Paragraph(
                f"{story.child_name}'s Story  ·  CartoonCare",
                cover_meta,
            ))

            elements.extend(page_elements)
            elements.append(PageBreak())

        # ════════════════════════════════════════════════════════════════
        # END PAGE
        # ════════════════════════════════════════════════════════════════
        elements.append(Spacer(1, 4*cm))
        elements.append(Paragraph("🌟  The End!  🌟", end_title))
        elements.append(Spacer(1, 0.8*cm))
        elements.append(Paragraph(
            f"{story.child_name} is a true hero!",
            end_sub,
        ))
        elements.append(Spacer(1, 0.5*cm))
        elements.append(Paragraph(
            f"You finished the story about {story.disease.title()}.",
            cover_meta,
        ))
        elements.append(Spacer(1, 2*cm))
        elements.append(HRFlowable(
            width=6*cm, thickness=2, color=ORANGE,
            hAlign="CENTER", spaceAfter=1*cm,
        ))
        elements.append(Paragraph(
            "CartoonCare  ·  AI Medical Storybooks for Children",
            cover_meta,
        ))

        # ── Build with cover background ───────────────────────────────
        def on_first_page(canvas, doc):
            draw_cover(canvas, doc)

        def on_later_pages(canvas, doc):
            # Subtle page number footer on story pages
            canvas.saveState()
            canvas.setFont("Helvetica", 8)
            canvas.setFillColor(colors.HexColor("#94a3b8"))
            canvas.drawCentredString(W/2, 0.6*cm, f"{story.child_name}'s Adventure  ·  CartoonCare")
            canvas.restoreState()

        doc.build(
            elements,
            onFirstPage=on_first_page,
            onLaterPages=on_later_pages,
        )
        
        # Log final PDF size
        pdf_size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
        logger.info(f"✅ PDF built: {pdf_path} ({pdf_size_mb:.2f} MB)")

    except ImportError:
        logger.error("❌ reportlab not installed")
        with open(pdf_path, "wb") as f:
            f.write(b"%PDF-1.4\n")
    except Exception as e:
        logger.error(f"❌ PDF build failed: {e}")
        import traceback
        traceback.print_exc()
        raise

    return pdf_path
