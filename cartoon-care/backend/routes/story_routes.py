"""
story_routes.py — API endpoints for story generation

What this file does:
  - Defines all the URL endpoints related to stories
  - Each function here handles one type of HTTP request

Endpoints we're building:
  POST /generate-story     → Start generating a new storybook
  GET  /stories            → List all stories
  GET  /stories/{id}       → Get one story with all its pages
  GET  /stories/{id}/status → Check generation progress

HTTP Methods explained:
  POST = sending data to create something new
  GET  = asking for data (read-only)
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
# APIRouter: groups related endpoints together (like a mini-app)
# Depends: dependency injection — automatically provides db sessions
# HTTPException: raises HTTP errors (404 Not Found, 400 Bad Request, etc.)
# BackgroundTasks: runs a function AFTER the response is sent

from sqlalchemy.ext.asyncio import AsyncSession
# AsyncSession: our database session type

from typing import List
# List: for type hints

from app.database import get_db
# get_db: the function that provides a database session

from app.schemas import (
    StoryRequest,
    StoryResponse,
    StoryListItem,
    GenerateStoryResponse,
    ErrorResponse,
)
# Import all our data schemas

from services.story_service import (
    create_story_record,
    get_story_by_id,
    get_all_stories,
    run_generation_pipeline,
)
# Import our service functions

from services.auth_service import get_current_user
from models.user_model import User

import logging
logger = logging.getLogger(__name__)


# ── Create a router ───────────────────────────────────────────────────────
router = APIRouter(
    prefix="/stories",
    # prefix="/stories": all routes in this file start with /stories
    # So a route defined as "/" becomes "/stories/"
    # And a route defined as "/{id}" becomes "/stories/{id}"

    tags=["Stories"],
    # tags=["Stories"]: groups these endpoints under "Stories" in /docs
)


# ════════════════════════════════════════════════════════════════
# POST /generate-story
# ════════════════════════════════════════════════════════════════

@router.post(
    "/generate",
    response_model=GenerateStoryResponse,
    # response_model: tells FastAPI what shape the response will be
    # FastAPI will validate the response against this schema
    status_code=202,
    # 202 = "Accepted" — means "we got your request and are working on it"
    # (different from 200 "OK" which means "done")
    summary="Generate a new storybook",
    description="Starts generating a personalized storybook for a child. "
                "Returns immediately with a story ID. "
                "Poll /stories/{id}/status to check progress.",
)
async def generate_story(
    request: StoryRequest,
    # request: FastAPI automatically reads the JSON body and validates it
    # against StoryRequest schema. If invalid, returns 422 error automatically.

    background_tasks: BackgroundTasks,
    # background_tasks: FastAPI's built-in background task runner
    # We use this to run generation AFTER sending the response

    db: AsyncSession = Depends(get_db),
    # db: FastAPI calls get_db() and injects the session here
    # Depends(get_db) = "call get_db() and give me what it returns"

    current_user: User = Depends(get_current_user),
):
    """
    Start generating a personalized storybook.
    
    This endpoint:
    1. Validates the input (Pydantic does this automatically)
    2. Saves the request to the database
    3. Returns immediately with the story ID
    4. Runs the full generation pipeline in the background
    
    The client should then poll GET /stories/{id}/status to check progress.
    """
    logger.info(
        f"New story request: {request.child_name}, age {request.age}, "
        f"disease: {request.disease}, language: {request.language}"
    )

    # Step 1: Save to database immediately (so we have an ID)
    story = await create_story_record(db, request, current_user)

    # Step 2: Schedule the generation pipeline to run in the background
    background_tasks.add_task(
        run_generation_pipeline,  # the function to run
        db,                       # first argument: database session
        story.id,                 # second argument: story ID
    )
    # add_task() schedules the function to run AFTER we send the response
    # The user gets a response in milliseconds, not minutes

    # Step 3: Return immediately
    return GenerateStoryResponse(
        message=f"Storybook generation started for {request.child_name}!",
        story_id=story.id,
        status="pending",
    )


# ════════════════════════════════════════════════════════════════
# GET /stories
# ════════════════════════════════════════════════════════════════

@router.get(
    "/",
    response_model=List[StoryListItem],
    # List[StoryListItem]: returns a list of story summaries
    summary="List all stories",
)
async def list_stories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a list of all storybooks (without page content).
    Used to show a history/library of generated stories.
    """
    stories = await get_all_stories(db, current_user)
    return stories
    # FastAPI automatically converts the list of Story objects
    # to JSON using the StoryListItem schema


# ════════════════════════════════════════════════════════════════
# GET /stories/{story_id}
# ════════════════════════════════════════════════════════════════

@router.get(
    "/{story_id}",
    response_model=StoryResponse,
    summary="Get a story with all its pages",
)
async def get_story(
    story_id: int,
    # story_id: FastAPI extracts this from the URL
    # e.g., GET /stories/5 → story_id = 5

    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a complete story including all its pages, text, and image paths.
    """
    story = await get_story_by_id(db, story_id, current_user)

    if not story:
        # If story doesn't exist, raise a 404 error
        raise HTTPException(
            status_code=404,
            detail=f"Story with ID {story_id} not found"
        )
        # HTTPException automatically sends:
        # { "detail": "Story with ID 5 not found" }
        # with HTTP status 404

    return story


# ════════════════════════════════════════════════════════════════
# GET /stories/{story_id}/status
# ════════════════════════════════════════════════════════════════

@router.get(
    "/{story_id}/status",
    summary="Check generation status",
    description="Poll this endpoint to check if story generation is complete.",
)
async def get_story_status(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns just the status of a story.
    
    The frontend polls this every few seconds while showing a loading screen.
    
    Possible statuses:
      "pending"    → saved but not started yet
      "generating" → AI is working on it
      "completed"  → done! PDF is ready
      "failed"     → something went wrong
    """
    story = await get_story_by_id(db, story_id, current_user)

    if not story:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")

    return {
        "story_id": story.id,
        "status": story.status,
        "child_name": story.child_name,
        "pdf_path": story.pdf_path,
        # Include pdf_path so frontend knows where to download when done
        "pages_generated": len(story.pages),
        # How many pages have been saved so far
    }


# ════════════════════════════════════════════════════════════════
# GET /stories/{story_id}/download
# ════════════════════════════════════════════════════════════════

@router.get(
    "/{story_id}/download",
    summary="Download the PDF storybook",
)
async def download_story_pdf(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Serves the PDF file as a download attachment."""
    import os
    story = await get_story_by_id(db, story_id, current_user)

    if not story:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")

    if not story.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not generated yet")

    # Normalize path separators
    pdf_path = story.pdf_path.replace("\\", "/")

    # If relative path, resolve it relative to the backend directory
    if not os.path.isabs(pdf_path):
        backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        pdf_path = os.path.normpath(os.path.join(backend_dir, pdf_path))

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail=f"PDF file not found on disk: {pdf_path}")

    filename = f"{story.child_name}_storybook.pdf".replace(" ", "_")
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ════════════════════════════════════════════════════════════════
# DELETE /stories/{story_id}
# ════════════════════════════════════════════════════════════════

@router.delete(
    "/{story_id}",
    status_code=204,
    # 204 = "No Content" — success but nothing to return
    summary="Delete a story",
)
async def delete_story(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a story and all its pages from the database.
    (Images and PDF files on disk are NOT deleted — do that manually if needed)
    """
    story = await get_story_by_id(db, story_id, current_user)

    if not story:
        raise HTTPException(status_code=404, detail=f"Story {story_id} not found")

    await db.delete(story)
    # db.delete(): marks the story for deletion
    # Because of cascade="all, delete" in our model,
    # all related StoryPage records are deleted too

    await db.commit()
    # Commit the deletion to the database

    logger.info(f"Deleted story ID: {story_id}")
    # Return nothing (204 No Content)
