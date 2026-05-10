from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.trade import Trade
from app.schemas.trade import TradeCreate, TradeResponse, TradeUpdate

router = APIRouter(
    prefix="/trades",
    tags=["Trades"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[TradeResponse])
def get_all_trades(db: Session = Depends(get_db)):
    return db.query(Trade).order_by(Trade.id.asc()).all()


@router.post("/", response_model=TradeResponse)
def create_trade(data: TradeCreate, db: Session = Depends(get_db)):
    existing_trade = db.query(Trade).filter(Trade.code == data.code).first()

    if existing_trade:
        raise HTTPException(status_code=400, detail="Trade code already exists")

    new_trade = Trade(**data.model_dump())

    db.add(new_trade)
    db.commit()
    db.refresh(new_trade)

    return new_trade


@router.get("/{trade_id}", response_model=TradeResponse)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    return trade


@router.put("/{trade_id}", response_model=TradeResponse)
def update_trade(
    trade_id: int,
    data: TradeUpdate,
    db: Session = Depends(get_db),
):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    update_data = data.model_dump(exclude_unset=True)

    if "code" in update_data:
        existing_trade = (
            db.query(Trade)
            .filter(Trade.code == update_data["code"], Trade.id != trade_id)
            .first()
        )

        if existing_trade:
            raise HTTPException(status_code=400, detail="Trade code already exists")

    for key, value in update_data.items():
        setattr(trade, key, value)

    db.commit()
    db.refresh(trade)

    return trade


@router.delete("/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.query(Trade).filter(Trade.id == trade_id).first()

    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")

    db.delete(trade)
    db.commit()

    return {"message": "Trade deleted successfully"}
