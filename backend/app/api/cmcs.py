from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import SessionLocal
from app.models.cmcs import CMCS
from app.models.competency_unit import CompetencyUnit
from app.models.performance_criteria import PerformanceCriteria
from app.models.performance_criteria_item import PerformanceCriteriaItem
from app.models.work_activity import WorkActivity
from app.schemas.cmcs import (
    CMCSCreate,
    CMCSUpdate,
    CMCSResponse
)
from app.data.official_cmcs import OFFICIAL_CMCS_DATA, OFFICIAL_CMCS_SOURCE

router = APIRouter(
    prefix="/cmcs",
    tags=["CMCS"]
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[CMCSResponse])
def get_all_cmcs(db: Session = Depends(get_db)):
    return db.query(CMCS).order_by(CMCS.code.asc().nullslast(), CMCS.id.asc()).all()


@router.post("/", response_model=CMCSResponse)
def create_cmcs(
    data: CMCSCreate,
    db: Session = Depends(get_db)
):
    if data.code:
        existing = db.query(CMCS).filter(CMCS.code == data.code).first()
        if existing:
            raise HTTPException(status_code=400, detail="CMCS code already exists")

    new_cmcs = CMCS(**data.model_dump())

    db.add(new_cmcs)

    db.commit()

    db.refresh(new_cmcs)

    return new_cmcs


def get_official_import_summary():
    competencies = []

    for cmcs in OFFICIAL_CMCS_DATA:
        unit_count = len(cmcs["units"])
        knowledge_count = sum(len(unit["knowledge"]) for unit in cmcs["units"])

        competencies.append(
            {
                "code": cmcs["code"],
                "title": cmcs["title"],
                "description": cmcs["description"],
                "objective": cmcs["objective"],
                "unit_count": unit_count,
                "knowledge_count": knowledge_count,
            }
        )

    return {
        "source": OFFICIAL_CMCS_SOURCE,
        "competency_count": len(competencies),
        "unit_count": sum(item["unit_count"] for item in competencies),
        "knowledge_count": sum(item["knowledge_count"] for item in competencies),
        "competencies": competencies,
    }


@router.get("/official-import/preview")
def preview_official_cmcs_import():
    return get_official_import_summary()


@router.post("/official-import")
def import_official_cmcs(db: Session = Depends(get_db)):
    imported = []

    for cmcs_data in OFFICIAL_CMCS_DATA:
        item = db.query(CMCS).filter(CMCS.code == cmcs_data["code"]).first()

        if not item:
            item = (
                db.query(CMCS)
                .filter(CMCS.title.ilike(cmcs_data["title"]))
                .first()
            )

        description = (
            f"{cmcs_data['description']}\n\n"
            f"Module Objective: {cmcs_data['objective']}"
        )

        if item:
            item.code = cmcs_data["code"]
            item.title = cmcs_data["title"]
            item.description = description
            item.level = "Level 5"
            item.sector = "Construction"
        else:
            item = CMCS(
                code=cmcs_data["code"],
                title=cmcs_data["title"],
                description=description,
                level="Level 5",
                sector="Construction",
            )
            db.add(item)
            db.flush()

        existing_units = (
            db.query(CompetencyUnit)
            .filter(CompetencyUnit.cmcs_id == item.id)
            .all()
        )
        for unit in existing_units:
            db.delete(unit)
        db.flush()

        for unit_data in cmcs_data["units"]:
            unit = CompetencyUnit(
                cmcs_id=item.id,
                code=unit_data["code"],
                title=unit_data["title"],
                description=f"Official CMCS module content under {cmcs_data['code']}.",
            )
            db.add(unit)
            db.flush()

            activity = WorkActivity(
                competency_unit_id=unit.id,
                code=unit_data["code"].replace("CM", "WA"),
                title=unit_data["title"],
                description="Imported from official CMCS knowledge table.",
            )
            db.add(activity)
            db.flush()

            criteria = PerformanceCriteria(
                work_activity_id=activity.id,
                criteria="Knowledge requirements from official CMCS.",
            )
            db.add(criteria)
            db.flush()

            for knowledge in unit_data["knowledge"]:
                db.add(
                    PerformanceCriteriaItem(
                        performance_criteria_id=criteria.id,
                        type="Knowledge",
                        content=knowledge,
                    )
                )

        imported.append(
            {
                "code": cmcs_data["code"],
                "title": cmcs_data["title"],
                "unit_count": len(cmcs_data["units"]),
            }
        )

    db.commit()

    return {
        "message": "Official CMCS imported successfully",
        "summary": get_official_import_summary(),
        "imported": imported,
    }


@router.get("/{cmcs_id}", response_model=CMCSResponse)
def get_cmcs(
    cmcs_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(CMCS).filter(
        CMCS.id == cmcs_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="CMCS not found"
        )

    return item


@router.put("/{cmcs_id}", response_model=CMCSResponse)
def update_cmcs(
    cmcs_id: int,
    data: CMCSUpdate,
    db: Session = Depends(get_db)
):
    item = db.query(CMCS).filter(
        CMCS.id == cmcs_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="CMCS not found"
        )

    update_data = data.model_dump(
        exclude_unset=True
    )

    if "code" in update_data and update_data["code"]:
        existing = (
            db.query(CMCS)
            .filter(CMCS.code == update_data["code"], CMCS.id != cmcs_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="CMCS code already exists")

    for key, value in update_data.items():
        setattr(item, key, value)

    db.commit()

    db.refresh(item)

    return item


@router.delete("/{cmcs_id}")
def delete_cmcs(
    cmcs_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(CMCS).filter(
        CMCS.id == cmcs_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="CMCS not found"
        )

    db.delete(item)

    db.commit()

    return {
        "message": "Deleted successfully"
    }
