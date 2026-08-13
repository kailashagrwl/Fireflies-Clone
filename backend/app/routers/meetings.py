"""
routers/meetings.py – REST API endpoints for Meetings resource.

This router manages all CRUD operations and sub-resources for meetings, including:
- GET /api/meetings (with search, filtering, and sorting)
- GET /api/meetings/{meeting_id} (complete details)
- POST /api/meetings (with full nested creation of related entities)
- PATCH /api/meetings/{meeting_id} (updates details and participant list)
- DELETE /api/meetings/{meeting_id} (cascade deletes all related entities)
- GET /api/meetings/{meeting_id}/transcript (ordered by sequence)
- GET /api/meetings/{meeting_id}/summary (AI summary)
- GET /api/meetings/{meeting_id}/action-items (related tasks)
- POST /api/meetings/{meeting_id}/action-items (create action item inline)
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.llm.factory import get_llm_provider
from app.models import (
    ActionItem,
    Meeting,
    MeetingParticipant,
    Participant,
    Summary,
    Topic,
    TranscriptSegment,
)
from app.schemas import (
    ActionItemCreateNested,
    ActionItemRead,
    MeetingCreate,
    MeetingListRead,
    MeetingRead,
    MeetingUpdate,
    SummaryRead,
    TranscriptSegmentRead,
)

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


# ---------------------------------------------------------------------------
# Helper: Get meeting or raise 404
# ---------------------------------------------------------------------------
def _get_meeting_or_404(meeting_id: int, db: Session) -> Meeting:
    meeting = db.get(Meeting, meeting_id)
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found",
        )
    return meeting


# ---------------------------------------------------------------------------
# GET /api/meetings
# ---------------------------------------------------------------------------
@router.get("/", response_model=list[MeetingListRead])
def list_meetings(
    title: Optional[str] = Query(None, description="Search by title (case-insensitive substring)"),
    participant_id: Optional[int] = Query(None, description="Filter by participant ID"),
    participant_email: Optional[str] = Query(None, description="Filter by participant email"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    sort: Optional[str] = Query("recent", description="Sort by date: 'recent' (default) or 'oldest'"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    List meetings with filtering, searching, and sorting capabilities.
    Includes title, date, duration, and participants in the response.
    """
    query = db.query(Meeting).options(selectinload(Meeting.participants))

    # Search by Title
    if title:
        query = query.filter(Meeting.title.ilike(f"%{title}%"))

    # Filter by Participant ID or Email
    if participant_id is not None or participant_email:
        query = query.join(Meeting.meeting_participants).join(MeetingParticipant.participant)
        if participant_id is not None:
            query = query.filter(Participant.id == participant_id)
        if participant_email:
            query = query.filter(Participant.email.ilike(participant_email))

    # Filter by Date (YYYY-MM-DD)
    if date:
        # Check against the date portion of meeting_date
        query = query.filter(func.strftime("%Y-%m-%d", Meeting.meeting_date) == date)

    # Sort
    if sort == "oldest":
        query = query.order_by(Meeting.meeting_date.asc())
    else:
        # Default: recent (newest first)
        query = query.order_by(Meeting.meeting_date.desc())

    return query.offset(skip).limit(limit).all()


# ---------------------------------------------------------------------------
# GET /api/meetings/{meeting_id}
# ---------------------------------------------------------------------------
@router.get("/{meeting_id}", response_model=MeetingRead)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """
    Return complete meeting details including:
    - Participants
    - Transcript segments (ordered by sequence)
    - Summary
    - Action items
    - Topics
    """
    # Fetch with eager loading of all child relations to prevent lazy loading N+1 queries
    meeting = (
        db.query(Meeting)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items),
            selectinload(Meeting.topics),
            selectinload(Meeting.transcript_segments),
        )
        .filter(Meeting.id == meeting_id)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found",
        )
    return meeting


# ---------------------------------------------------------------------------
# POST /api/meetings
# ---------------------------------------------------------------------------
@router.post("/", response_model=MeetingRead, status_code=status.HTTP_201_CREATED)
def create_meeting(payload: MeetingCreate, db: Session = Depends(get_db)):
    """
    Create a meeting and its nested relations (participants, transcript segments,
    summary, action items, topics).
    Uses participant deduplication by email to prevent duplicate entities.
    """
    # Create the meeting core entity
    meeting = Meeting(
        title=payload.title,
        description=payload.description,
        meeting_date=payload.meeting_date,
        duration_seconds=payload.duration_seconds,
    )
    db.add(meeting)
    db.flush()  # Populate meeting.id for foreign key generation

    # Process and link participants
    linked_participants = []
    if payload.participants:
        for p_data in payload.participants:
            # Check if participant exists by email
            participant = db.query(Participant).filter_by(email=p_data.email).first()
            if not participant:
                participant = Participant(name=p_data.name, email=p_data.email)
                db.add(participant)
                db.flush()
            
            # Create the junction record
            link = MeetingParticipant(meeting_id=meeting.id, participant_id=participant.id)
            db.add(link)
            linked_participants.append(participant)

    # Process transcript segments
    if payload.transcript_segments:
        for idx, seg_data in enumerate(payload.transcript_segments):
            # Attempt to resolve participant if speaker_id was provided
            speaker_id = None
            if seg_data.speaker_id:
                speaker = db.get(Participant, seg_data.speaker_id)
                if speaker:
                    speaker_id = speaker.id
            
            segment = TranscriptSegment(
                meeting_id=meeting.id,
                speaker_name=seg_data.speaker_name,
                speaker_id=speaker_id,
                start_seconds=seg_data.start_seconds,
                end_seconds=seg_data.end_seconds,
                text=seg_data.text,
                sequence=seg_data.sequence if seg_data.sequence is not None else idx,
            )
            db.add(segment)

    # Process summary
    if payload.summary:
        summary = Summary(
            meeting_id=meeting.id,
            overview=payload.summary.overview,
            key_points=payload.summary.key_points,
        )
        db.add(summary)

    # Process action items
    if payload.action_items:
        for item_data in payload.action_items:
            action_item = ActionItem(
                meeting_id=meeting.id,
                title=item_data.title,
                description=item_data.description,
                assignee=item_data.assignee,
                due_date=item_data.due_date,
                completed=item_data.completed,
            )
            db.add(action_item)

    # Process topics
    if payload.topics:
        for topic_data in payload.topics:
            topic = Topic(
                meeting_id=meeting.id,
                title=topic_data.title,
                start_seconds=topic_data.start_seconds,
                end_seconds=topic_data.end_seconds,
            )
            db.add(topic)

    db.commit()
    
    # Reload meeting with all relations for response schema serialization
    return (
        db.query(Meeting)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items),
            selectinload(Meeting.topics),
            selectinload(Meeting.transcript_segments),
        )
        .filter(Meeting.id == meeting.id)
        .first()
    )


# ---------------------------------------------------------------------------
# PATCH /api/meetings/{meeting_id}
# ---------------------------------------------------------------------------
@router.patch("/{meeting_id}", response_model=MeetingRead)
def update_meeting(meeting_id: int, payload: MeetingUpdate, db: Session = Depends(get_db)):
    """
    Update meeting metadata and/or participants list.
    If participants are supplied, the existing links are replaced.
    """
    meeting = _get_meeting_or_404(meeting_id, db)
    
    # Update simple metadata fields
    update_data = payload.model_dump(exclude_unset=True)
    
    for field in ["title", "description", "meeting_date", "duration_seconds"]:
        if field in update_data:
            setattr(meeting, field, update_data[field])

    # If participants array was explicitly sent, update links
    if payload.participants is not None:
        # Clear existing meeting-participant junction rows for this meeting
        db.query(MeetingParticipant).filter_by(meeting_id=meeting.id).delete()

        # Link/Create the new list of participants
        for p_data in payload.participants:
            participant = db.query(Participant).filter_by(email=p_data.email).first()
            if not participant:
                participant = Participant(name=p_data.name, email=p_data.email)
                db.add(participant)
                db.flush()
            
            link = MeetingParticipant(meeting_id=meeting.id, participant_id=participant.id)
            db.add(link)

    db.commit()

    # Return refreshed meeting
    return (
        db.query(Meeting)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items),
            selectinload(Meeting.topics),
            selectinload(Meeting.transcript_segments),
        )
        .filter(Meeting.id == meeting.id)
        .first()
    )


# ---------------------------------------------------------------------------
# DELETE /api/meetings/{meeting_id}
# ---------------------------------------------------------------------------
@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    """
    Delete the meeting and its related transcript segments, summary,
    action items, topics, and participant relationships (via cascade deletes).
    """
    meeting = _get_meeting_or_404(meeting_id, db)
    db.delete(meeting)
    db.commit()


# ---------------------------------------------------------------------------
# GET /api/meetings/{meeting_id}/transcript
# ---------------------------------------------------------------------------
@router.get("/{meeting_id}/transcript", response_model=list[TranscriptSegmentRead])
def get_transcript(meeting_id: int, db: Session = Depends(get_db)):
    """Return transcript segments for a meeting, ordered by sequence."""
    _get_meeting_or_404(meeting_id, db)
    return (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting_id)
        .order_by(TranscriptSegment.sequence.asc())
        .all()
    )


# ---------------------------------------------------------------------------
# GET /api/meetings/{meeting_id}/summary
# ---------------------------------------------------------------------------
@router.get("/{meeting_id}/summary", response_model=SummaryRead)
def get_summary(meeting_id: int, db: Session = Depends(get_db)):
    """Return the summary of the meeting, or 404 if not found."""
    meeting = _get_meeting_or_404(meeting_id, db)
    if not meeting.summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Summary for meeting ID {meeting_id} not found",
        )
    return meeting.summary


# ---------------------------------------------------------------------------
# GET /api/meetings/{meeting_id}/action-items
# ---------------------------------------------------------------------------
@router.get("/{meeting_id}/action-items", response_model=list[ActionItemRead])
def get_meeting_action_items(meeting_id: int, db: Session = Depends(get_db)):
    """Return all action items for a meeting."""
    _get_meeting_or_404(meeting_id, db)
    return (
        db.query(ActionItem)
        .filter(ActionItem.meeting_id == meeting_id)
        .order_by(ActionItem.created_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# POST /api/meetings/{meeting_id}/action-items
# ---------------------------------------------------------------------------
@router.post(
    "/{meeting_id}/action-items",
    response_model=ActionItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_meeting_action_item(
    meeting_id: int, payload: ActionItemCreateNested, db: Session = Depends(get_db)
):
    """Create an action item for a specific meeting."""
    _get_meeting_or_404(meeting_id, db)
    action_item = ActionItem(
        meeting_id=meeting_id,
        title=payload.title,
        description=payload.description,
        assignee=payload.assignee,
        due_date=payload.due_date,
        completed=payload.completed,
    )
    db.add(action_item)
    db.commit()
    db.refresh(action_item)
    return action_item


# ---------------------------------------------------------------------------
# Helper: Format seconds to [MM:SS] or [HH:MM:SS]
# ---------------------------------------------------------------------------
def _format_seconds_to_timestamp(seconds: float | None) -> str:
    if seconds is None:
        return "[00:00]"
    s = int(seconds)
    m, s = divmod(s, 60)
    h, m = divmod(m, 60)
    if h > 0:
        return f"[{h:02d}:{m:02d}:{s:02d}]"
    return f"[{m:02d}:{s:02d}]"


# ---------------------------------------------------------------------------
# Helper: Generate and Save Meeting Analysis
# ---------------------------------------------------------------------------
async def _generate_and_save_analysis(meeting: Meeting, db: Session) -> Meeting:
    # 1. Fetch transcript segments ordered by sequence
    segments = (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting.id)
        .order_by(TranscriptSegment.sequence.asc())
        .all()
    )
    if not segments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot generate analysis: meeting transcript has no segments.",
        )

    # 2. Format transcript text
    formatted_lines = []
    for seg in segments:
        ts = _format_seconds_to_timestamp(seg.start_seconds)
        speaker = seg.speaker_name or "Unknown"
        formatted_lines.append(f"{ts} {speaker}:\n{seg.text}\n")
    transcript_text = "\n".join(formatted_lines)

    # 3. Call LLM provider
    provider = get_llm_provider()
    try:
        analysis = await provider.analyze_meeting(transcript_text)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LLM analysis failed: {str(e)}",
        )

    # 4. Save/update Summary
    summary_obj = meeting.summary
    if not summary_obj:
        summary_obj = Summary(meeting_id=meeting.id)
        db.add(summary_obj)
    
    summary_obj.overview = analysis.summary
    summary_obj.key_points = "\n".join(analysis.key_points)
    summary_obj.updated_at = datetime.now(timezone.utc)

    # 5. Replace Action Items — delete old, flush, then add new
    meeting.action_items.clear()
    meeting.topics.clear()
    db.flush()  # ensure orphan deletions are staged before inserts

    for item in analysis.action_items:
        action_item = ActionItem(
            meeting_id=meeting.id,
            title=item.task,
            assignee=item.assignee,
            due_date=item.due_date,
            completed=False,
        )
        meeting.action_items.append(action_item)

    # 6. Add new Topics
    for topic_data in analysis.topics:
        topic_title = topic_data.title
        if topic_data.description:
            topic_title = f"{topic_data.title} - {topic_data.description}"
        
        topic = Topic(
            meeting_id=meeting.id,
            title=topic_title,
            start_seconds=None,
            end_seconds=None,
        )
        meeting.topics.append(topic)

    # Update meeting updated timestamp to trigger frontend refresh
    meeting.updated_at = datetime.now(timezone.utc)

    db.commit()

    # Reload meeting with all relations
    return (
        db.query(Meeting)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items),
            selectinload(Meeting.topics),
            selectinload(Meeting.transcript_segments),
        )
        .filter(Meeting.id == meeting.id)
        .first()
    )


# ---------------------------------------------------------------------------
# POST /api/meetings/{meeting_id}/generate-summary
# ---------------------------------------------------------------------------
@router.post("/{meeting_id}/generate-summary", response_model=MeetingRead)
async def generate_meeting_summary(meeting_id: int, db: Session = Depends(get_db)):
    """
    Find meeting, fetch transcript segments, send to LLM to generate summary,
    action items, and topics, save to database, and return updated meeting.
    """
    meeting = (
        db.query(Meeting)
        .options(
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items),
            selectinload(Meeting.topics),
        )
        .filter(Meeting.id == meeting_id)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found",
        )
    return await _generate_and_save_analysis(meeting, db)


# ---------------------------------------------------------------------------
# POST /api/meetings/{meeting_id}/regenerate-summary
# ---------------------------------------------------------------------------
@router.post("/{meeting_id}/regenerate-summary", response_model=MeetingRead)
async def regenerate_meeting_summary(meeting_id: int, db: Session = Depends(get_db)):
    """
    Regenerate AI summary, action items, and topics by fetching the transcript
    again, running LLM analysis, and replacing existing analysis.
    """
    meeting = (
        db.query(Meeting)
        .options(
            selectinload(Meeting.summary),
            selectinload(Meeting.action_items),
            selectinload(Meeting.topics),
        )
        .filter(Meeting.id == meeting_id)
        .first()
    )
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting with ID {meeting_id} not found",
        )
    return await _generate_and_save_analysis(meeting, db)
