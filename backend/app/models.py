"""
models.py – SQLAlchemy ORM models for the Fireflies-clone backend.

Entity map
----------
Meeting          – a recorded or scheduled meeting
Participant      – a unique person (identified by e-mail)
MeetingParticipant – junction table (meeting ↔ participant, M2M)
TranscriptSegment – one utterance / turn in the transcript
Summary          – AI-generated or hand-written meeting summary (1:1)
ActionItem       – task extracted from a meeting (1:N)
Topic            – agenda or discussion topic detected in a meeting (1:N)
"""

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utcnow() -> datetime:
    """Return the current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Junction table: Meeting ↔ Participant  (many-to-many)
# ---------------------------------------------------------------------------

class MeetingParticipant(Base):
    """
    Explicit association table between Meeting and Participant.

    Using an explicit model (rather than SQLAlchemy's Table() shorthand)
    gives us the ability to add extra columns to the join (e.g. role,
    joined_at) in the future without a painful migration.

    Composite primary key = (meeting_id, participant_id) ensures that the
    same person cannot appear twice in the same meeting's participant list.
    """

    __tablename__ = "meeting_participants"

    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"),
        primary_key=True,
    )
    participant_id: Mapped[int] = mapped_column(
        ForeignKey("participants.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # Back-references (gives us mp.meeting and mp.participant)
    meeting: Mapped["Meeting"] = relationship(back_populates="meeting_participants")
    participant: Mapped["Participant"] = relationship(back_populates="meeting_participants")


# ---------------------------------------------------------------------------
# Meeting
# ---------------------------------------------------------------------------

class Meeting(Base):
    """
    Central entity.  Every other table hangs off a Meeting row.

    duration_seconds stores the length of the recording as an integer so
    arithmetic stays exact (no floating-point rounding on 1h23m04s).
    """

    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    meeting_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
        server_default=func.now(),
    )

    # ---- Relationships -------------------------------------------------------

    # M2M: participants via junction
    meeting_participants: Mapped[list["MeetingParticipant"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    # Convenience accessor: meeting.participants → list[Participant]
    participants: Mapped[list["Participant"]] = relationship(
        secondary="meeting_participants",
        back_populates="meetings",
        viewonly=True,        # write through MeetingParticipant to stay explicit
    )

    # 1:N
    transcript_segments: Mapped[list["TranscriptSegment"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.sequence",
    )
    action_items: Mapped[list["ActionItem"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
    )
    topics: Mapped[list["Topic"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="Topic.start_seconds",
    )

    # 1:1  (uselist=False turns the relationship into a scalar)
    summary: Mapped["Summary | None"] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        uselist=False,
    )

    def __repr__(self) -> str:
        return f"<Meeting id={self.id} title={self.title!r}>"


# ---------------------------------------------------------------------------
# Participant
# ---------------------------------------------------------------------------

class Participant(Base):
    """
    A unique person identified by e-mail address.

    email is the natural key: two rows with the same e-mail would represent
    the same human, which makes no sense.  The UNIQUE constraint enforces this
    at the database level so deduplication can happen before INSERT.
    """

    __tablename__ = "participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, unique=True, index=True)

    # M2M back-ref
    meeting_participants: Mapped[list["MeetingParticipant"]] = relationship(
        back_populates="participant",
        cascade="all, delete-orphan",
    )
    meetings: Mapped[list["Meeting"]] = relationship(
        secondary="meeting_participants",
        back_populates="participants",
        viewonly=True,
    )

    def __repr__(self) -> str:
        return f"<Participant id={self.id} email={self.email!r}>"


# ---------------------------------------------------------------------------
# TranscriptSegment
# ---------------------------------------------------------------------------

class TranscriptSegment(Base):
    """
    A single spoken utterance / turn in the transcript.

    Why one row per segment?
    ─────────────────────────
    Storing the entire transcript as one TEXT column would make it:
      • Impossible to filter by speaker without full-table regex scans.
      • Impossible to time-link a UI highlight to the right audio position.
      • Impossible to paginate large transcripts efficiently.
      • Impossible to aggregate per-speaker word counts or speaking time.

    One row per segment lets us:
      SELECT * FROM transcript_segments
      WHERE meeting_id = ? AND speaker_name = ?
      ORDER BY sequence;

    speaker_id is nullable because some recordings may identify speakers only
    by a label ("Speaker 1") before diarisation links them to a Participant.

    sequence is an integer offset (0-based) so the UI can always reconstruct
    the transcript in order even when start_seconds values are imprecise.
    """

    __tablename__ = "transcript_segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    speaker_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    speaker_id: Mapped[int | None] = mapped_column(
        ForeignKey("participants.id", ondelete="SET NULL"),
        nullable=True,
    )
    start_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    end_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    meeting: Mapped["Meeting"] = relationship(back_populates="transcript_segments")
    speaker: Mapped["Participant | None"] = relationship()

    # Composite index speeds up "give me all segments for meeting X in order"
    __table_args__ = (
        Index("ix_transcript_segments_meeting_sequence", "meeting_id", "sequence"),
    )

    def __repr__(self) -> str:
        return (
            f"<TranscriptSegment id={self.id} meeting_id={self.meeting_id}"
            f" seq={self.sequence}>"
        )


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

class Summary(Base):
    """
    One AI-generated (or manually written) summary per meeting.

    key_points is stored as plain text.  In the future this could be JSON so
    each bullet point is individually addressable, but TEXT keeps the schema
    simple for now and avoids a SQLite JSON parsing dependency.

    The UNIQUE constraint on meeting_id enforces the 1:1 invariant at the
    database level so that even a raw INSERT cannot accidentally create two
    summaries for one meeting.
    """

    __tablename__ = "summaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,          # enforces 1:1 at the DB level
    )
    overview: Mapped[str | None] = mapped_column(Text, nullable=True)
    key_points: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
        server_default=func.now(),
    )

    meeting: Mapped["Meeting"] = relationship(back_populates="summary")

    def __repr__(self) -> str:
        return f"<Summary id={self.id} meeting_id={self.meeting_id}>"


# ---------------------------------------------------------------------------
# ActionItem
# ---------------------------------------------------------------------------

class ActionItem(Base):
    """
    A task extracted from a meeting.

    assignee is a free-text field (not a FK) so that tasks can be assigned to
    external stakeholders who are not Participant rows, or assigned to a role
    rather than a named person.  A FK can be added later if tighter linkage is
    needed.

    due_date stores only the date portion; time-of-day precision is rarely
    meaningful for task deadlines.
    """

    __tablename__ = "action_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assignee: Mapped[str | None] = mapped_column(String(255), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=_utcnow,
        onupdate=_utcnow,
        server_default=func.now(),
    )

    meeting: Mapped["Meeting"] = relationship(back_populates="action_items")

    def __repr__(self) -> str:
        return f"<ActionItem id={self.id} title={self.title!r} completed={self.completed}>"


# ---------------------------------------------------------------------------
# Topic
# ---------------------------------------------------------------------------

class Topic(Base):
    """
    A discrete discussion topic detected within a meeting.

    start_seconds / end_seconds let the UI jump to the right audio position
    when the user clicks on a topic.  Both are nullable because manually
    created topics may not have timing information.
    """

    __tablename__ = "topics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    meeting_id: Mapped[int] = mapped_column(
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    start_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    end_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)

    meeting: Mapped["Meeting"] = relationship(back_populates="topics")

    def __repr__(self) -> str:
        return f"<Topic id={self.id} title={self.title!r} meeting_id={self.meeting_id}>"
