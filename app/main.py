"""
main.py — The entry point of our FastAPI backend

What this file does:
  - Creates the FastAPI application
  - Registers all API routes (endpoints)
  - Sets up CORS (so the React frontend can talk to this backend)
  - Creates database tables on startup

How to run this file:
  uvicorn app.main:app --reload
  
  Breaking that command down:
    uvicorn       = the web server
    app.main      = look in the 'app' folder, find 'main.py'
    :app          = use the variable named 'app' inside main.py
    --reload      = automatically restart when you save changes (great for development)

After running, open: http://localhost:8000/docs
  This shows you an interactive page to test all your API endpoints!
"""

from fastapi import FastAPI
# FastAPI: the main class that creates our web application

from fastapi.middleware.cors import CORSMiddleware
# CORSMiddleware: allows our React frontend (running on port 5173)
# to make requests to our backend (running on port 8000)
# Without this, the browser would block the requests for security reasons

from fastapi.staticfiles import StaticFiles
# StaticFiles: serves files directly (like our generated images)

from contextlib import asynccontextmanager
# asynccontextmanager: lets us run code on startup and shutdown

import os
# os: for checking if folders exist

from app.database import create_tables
# Import our function that creates database tables

from app.config import settings
# Import our settings


# ── Lifespan: runs on startup and shutdown ────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    This function runs:
      - BEFORE the app starts (setup)
      - AFTER the app stops (cleanup)
    
    The code before 'yield' runs on startup.
    The code after 'yield' runs on shutdown.
    """
    # ── Startup ──────────────────────────────────────────────────────────
    print(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Create the outputs folder if it doesn't exist
    os.makedirs(settings.OUTPUT_DIR, exist_ok=True)
    # exist_ok=True: don't crash if the folder already exists
    
    # Create database tables
    await create_tables()
    print("✅ Database tables created")
    
    yield  # ← The app runs here (between startup and shutdown)
    
    # ── Shutdown ─────────────────────────────────────────────────────────
    print("👋 Shutting down Cartoon Care")


# ── Create the FastAPI app ────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,          # Shows in the /docs page
    version=settings.APP_VERSION,     # Shows in the /docs page
    description="AI-powered medical storybooks for children",
    lifespan=lifespan,                # Use our startup/shutdown function
)


# ── CORS Setup ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server (React)
        "http://localhost:3000",   # Alternative React port
    ],
    allow_credentials=True,        # Allow cookies/auth headers
    allow_methods=["*"],           # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],           # Allow all headers
)
# CORS = Cross-Origin Resource Sharing
# "Origin" = the address a request comes from
# Our React app is at localhost:5173, our API is at localhost:8000
# They are "different origins", so we need to explicitly allow this


# ── Serve static files (generated images) ────────────────────────────────
os.makedirs("./outputs", exist_ok=True)  # Make sure folder exists first
app.mount("/outputs", StaticFiles(directory="./outputs"), name="outputs")
# Now images at ./outputs/story_1/page_1.png are accessible at:
# http://localhost:8000/outputs/story_1/page_1.png


# ── Register Routes ───────────────────────────────────────────────────────
# Import and register our story routes
from routes.story_routes import router as story_router
app.include_router(story_router)

# Import and register the prompt builder preview route
from routes.prompt_routes import router as prompt_router
app.include_router(prompt_router)
# include_router: adds all routes from story_routes.py to the app
# Because story_routes has prefix="/stories", all its routes become:
#   POST /stories/generate
#   GET  /stories/
#   GET  /stories/{id}
#   GET  /stories/{id}/status
#   DELETE /stories/{id}


@app.get("/")
async def root():
    """
    Health check endpoint.
    Visit http://localhost:8000/ to confirm the server is running.
    """
    return {
        "message": f"Welcome to {settings.APP_NAME}!",
        "version": settings.APP_VERSION,
        "docs": "Visit /docs to see all API endpoints",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """
    Simple health check — returns 'ok' if the server is alive.
    Useful for monitoring tools.
    """
    return {"status": "ok"}
