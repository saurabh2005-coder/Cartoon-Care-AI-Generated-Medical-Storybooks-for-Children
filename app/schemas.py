"""
schemas.py — Data shapes for API requests and responses

What this file does:
  - Defines what data the API ACCEPTS (input schemas)
  - Defines what data the API RETURNS (output schemas)
  - Validates data automatically — if a field is wrong type or missing,
    FastAPI returns a clear error message before your code even runs

Why Pydantic?
  - FastAPI uses Pydantic under the hood for all validation
  - It converts JSON → Python objects automatically
  - It converts Python objects → JSON automatically

Example:
  If someone sends { "age": "hello" } instead of { "age": 7 },
  Pydantic catches it and returns: "age must be an integer"
"""

from pydantic import BaseModel, Field, field_validator
# BaseModel: the base class all our schemas inherit from
# Field: lets us add extra rules to a field (min/max value, description, etc.)
# field_validator: lets us write custom validation logic

from typing import Optional, List
# Optional: means the field can be None (not required)
# List: a list of items

from datetime import datetime
# datetime: for timestamps


# ════════════════════════════════════════════════════════════════
# INPUT SCHEMAS — what the frontend sends TO the backend
# ════════════════════════════════════════════════════════════════

class StoryRequest(BaseModel):
    """
    The data a user sends when requesting a new storybook.
    
    Example JSON the frontend will send:
    {
        "child_name": "Emma",
        "age": 7,
        "disease": "asthma",
        "language": "English",
        "theme": "superhero"
    }
    """

    child_name: str = Field(
        ...,                          # ... means REQUIRED (no default)
        min_length=1,                 # must have at least 1 character
        max_length=100,               # can't be longer than 100 characters
        description="The child's name",
        examples=["Emma"]
    )

    age: int = Field(
        ...,
        ge=5,                         # ge = "greater than or equal to" 5
        le=11,                        # le = "less than or equal to" 11
        description="Child's age (5–11)",
        examples=[7]
    )

    disease: str = Field(
        ...,
        min_length=2,
        max_length=200,
        description="The disease to explain (e.g., asthma, diabetes)",
        examples=["asthma"]
    )

    language: str = Field(
        default="English",            # Optional — defaults to English
        max_length=50,
        description="Language for the story",
        examples=["English"]
    )

    theme: Optional[str] = Field(
        default=None,                 # Optional — can be left empty
        max_length=200,
        description="Favorite superhero or theme (optional)",
        examples=["Spider-Man"]
    )

    @field_validator("child_name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        """
        Custom validator: makes sure the name isn't just spaces.
        
        cls = the class itself (StoryRequest)
        value = the actual value sent by the user
        
        If we return the value, it passes validation.
        If we raise ValueError, validation fails with our message.
        """
        if not value.strip():
            # .strip() removes spaces from both ends
            # if after stripping it's empty, the name was just spaces
            raise ValueError("Child name cannot be blank or just spaces")
        return value.strip()  # return the cleaned version (no leading/trailing spaces)

    @field_validator("disease")
    @classmethod
    def disease_must_not_be_blank(cls, value: str) -> str:
        """Same check for disease field."""
        if not value.strip():
            raise ValueError("Disease cannot be blank")
        return value.strip().lower()  # also convert to lowercase for consistency


# ════════════════════════════════════════════════════════════════
# OUTPUT SCHEMAS — what the backend sends BACK to the frontend
# ════════════════════════════════════════════════════════════════

class StoryPageResponse(BaseModel):
    """
    Represents one page of the storybook in the API response.
    
    Example:
    {
        "page_number": 1,
        "text": "Emma felt her chest tighten one morning...",
        "image_prompt": "A brave cartoon girl with an inhaler...",
        "image_path": "/outputs/story_1/page_1.png"
    }
    """
    page_number: int
    text: str
    image_prompt: Optional[str] = None   # might not be generated yet
    image_path: Optional[str] = None     # might not be generated yet

    class Config:
        from_attributes = True
        # from_attributes=True: allows Pydantic to read data from
        # SQLAlchemy model objects (not just plain dicts)
        # Without this, converting a database row to JSON would fail


class StoryResponse(BaseModel):
    """
    The full storybook response sent back to the frontend.
    
    Example:
    {
        "id": 1,
        "child_name": "Emma",
        "age": 7,
        "disease": "asthma",
        "language": "English",
        "theme": "superhero",
        "status": "completed",
        "pdf_path": "/outputs/story_1/storybook.pdf",
        "created_at": "2026-03-21T10:30:00",
        "pages": [ {...}, {...}, ... ]
    }
    """
    id: int
    child_name: str
    age: int
    disease: str
    language: str
    theme: Optional[str] = None
    status: str
    pdf_path: Optional[str] = None
    created_at: datetime
    pages: List[StoryPageResponse] = []
    # List[StoryPageResponse] = a list of page objects
    # [] = default is an empty list

    class Config:
        from_attributes = True


class StoryListItem(BaseModel):
    """
    A shorter version of StoryResponse used when listing all stories.
    We don't include the full pages here to keep the response small.
    """
    id: int
    child_name: str
    age: int
    disease: str
    language: str
    status: str
    pdf_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GenerateStoryResponse(BaseModel):
    """
    Immediate response when a story generation is STARTED.
    
    Story generation takes time (30–60 seconds), so we:
    1. Save the request to the database immediately
    2. Return this response right away (so the user isn't waiting)
    3. Generate the story in the background
    
    The frontend can then poll /stories/{id} to check progress.
    """
    message: str          # e.g., "Story generation started!"
    story_id: int         # the database ID to check progress
    status: str           # "pending" or "generating"


class ErrorResponse(BaseModel):
    """
    Standard error response format.
    
    Example:
    {
        "error": "Story not found",
        "detail": "No story with ID 99 exists in the database"
    }
    """
    error: str
    detail: Optional[str] = None
