"""
database.py — Sets up the database connection

What this file does:
  - Creates a connection to our SQLite database
  - Provides a "session" (think: a conversation with the database)
  - Creates the database file and tables if they don't exist yet

Why SQLite?
  - It's a simple database stored in a single file (cartoon_care.db)
  - No need to install a separate database server
  - Perfect for beginners and small projects
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
# create_async_engine: creates the database "engine" (the connection manager)
# AsyncSession: a session that works asynchronously (doesn't freeze the server)

from sqlalchemy.orm import sessionmaker, DeclarativeBase
# sessionmaker: a factory that creates database sessions
# DeclarativeBase: the base class all our database models will inherit from

from app.config import settings
# Import our settings so we can get the DATABASE_URL


# ── Create the database engine ────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,   # The path to our SQLite file
    echo=False,              # Set to True if you want to see SQL queries in terminal
)
# The engine is like a "phone line" to the database.
# It manages connections but doesn't talk to the database directly yet.


# ── Create a session factory ──────────────────────────────────────────────
AsyncSessionLocal = sessionmaker(
    engine,                  # Use our engine
    class_=AsyncSession,     # Use async sessions
    expire_on_commit=False,  # Keep data accessible after saving (commit)
)
# AsyncSessionLocal is a "factory" — call it to get a new database session
# A session is like opening a notebook to read/write data


# ── Base class for all database models ───────────────────────────────────
class Base(DeclarativeBase):
    """
    All database table classes will inherit from this Base.
    
    Example:
        class Story(Base):
            __tablename__ = "stories"
            ...
    """
    pass
# "pass" means: nothing extra to add, just inherit everything from DeclarativeBase


# ── Dependency: get a database session ───────────────────────────────────
async def get_db():
    """
    This is a FastAPI "dependency" — a function that provides a database
    session to any API endpoint that needs it.
    
    How it works:
      1. Opens a new database session
      2. Gives it to the API endpoint
      3. Closes it automatically when the endpoint is done
    
    The 'async' keyword means this function can pause and wait without
    blocking other requests.
    
    The 'yield' keyword means: "give this value to whoever asked for it,
    then continue running the cleanup code after they're done"
    """
    async with AsyncSessionLocal() as session:
        # 'async with' automatically closes the session when we're done
        yield session
        # yield = "here's your session, use it"
        # After the endpoint finishes, Python comes back here and closes the session


# ── Create all tables ─────────────────────────────────────────────────────
async def create_tables():
    """
    Creates all database tables defined in our models.
    
    This is called once when the app starts.
    If the tables already exist, it does nothing (safe to call multiple times).
    """
    async with engine.begin() as conn:
        # engine.begin() opens a connection and starts a transaction
        await conn.run_sync(Base.metadata.create_all)
        # Base.metadata.create_all: looks at all classes that inherit from Base
        # and creates their corresponding tables in the database
