"""
services/summary.py – Business logic for meeting summary generation.

Currently provides a stub that returns a placeholder Summary object.
When an AI integration is added later, only this module needs to change;
the router and schema layers remain untouched.
"""

from sqlalchemy.orm import Session

from app.models import Meeting, Summary


def get_or_create_summary(meeting: Meeting, db: Session) -> Summary:
    """
    Return the existing Summary for a meeting, or create an empty one.

    This pattern is useful for the frontend: it can always GET /summaries/{meeting_id}
    and receive a valid (possibly empty) object rather than a 404.
    """
    if meeting.summary:
        return meeting.summary

    summary = Summary(meeting_id=meeting.id)
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


def build_placeholder_summary(meeting: Meeting) -> dict:
    """
    Return a dict representing a summary that has not yet been generated.

    Replace the body of this function with a call to an LLM/AI service
    once the external API integration is ready.
    """
    return {
        "overview": (
            f"Summary for '{meeting.title}' has not been generated yet. "
            "Trigger the summarisation job to populate this field."
        ),
        "key_points": "",
    }
