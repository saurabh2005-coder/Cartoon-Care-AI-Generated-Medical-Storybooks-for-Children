"""
translator.py — Multilingual story translation using MarianMT

What this file does:
  - Translates story pages from English into any supported language
  - Uses HuggingFace's MarianMT models — runs 100% locally, no API needed
  - Downloads the translation model automatically on first use

How MarianMT works:
  - It's a family of translation models trained by the University of Helsinki
  - Each model handles one language pair, e.g., English → Spanish
  - Model name format: "Helsinki-NLP/opus-mt-en-{language_code}"
  - Examples:
      English → Spanish:  Helsinki-NLP/opus-mt-en-es
      English → French:   Helsinki-NLP/opus-mt-en-fr
      English → Arabic:   Helsinki-NLP/opus-mt-en-ar
      English → German:   Helsinki-NLP/opus-mt-en-de

Why local translation instead of an API?
  - Free — no usage limits, no API key needed
  - Private — story content never leaves your computer
  - Works offline after the first download

NOTE: First run downloads ~300MB per language model.
      After that, it's cached and instant.
"""

import logging
import asyncio
from typing import Optional

logger = logging.getLogger(__name__)

# ── Language code mapping ─────────────────────────────────────────────────
# Maps human-readable language names to MarianMT language codes
# Add more languages here as needed

LANGUAGE_CODES = {
    "english":    None,       # No translation needed
    "spanish":    "es",
    "french":     "fr",
    "german":     "de",
    "arabic":     "ar",
    "portuguese": "pt",
    "italian":    "it",
    "dutch":      "nl",
    "russian":    "ru",
    "chinese":    "zh",
    "japanese":   "jap",
    "hindi":      "hi",
    "turkish":    "tr",
    "polish":     "pl",
    "swedish":    "sv",
    "korean":     "ko",
    "urdu":       "ur",
}


def get_language_code(language_name: str) -> Optional[str]:
    """
    Converts a language name to its MarianMT code.

    Parameters:
      language_name: e.g., "Spanish", "french", "ARABIC"

    Returns:
      The language code (e.g., "es") or None if English/not found
    """
    return LANGUAGE_CODES.get(language_name.lower().strip())


def translate_text(text: str, target_language_code: str) -> str:
    """
    Translates a single text string from English to the target language.

    This function:
    1. Loads the MarianMT model for the language pair (cached after first load)
    2. Tokenizes the input text (splits into tokens the model understands)
    3. Runs the translation model
    4. Decodes the output back into readable text

    Parameters:
      text: English text to translate
      target_language_code: e.g., "es" for Spanish

    Returns:
      Translated text string
    """
    from transformers import MarianMTModel, MarianTokenizer
    # MarianMTModel: the translation neural network
    # MarianTokenizer: converts text ↔ tokens the model understands

    model_name = f"Helsinki-NLP/opus-mt-en-{target_language_code}"
    # This is the HuggingFace model ID
    # It will be downloaded automatically if not already cached

    logger.info(f"🌍 Loading translation model: {model_name}")

    # Load tokenizer and model
    # These are cached after first download — subsequent calls are instant
    tokenizer = MarianTokenizer.from_pretrained(model_name)
    model = MarianMTModel.from_pretrained(model_name)

    # Tokenize: convert text → numbers the model understands
    # return_tensors="pt" means return PyTorch tensors
    # padding=True: pad shorter sequences to match the longest
    # truncation=True: cut text that's too long for the model
    inputs = tokenizer(
        [text],
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=512,  # MarianMT max input length
    )

    # Run the translation model
    # generate() runs the neural network and produces translated token IDs
    translated_tokens = model.generate(**inputs)
    # **inputs unpacks the dict: model.generate(input_ids=..., attention_mask=...)

    # Decode: convert token IDs back to readable text
    translated_text = tokenizer.decode(
        translated_tokens[0],       # [0] = first (and only) result
        skip_special_tokens=True,   # remove [PAD], [EOS] etc. from output
    )

    return translated_text


async def translate_pages(pages_data: list, target_language: str) -> list:
    """
    Translates all story pages to the target language.

    Called by the story generation pipeline when language != English.

    Parameters:
      pages_data: list of page dicts, each with a "text" field
      target_language: e.g., "Spanish", "French", "Arabic"

    Returns:
      Same list with "text" fields translated
      Also adds "original_text" field to preserve the English version
    """
    lang_code = get_language_code(target_language)

    # If English or unknown language, return unchanged
    if not lang_code:
        logger.info(f"No translation needed for language: {target_language}")
        return pages_data

    logger.info(f"🌍 Translating {len(pages_data)} pages to {target_language} ({lang_code})...")

    # Translation is CPU-intensive (blocking), so we run it in a thread
    # to avoid freezing the async server
    loop = asyncio.get_event_loop()

    translated_pages = []
    for page in pages_data:
        original_text = page["text"]

        try:
            # Run the blocking translation in a background thread
            translated_text = await loop.run_in_executor(
                None,                           # use default thread pool
                translate_text,                 # the function to run
                original_text,                  # first argument
                lang_code,                      # second argument
            )

            # Create a new page dict with translated text
            translated_page = {
                **page,                         # copy all existing fields
                "text": translated_text,        # replace text with translation
                "original_text": original_text, # keep original for reference
            }
            # **page: the ** operator "unpacks" a dict
            # {**page, "text": translated_text} = copy page, then override "text"

            translated_pages.append(translated_page)
            logger.info(f"✅ Page {page['page_number']} translated")

        except Exception as e:
            logger.warning(
                f"⚠️ Translation failed for page {page['page_number']}: {e}. "
                f"Keeping original English text."
            )
            # If translation fails, keep the original English text
            translated_pages.append(page)

    logger.info(f"✅ Translation complete: {len(translated_pages)} pages")
    return translated_pages


def get_supported_languages() -> list:
    """
    Returns a list of all supported language names.
    Used by the frontend to populate the language dropdown.
    """
    return [
        lang.capitalize()
        for lang, code in LANGUAGE_CODES.items()
        # Include all languages (None code = English, still valid)
    ]
