"""
schemas.py – Pydantic v2 request / response schemas.

These are intentionally separate from the SQLAlchemy models so that:
  • The API surface can evolve independently of the DB schema.
  • We can expose only the fields that are safe to send to clients.
  • Validation lives here, not in the ORM layer.

Naming convention
-----------------
  <Entity>Base   – fields shared by create and read schemas
  <Entity>Create – fields accepted on POST (no id / timestamps)
  <Entity>Read   – full representation returned by the API
  <Entity>Update – partial update (all fields Optional for PATCH)
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Shared config mixin – enables ORM mode for all "Read" schemas
# ---------------------------------------------------------------------------

class _OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Participant
# ===========================================================================

class ParticipantBase(BaseModel):
    name: str = Field(..., max_length=255)
    email: EmailStr


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantRead(_OrmBase, ParticipantBase):
    id: int


class ParticipantUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None


# ===========================================================================
# TranscriptSegment
# ===========================================================================

class TranscriptSegmentBase(BaseModel):
    speaker_name: Optional[str] = Field(None, max_length=255)
    speaker_id: Optional[int] = None
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None
    text: str
    sequence: int = Field(..., ge=0)


class TranscriptSegmentCreate(TranscriptSegmentBase):
    meeting_id: int


class TranscriptSegmentRead(_OrmBase, TranscriptSegmentBase):
    id: int
    meeting_id: int


# ===========================================================================
# Summary
# ===========================================================================

class SummaryBase(BaseModel):
    overview: Optional[str] = None
    key_points: Optional[str] = None


class SummaryCreate(SummaryBase):
    meeting_id: int


class SummaryRead(_OrmBase, SummaryBase):
    id: int
    meeting_id: int
    created_at: datetime
    updated_at: datetime


class SummaryUpdate(BaseModel):
    overview: Optional[str] = None
    key_points: Optional[str] = None


# ===========================================================================
# ActionItem
# ===========================================================================

class ActionItemBase(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    assignee: Optional[str] = Field(None, max_length=255)
    due_date: Optional[datetime] = None
    completed: bool = False


class ActionItemCreate(ActionItemBase):
    meeting_id: int


class ActionItemRead(_OrmBase, ActionItemBase):
    id: int
    meeting_id: int
    created_at: datetime
    updated_at: datetime


class ActionItemUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = None
    assignee: Optional[str] = Field(None, max_length=255)
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None


# ===========================================================================
# Topic
# ===========================================================================

class TopicBase(BaseModel):
    title: str = Field(..., max_length=500)
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None


class TopicCreate(TopicBase):
    meeting_id: int


class TopicRead(_OrmBase, TopicBase):
    id: int
    meeting_id: int


class TopicUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=500)
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None


# ===========================================================================
# Meeting  (defined last because it embeds the schemas above)
# ===========================================================================

class MeetingBase(BaseModel):
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    meeting_date: Optional[datetime] = None
    duration_seconds: Optional[int] = Field(None, ge=0)


class MeetingCreate(MeetingBase):
    participants: Optional[list[ParticipantCreate]] = []
    transcript_segments: Optional[list[TranscriptSegmentCreateNested]] = []
    summary: Optional[SummaryCreateNested] = None
    action_items: Optional[list[ActionItemCreateNested]] = []
    topics: Optional[list[TopicCreateNested]] = []


class MeetingRead(_OrmBase, MeetingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    participants: list[ParticipantRead] = []
    summary: Optional[SummaryRead] = None
    action_items: list[ActionItemRead] = []
    topics: list[TopicRead] = []
    transcript_segments: list[TranscriptSegmentRead] = []


class MeetingListRead(_OrmBase, MeetingBase):
    """Lightweight list view – no nested segments (expensive)."""
    id: int
    created_at: datetime
    updated_at: datetime
    participants: list[ParticipantRead] = []


class MeetingUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    meeting_date: Optional[datetime] = None
    duration_seconds: Optional[int] = Field(None, ge=0)
    participants: Optional[list[ParticipantCreate]] = None


# Nested create schemas used for inline meeting creation
class TranscriptSegmentCreateNested(BaseModel):
    speaker_name: Optional[str] = Field(None, max_length=255)
    speaker_id: Optional[int] = None
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None
    text: str
    sequence: int = Field(..., ge=0)

class SummaryCreateNested(BaseModel):
    overview: Optional[str] = None
    key_points: Optional[str] = None

class ActionItemCreateNested(BaseModel):
    title: str = Field(..., max_length=500)
    description: Optional[str] = None
    assignee: Optional[str] = Field(None, max_length=255)
    due_date: Optional[datetime] = None
    completed: bool = False

class TopicCreateNested(BaseModel):
    title: str = Field(..., max_length=500)
    start_seconds: Optional[float] = None
    end_seconds: Optional[float] = None


# ===========================================================================
# LLM Meeting Analysis
# ===========================================================================

class ActionItemAnalysis(BaseModel):
    task: str = Field(..., description="Action item task title")
    assignee: Optional[str] = Field(None, description="Optional assignee email or name")
    due_date: Optional[datetime] = Field(None, description="Optional due date in YYYY-MM-DD format")

class TopicAnalysis(BaseModel):
    title: str = Field(..., description="Topic title")
    description: Optional[str] = Field(None, description="Topic description or detail")

class MeetingAnalysisResponse(BaseModel):
    summary: str = Field(..., description="Meeting overview summary")
    key_points: list[str] = Field(default_factory=list, description="Key points from the meeting")
    action_items: list[ActionItemAnalysis] = Field(default_factory=list, description="Action items generated")
    topics: list[TopicAnalysis] = Field(default_factory=list, description="Chapters/topics generated")

