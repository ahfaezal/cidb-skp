from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.skp_module import SKPModule
from app.schemas.skp_module import SKPModuleCreate, SKPModuleResponse, SKPModuleUpdate

router = APIRouter(
    prefix="/skp-modules",
    tags=["SKP Modules"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/trade/{trade_id}", response_model=List[SKPModuleResponse])
def get_modules_by_trade(trade_id: int, db: Session = Depends(get_db)):
    return (
        db.query(SKPModule)
        .filter(SKPModule.trade_id == trade_id)
        .order_by(SKPModule.id.asc())
        .all()
    )


@router.get("/", response_model=List[SKPModuleResponse])
def get_all_modules(db: Session = Depends(get_db)):
    return db.query(SKPModule).order_by(SKPModule.id.asc()).all()


@router.get("/{module_id}", response_model=SKPModuleResponse)
def get_module(module_id: int, db: Session = Depends(get_db)):
    module = db.query(SKPModule).filter(SKPModule.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="SKP module not found")

    return module


@router.post("/", response_model=SKPModuleResponse)
def create_module(data: SKPModuleCreate, db: Session = Depends(get_db)):
    module = SKPModule(**data.model_dump())

    db.add(module)
    db.commit()
    db.refresh(module)

    return module


@router.put("/{module_id}", response_model=SKPModuleResponse)
def update_module(module_id: int, data: SKPModuleUpdate, db: Session = Depends(get_db)):
    module = db.query(SKPModule).filter(SKPModule.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="SKP module not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(module, key, value)

    db.commit()
    db.refresh(module)

    return module


@router.delete("/{module_id}")
def delete_module(module_id: int, db: Session = Depends(get_db)):
    module = db.query(SKPModule).filter(SKPModule.id == module_id).first()

    if not module:
        raise HTTPException(status_code=404, detail="SKP module not found")

    db.delete(module)
    db.commit()

    return {"message": "SKP module deleted successfully"}
