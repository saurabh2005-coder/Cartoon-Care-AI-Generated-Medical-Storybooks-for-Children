"""
story_model.py — Defines the database tables for our app

What this file does:
  - Defines the "Story" table: stores each storybook request
  - Defines the "StoryPage" table: stores each page of a story

Think of this like designing a spreadsheet:
  - Story table = one row per storybook
  - StoryPage table = one row per page (linked to a story)

Why do we need a database?
  - So we can save stories and look them up later
  - So users can download their storybook again without regenerating it
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
# Column: defines a column in a table
# Integer: a whole number (1, 2, 3...)
# String: short text (names, titles)
# Text: long text (story paragraphs)
# DateTime: date and time
# ForeignKey: links one table to another

from sqlalchemy.orm import relationship
# relationship: tells SQLAlchemy that Story and StoryPage are connected

from datetime import datetime, timezone
# datetime: for storing when a story was created

from app.database import Base
# Import the Base class we defined in database.py


class Story(Base):
    """
    The 'stories' table — one row = one storybook request
    
    Example row:
      id=1, child_name="Emma", age=7, disease="asthma",
      language="English", theme="superhero", status="completed"
    """
    __tablename__ = "stories"
    # __tablename__ tells SQLAlchemy what to name this table in the database

    # ── Columns ──────────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)
    # primary_key=True: this is the unique ID for each row (auto-increments: 1, 2, 3...)
    # index=True: makes lookups by ID faster

    child_name = Column(String(100), nullable=False)
    # String(100): text up to 100 characters
    # nullable=False: this field is REQUIRED (can't be empty)

    age = Column(Integer, nullable=False)
    # The child's age (5–11)

    disease = Column(String(200), nullable=False)
    # The disease to explain (e.g., "asthma", "diabetes")

    language = Column(String(50), default="English")
    # The language for the story (default: English)

    theme = Column(String(200), nullable=True)
    # Optional: favorite superhero or theme (can be empty)

    status = Column(String(50), default="pending")
    # Status of generation: "pending" → "generating" → "completed" → "failed"

    pdf_path = Column(String(500), nullable=True)
    # Where the PDF file is saved on disk (filled in after generation)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    # Automatically set to the current date/time when a story is created
    # lambda: datetime.now(timezone.utc) = "call this function to get current time"

    # ── Relationship ──────────────────────────────────────────────────────
    pages = relationship("StoryPage", back_populates="story", cascade="all, delete")
    # This tells SQLAlchemy: "a Story has many StoryPages"
    # back_populates="story": StoryPage also knows about its parent Story
    # cascade="all, delete": if we delete a Story, delete all its pages too


class StoryPage(Base):
    """
    The 'story_pages' table — one row = one page of a storybook
    
    Example row:
      id=1, story_id=1, page_number=1,
      text="Emma felt her chest tighten...",
      image_prompt="A brave girl with an inhaler...",
      image_path="./outputs/story_1/page_1.png"
    """
    __tablename__ = "story_pages"

    # ── Columns ──────────────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)

    story_id = Column(Integer, ForeignKey("stories.id"), nullable=False)
    # ForeignKey("stories.id"): this page belongs to a story
    # It stores the ID of the parent story

    page_number = Column(Integer, nullable=False)
    # Which page this is (1, 2, 3...)

    text = Column(Text, nullable=False)
    # The story paragraph for this page
    # Text (not String) because paragraphs can be long

    image_prompt = Column(Text, nullable=True)
    # The description we send to Stable Diffusion to generate the image
    # Example: "A cartoon girl with an inhaler, bright colors, friendly style"

    image_path = Column(String(500), nullable=True)
    # Where the generated image is saved on disk

    # ── Relationship ──────────────────────────────────────────────────────
    story = relationship("Story", back_populates="pages")
    # This page knows which Story it belongs to
