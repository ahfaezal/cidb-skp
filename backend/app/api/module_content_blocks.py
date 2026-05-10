from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.learning_package import LearningPackage
from app.models.module_content_block import ModuleContentBlock
from app.schemas.module_content_block import (
    ModuleContentBlockCreate,
    ModuleContentBlockResponse,
    ModuleContentBlockUpdate,
)

router = APIRouter(
    prefix="/module-content-blocks",
    tags=["Module Content Blocks"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/module/{module_id}", response_model=List[ModuleContentBlockResponse])
def get_blocks_by_module(module_id: int, db: Session = Depends(get_db)):
    package_ids = [
        package_id
        for (package_id,) in db.query(LearningPackage.id)
        .filter(LearningPackage.module_id == module_id)
        .all()
    ]

    return (
        db.query(ModuleContentBlock)
        .filter(
            (ModuleContentBlock.module_id == module_id)
            | (ModuleContentBlock.package_id.in_(package_ids))
        )
        .order_by(ModuleContentBlock.sort_order.asc(), ModuleContentBlock.id.asc())
        .all()
    )


@router.get("/package/{package_id}", response_model=List[ModuleContentBlockResponse])
def get_blocks_by_package(package_id: int, db: Session = Depends(get_db)):
    return (
        db.query(ModuleContentBlock)
        .filter(ModuleContentBlock.package_id == package_id)
        .order_by(ModuleContentBlock.sort_order.asc(), ModuleContentBlock.id.asc())
        .all()
    )


@router.post("/", response_model=ModuleContentBlockResponse)
def create_block(data: ModuleContentBlockCreate, db: Session = Depends(get_db)):
    block = ModuleContentBlock(**data.model_dump())

    db.add(block)
    db.commit()
    db.refresh(block)

    return block


@router.put("/{block_id}", response_model=ModuleContentBlockResponse)
def update_block(
    block_id: int,
    data: ModuleContentBlockUpdate,
    db: Session = Depends(get_db),
):
    block = db.query(ModuleContentBlock).filter(ModuleContentBlock.id == block_id).first()

    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(block, key, value)

    db.commit()
    db.refresh(block)

    return block


@router.delete("/{block_id}")
def delete_block(block_id: int, db: Session = Depends(get_db)):
    block = db.query(ModuleContentBlock).filter(ModuleContentBlock.id == block_id).first()

    if not block:
        raise HTTPException(status_code=404, detail="Content block not found")

    db.delete(block)
    db.commit()

    return {"message": "Content block deleted successfully"}
