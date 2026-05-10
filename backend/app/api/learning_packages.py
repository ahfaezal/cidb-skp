from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.learning_package import LearningPackage
from app.schemas.learning_package import (
    LearningPackageCreate,
    LearningPackageResponse,
    LearningPackageUpdate,
)

router = APIRouter(
    prefix="/learning-packages",
    tags=["Learning Packages"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/module/{module_id}", response_model=List[LearningPackageResponse])
def get_packages_by_module(module_id: int, db: Session = Depends(get_db)):
    return (
        db.query(LearningPackage)
        .filter(LearningPackage.module_id == module_id)
        .order_by(LearningPackage.id.asc())
        .all()
    )


@router.post("/", response_model=LearningPackageResponse)
def create_package(data: LearningPackageCreate, db: Session = Depends(get_db)):
    package = LearningPackage(**data.model_dump())

    db.add(package)
    db.commit()
    db.refresh(package)

    return package


@router.put("/{package_id}", response_model=LearningPackageResponse)
def update_package(
    package_id: int,
    data: LearningPackageUpdate,
    db: Session = Depends(get_db),
):
    package = db.query(LearningPackage).filter(LearningPackage.id == package_id).first()

    if not package:
        raise HTTPException(status_code=404, detail="Learning package not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(package, key, value)

    db.commit()
    db.refresh(package)

    return package


@router.delete("/{package_id}")
def delete_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(LearningPackage).filter(LearningPackage.id == package_id).first()

    if not package:
        raise HTTPException(status_code=404, detail="Learning package not found")

    db.delete(package)
    db.commit()

    return {"message": "Learning package deleted successfully"}
