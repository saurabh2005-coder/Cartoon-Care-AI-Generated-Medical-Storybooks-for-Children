"""
config.py — Central configuration for the entire backend

What this file does:
  - Reads settings from the .env file
  - Makes those settings available to every other file in the project
  - If a setting is missing from .env, it uses a safe default value

Why we need this:
  - Instead of hardcoding values like "http://localhost:11434" in 10 different
    files, we define it ONCE here and import it everywhere.
  - If we ever need to change a setting, we change it in ONE place.
"""

import os                          # os = operating system module, lets us read environment variables
from dotenv import load_dotenv     # load_dotenv reads our .env file

# Tell Python to load the .env file so os.getenv() can read from it
load_dotenv()


class Settings:
    """
    A class that holds all our app settings.
    
    Think of this like a settings panel — all knobs and switches in one place.
    """

    # ── App Info ──────────────────────────────────────────────────────────
    APP_NAME: str = os.getenv("APP_NAME", "Cartoon Care")
    # os.getenv("APP_NAME", "Cartoon Care") means:
    #   "Read APP_NAME from .env. If it's not there, use 'Cartoon Care' as default"

    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")

    # ── Ollama (Story AI) Settings ────────────────────────────────────────
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    # This is the web address where Ollama listens on your computer
    # Port 11434 is Ollama's default port

    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "mistral")
    # "mistral" is the AI model name. You can also use "llama3" if you prefer

    # ── Groq API (Prompt Builder) ─────────────────────────────────────────
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    # Get your FREE key at: https://console.groq.com
    # Leave empty to fall back to a built-in rule-based prompt builder

    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    # llama-3.3-70b-versatile is fast, free, and excellent at prompt engineering

    # ── Stable Diffusion (Image AI) Settings ─────────────────────────────
    SD_MODEL_ID: str = os.getenv("SD_MODEL_ID", "Lykon/dreamshaper-8")
    # This is the HuggingFace model ID for Stable Diffusion
    # It will be downloaded automatically the first time you run the app

    OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", "./outputs")
    # The folder where we save generated images and PDFs

    # ── Database Settings ─────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite+aiosqlite:///./data/cartoon_care.db"
    )
    # SQLite stores everything in a single file: cartoon_care.db
    # "aiosqlite" means async SQLite (doesn't freeze the server while saving)

    # ── Story Settings ────────────────────────────────────────────────────
    STORY_PAGES: int = int(os.getenv("STORY_PAGES", "6"))
    # How many pages the storybook will have (default: 6 pages)
    # int() converts the string "6" from .env into the number 6

    # ── Authentication ────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cartoon-care-super-secret-key-change-in-production-32chars")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


# Create ONE instance of Settings that the whole app will share
# This is called the "singleton pattern" — one object, used everywhere
settings = Settings()

# ── How to use this in other files ────────────────────────────────────────
# from app.config import settings
# print(settings.OLLAMA_MODEL)   # prints: mistral
