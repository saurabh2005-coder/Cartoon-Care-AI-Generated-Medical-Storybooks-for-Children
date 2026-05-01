"""
download_hindi_font.py — Downloads Noto Sans Devanagari font for PDF generation

This script downloads the free, open-source Noto Sans Devanagari font
which supports Hindi/Devanagari characters perfectly.

License: SIL Open Font License (OFL) - free for commercial use
"""

import os
import urllib.request
import logging

logger = logging.getLogger(__name__)

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
FONT_PATH = os.path.join(FONT_DIR, "NotoSansDevanagari.ttf")

# Using a reliable CDN for the font
FONT_URL = "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-devanagari@5.0.0/files/noto-sans-devanagari-latin-400-normal.woff2"


def download_font(url: str, dest_path: str) -> bool:
    """Download a font file from URL to destination path"""
    try:
        logger.info(f"Downloading Hindi font...")
        
        # Add headers to avoid 403 errors
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        
        with urllib.request.urlopen(req) as response:
            with open(dest_path, 'wb') as out_file:
                out_file.write(response.read())
        
        logger.info(f"✅ Font downloaded: {dest_path}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to download font: {e}")
        return False


def ensure_hindi_font() -> str:
    """
    Ensure Hindi font is available for PDF generation.
    Downloads it if not present.
    
    Returns:
        str: Path to the font file, or None if failed
    """
    # Create fonts directory if it doesn't exist
    os.makedirs(FONT_DIR, exist_ok=True)
    
    # Check if font already exists
    if os.path.exists(FONT_PATH):
        file_size = os.path.getsize(FONT_PATH)
        if file_size > 10000:  # At least 10KB
            logger.info("✅ Hindi font already available")
            return FONT_PATH
    
    # Download font
    logger.info("📥 Downloading Noto Sans Devanagari...")
    if download_font(FONT_URL, FONT_PATH):
        return FONT_PATH
    
    return None


if __name__ == "__main__":
    # Run this script directly to download font
    logging.basicConfig(level=logging.INFO)
    font_path = ensure_hindi_font()
    if font_path:
        print(f"\n✅ SUCCESS!")
        print(f"Font path: {font_path}")
        print(f"File size: {os.path.getsize(font_path)} bytes")
    else:
        print("\n❌ FAILED to download font")
