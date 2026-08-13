"""
main.py – FastAPI application entry point.

Startup sequence
----------------
1. Import all models so SQLAlchemy's metadata registry is populated.
2. Call Base.metadata.create_all(engine) to create tables if they don't exist
   (idempotent – safe to call on every restart).
3. Register routers.
4. Expose a health-check endpoint for ops / deployment probes.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Import models so their Table objects are registered in Base.metadata
# before create_all() is called.  The imports must happen before any
# create_all() call even if the symbols are not used directly here.
import app.models  # noqa: F401  – side-effect import

from app.routers import meetings, action_items


# ---------------------------------------------------------------------------
# Lifespan handler (FastAPI recommended way to run startup/shutdown logic)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create all database tables on startup (idempotent)."""
    Base.metadata.create_all(bind=engine)
    print("✅  Database tables created / verified.")
    yield
    # Shutdown: nothing to clean up for SQLite


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Fireflies Clone – Meeting Intelligence API",
    description=(
        "Backend API for a Fireflies.ai-inspired meeting notes and transcription platform. "
        "Manage meetings, participants, transcripts, summaries, action items, and topics."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS  (permissive for local development; tighten for production)
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(meetings.router)
app.include_router(action_items.router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["health"])
def health_check():
    """Liveness probe – returns 200 OK when the server is up."""
    return {"status": "ok", "service": "fireflies-clone-api"}


@app.get("/", tags=["health"])
def root():
    return {
        "message": "Fireflies Clone API",
        "docs": "/docs",
        "redoc": "/redoc",
    }
