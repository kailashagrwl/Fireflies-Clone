"""
database.py – SQLite connection, engine, session factory, and Base.

All other modules import from here so there is a single source of truth
for the DB URL and the declarative Base.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# ---------------------------------------------------------------------------
# Connection string
# ---------------------------------------------------------------------------
# SQLite stores the file relative to wherever the app is launched from.
# Using an absolute path here avoids confusion when uvicorn is started from
# different working directories.
import os

DATABASE_PATH = os.environ.get("DATABASE_PATH")
if DATABASE_PATH:
    # Ensure parent directories exist (crucial for Render persistent disks)
    db_dir = os.path.dirname(DATABASE_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    DATABASE_URL = f"sqlite:///{DATABASE_PATH}"
else:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'meetings.db')}"

# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------
# connect_args={"check_same_thread": False} is required for SQLite when
# multiple threads share a connection (FastAPI uses a thread-pool executor).
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,          # Set True for SQL query logging during development
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------
# autocommit=False  → we control commits explicitly inside route handlers
# autoflush=False   → no automatic flush before every query (avoids surprises)
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

# ---------------------------------------------------------------------------
# Declarative Base
# ---------------------------------------------------------------------------
# All SQLAlchemy models inherit from this class so they are registered in the
# same metadata registry and CREATE TABLE statements can be issued in one call.
class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------
def get_db():
    """
    Yields a database session for the duration of a single HTTP request.

    FastAPI's dependency injection will call this generator, provide the
    yielded session to the route handler, and then execute the finally block
    (closing the session) once the response is sent – even if an exception
    was raised.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
