"""
routers/action_items.py – REST API endpoints for ActionItem resource.

This router manages individual action items:
- PATCH /api/action-items/{action_item_id} (update details)
- DELETE /api/action-items/{action_item_id} (delete item)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ActionItem
from app.schemas import ActionItemRead, ActionItemUpdate

router = APIRouter(prefix="/api/action-items", tags=["action-items"])


# ---------------------------------------------------------------------------
# Helper: Get action item or raise 404
# ---------------------------------------------------------------------------
def _get_action_item_or_404(action_item_id: int, db: Session) -> ActionItem:
    item = db.get(ActionItem, action_item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Action item with ID {action_item_id} not found",
        )
    return item


# ---------------------------------------------------------------------------
# PATCH /api/action-items/{action_item_id}
# ---------------------------------------------------------------------------
@router.patch("/{action_item_id}", response_model=ActionItemRead)
def update_action_item(
    action_item_id: int, payload: ActionItemUpdate, db: Session = Depends(get_db)
):
    """Update details of an action item."""
    item = _get_action_item_or_404(action_item_id, db)
    
    # Update fields from payload
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)
        
    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# DELETE /api/action-items/{action_item_id}
# ---------------------------------------------------------------------------
@router.delete("/{action_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_action_item(action_item_id: int, db: Session = Depends(get_db)):
    """Delete an action item."""
    item = _get_action_item_or_404(action_item_id, db)
    db.delete(item)
    db.commit()
