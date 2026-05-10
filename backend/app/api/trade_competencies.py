from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.trade_competency import TradeCompetency
from app.schemas.trade_competency import (
    TradeCompetencyCreate,
    TradeCompetencyResponse,
    TradeCompetencyUpdate,
)

router = APIRouter(
    prefix="/trade-competencies",
    tags=["Trade Competencies"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/trade/{trade_id}", response_model=List[TradeCompetencyResponse])
def get_competencies_by_trade(trade_id: int, db: Session = Depends(get_db)):
    return (
        db.query(TradeCompetency)
        .filter(TradeCompetency.trade_id == trade_id)
        .order_by(TradeCompetency.id.asc())
        .all()
    )


@router.post("/", response_model=TradeCompetencyResponse)
def create_competency(data: TradeCompetencyCreate, db: Session = Depends(get_db)):
    competency = TradeCompetency(**data.model_dump())

    db.add(competency)
    db.commit()
    db.refresh(competency)

    return competency


@router.put("/{competency_id}", response_model=TradeCompetencyResponse)
def update_competency(
    competency_id: int,
    data: TradeCompetencyUpdate,
    db: Session = Depends(get_db),
):
    competency = (
        db.query(TradeCompetency).filter(TradeCompetency.id == competency_id).first()
    )

    if not competency:
        raise HTTPException(status_code=404, detail="Trade competency not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(competency, key, value)

    db.commit()
    db.refresh(competency)

    return competency


@router.delete("/{competency_id}")
def delete_competency(competency_id: int, db: Session = Depends(get_db)):
    competency = (
        db.query(TradeCompetency).filter(TradeCompetency.id == competency_id).first()
    )

    if not competency:
        raise HTTPException(status_code=404, detail="Trade competency not found")

    db.delete(competency)
    db.commit()

    return {"message": "Trade competency deleted successfully"}
