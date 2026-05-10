from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.workflow_assignment import WorkflowAssignment
from app.schemas.workflow_assignment import (
    WorkflowAssignmentCreate,
    WorkflowAssignmentResponse,
    WorkflowAssignmentUpdate,
)

router = APIRouter(
    prefix="/workflow-assignments",
    tags=["Workflow Assignments"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/trade/{trade_id}", response_model=List[WorkflowAssignmentResponse])
def get_assignments_by_trade(trade_id: int, db: Session = Depends(get_db)):
    return (
        db.query(WorkflowAssignment)
        .filter(WorkflowAssignment.trade_id == trade_id)
        .order_by(WorkflowAssignment.id.asc())
        .all()
    )


@router.post("/", response_model=WorkflowAssignmentResponse)
def create_assignment(
    data: WorkflowAssignmentCreate,
    db: Session = Depends(get_db),
):
    assignment = WorkflowAssignment(**data.model_dump())

    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return assignment


@router.put("/{assignment_id}", response_model=WorkflowAssignmentResponse)
def update_assignment(
    assignment_id: int,
    data: WorkflowAssignmentUpdate,
    db: Session = Depends(get_db),
):
    assignment = (
        db.query(WorkflowAssignment)
        .filter(WorkflowAssignment.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Workflow assignment not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(assignment, key, value)

    db.commit()
    db.refresh(assignment)

    return assignment


@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    assignment = (
        db.query(WorkflowAssignment)
        .filter(WorkflowAssignment.id == assignment_id)
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Workflow assignment not found")

    db.delete(assignment)
    db.commit()

    return {"message": "Workflow assignment deleted successfully"}
