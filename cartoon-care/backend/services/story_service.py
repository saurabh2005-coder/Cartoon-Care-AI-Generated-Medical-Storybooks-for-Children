"""
story_service.py — Business logic for story creation and retrieval

What this file does:
  - Creates new story records in the database
  - Retrieves stories from the database
  - Orchestrates the full generation pipeline:
      1. Save story request → database
      2. Generate story text → Ollama AI
      3. Generate images → Stable Diffusion
      4. Translate if needed → MarianMT
      5. Build PDF → ReportLab
      6. Update database with results

Why separate from routes?
  - Routes should be thin (just receive/send data)
  - Services contain the real logic
  - This makes code easier to test and reuse
"""

from sqlalchemy.ext.asyncio import AsyncSession
# AsyncSession: our async database session type

from sqlalchemy import select
# select: used to build database queries (like SQL SELECT)

from sqlalchemy.orm import selectinload
# selectinload: loads related data (e.g., load pages when loading a story)

from typing import List, Optional
import asyncio
# asyncio: Python's async library — lets us run tasks without blocking

from models.story_model import Story, StoryPage
# Our database table classes

from app.schemas import StoryRequest
# The input schema we defined

from app.config import settings
# Our app settings

import logging
# logging: prints messages to the terminal (better than print() for production)

# Set up a logger for this file
# __name__ = the name of this module (story_service)
logger = logging.getLogger(__name__)


# ════════════════════════════════════════════════════════════════
# DATABASE OPERATIONS
# ════════════════════════════════════════════════════════════════

async def create_story_record(db: AsyncSession, request: StoryRequest, current_user=None) -> Story:
    """
    Saves a new story request to the database.
    
    This is the FIRST thing we do when a user submits the form.
    We save it immediately so we have an ID to track progress.
    
    Parameters:
      db: the database session (provided by FastAPI dependency injection)
      request: the validated input from the user (StoryRequest schema)
      current_user: the authenticated user making the request
    
    Returns:
      The newly created Story object (with its auto-assigned ID)
    """
    # Create a new Story object (this is NOT saved yet, just created in memory)
    story = Story(
        child_name=request.child_name,   # "Emma"
        age=request.age,                  # 7
        disease=request.disease,          # "asthma"
        language=request.language,        # "English"
        theme=request.theme,              # "superhero" or None
        status="pending",                 # starts as pending
        user_id=current_user.id if current_user else None,  # link to user
    )

    db.add(story)
    # db.add(): tells SQLAlchemy "I want to save this object"
    # It's still not saved to disk yet — just queued

    await db.commit()
    # await db.commit(): actually writes to the database file
    # 'await' means: "wait for this to finish before continuing"

    await db.refresh(story)
    # db.refresh(): reloads the story from the database
    # This is needed to get the auto-assigned 'id' value

    logger.info(f"Created story record with ID: {story.id}")
    # f"..." = f-string: lets you embed variables inside strings
    # This prints: "Created story record with ID: 1"

    return story


async def get_story_by_id(db: AsyncSession, story_id: int, current_user=None) -> Optional[Story]:
    """
    Retrieves a single story from the database by its ID.
    Also loads all its pages at the same time.
    
    Parameters:
      db: database session
      story_id: the ID of the story to find (e.g., 1)
      current_user: the authenticated user — enforces ownership for non-admins
    
    Returns:
      The Story object if found and accessible, or None if not found/not owned
    """
    # Build the query:
    # SELECT * FROM stories WHERE id = story_id
    # Also load all related pages in the same query
    result = await db.execute(
        select(Story)
        .where(Story.id == story_id)
        .options(selectinload(Story.pages))
        # selectinload: loads Story.pages in a single extra query
        # Without this, accessing story.pages would cause an error
        # because the session might be closed by then
    )

    story = result.scalar_one_or_none()

    # Enforce ownership: non-admins can only see their own stories
    if story and current_user and current_user.role != "admin":
        if story.user_id != current_user.id:
            return None  # return None → 404 (don't leak existence)

    return story


async def get_all_stories(db: AsyncSession, current_user=None) -> List[Story]:
    """
    Retrieves all stories from the database, newest first.
    Regular users only see their own stories; admins see all.
    
    Returns:
      A list of Story objects (without pages, to keep it fast)
    """
    query = select(Story).order_by(Story.created_at.desc())
    if current_user and current_user.role != "admin":
        query = query.where(Story.user_id == current_user.id)
    result = await db.execute(query)

    return result.scalars().all()


async def update_story_status(
    db: AsyncSession,
    story_id: int,
    status: str,
    pdf_path: Optional[str] = None
) -> None:
    """
    Updates the status of a story (e.g., from "pending" to "completed").
    
    Parameters:
      db: database session
      story_id: which story to update
      status: new status ("generating", "completed", "failed")
      pdf_path: path to the PDF file (set when generation is done)
    """
    story = await get_story_by_id(db, story_id)

    if story:
        story.status = status           # update the status field
        if pdf_path:
            story.pdf_path = pdf_path   # update the PDF path if provided
        await db.commit()               # save changes to database


async def save_story_pages(
    db: AsyncSession,
    story_id: int,
    pages_data: list
) -> None:
    """
    Saves all the generated story pages to the database.
    
    Parameters:
      db: database session
      story_id: which story these pages belong to
      pages_data: list of dicts, each with:
        {
          "page_number": 1,
          "text": "Emma felt...",
          "image_prompt": "A cartoon girl...",
          "image_path": "./outputs/story_1/page_1.png"
        }
    """
    for page_data in pages_data:
        # Loop through each page and create a StoryPage record
        page = StoryPage(
            story_id=story_id,
            page_number=page_data["page_number"],
            text=page_data["text"],
            image_prompt=page_data.get("image_prompt"),  # .get() returns None if key missing
            image_path=page_data.get("image_path"),
        )
        db.add(page)
        # We add all pages first, then commit once at the end
        # This is faster than committing after each page

    await db.commit()
    logger.info(f"Saved {len(pages_data)} pages for story ID: {story_id}")


# ════════════════════════════════════════════════════════════════
# GENERATION PIPELINE ORCHESTRATOR
# ════════════════════════════════════════════════════════════════

async def run_generation_pipeline(db: AsyncSession, story_id: int) -> None:
    """
    The main pipeline that generates a complete storybook.
    
    This function is called in the BACKGROUND after the API
    immediately returns a response to the user.
    
    Pipeline steps:
      1. Update status to "generating"
      2. Generate story text with Ollama
      3. Translate if needed
      4. Generate images with Stable Diffusion
      5. Build PDF
      6. Update status to "completed"
    
    If anything fails, status is set to "failed".
    """
    try:
        # ── Step 1: Mark as generating ───────────────────────────────────
        await update_story_status(db, story_id, "generating")
        logger.info(f"Starting generation pipeline for story ID: {story_id}")

        # ── Step 2: Get the story from database ──────────────────────────
        story = await get_story_by_id(db, story_id)
        if not story:
            raise ValueError(f"Story {story_id} not found in database")

        # ── Step 3: Generate story text ──────────────────────────────────
        # Import here to avoid circular imports
        from ai.story_generator.generator import generate_story_text
        pages_data = await generate_story_text(
            child_name=story.child_name,
            age=story.age,
            disease=story.disease,
            theme=story.theme,
            num_pages=settings.STORY_PAGES,
        )
        # pages_data is a list of dicts:
        # [{"page_number": 1, "text": "...", "image_prompt": "..."}, ...]

        # ── Step 4: Translate if not English ─────────────────────────────
        if story.language.lower() != "english":
            from ai.story_generator.translator import translate_pages
            logger.info(f"🌍 Translating story to {story.language}...")
            pages_data = await translate_pages(pages_data, story.language)

        # ── Step 5: Generate images ───────────────────────────────────────
        from ai.image_generator.generator import generate_images_for_story
        pages_data = await generate_images_for_story(story_id, pages_data)

        # ── Step 6: Save pages to database ───────────────────────────────
        await save_story_pages(db, story_id, pages_data)

        # ── Step 7: Build PDF ─────────────────────────────────────────────
        from services.pdf_service import build_pdf
        pdf_path = await build_pdf(story, pages_data)

        # ── Step 8: Mark as completed ─────────────────────────────────────
        await update_story_status(db, story_id, "completed", pdf_path)
        logger.info(f"✅ Story {story_id} generation complete!")

    except Exception as e:
        # If ANYTHING goes wrong, catch the error and mark as failed
        # This prevents the app from crashing
        logger.error(f"❌ Generation failed for story {story_id}: {str(e)}")
        await update_story_status(db, story_id, "failed")
        raise  # re-raise so the error is visible in logs
