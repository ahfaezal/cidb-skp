from fastapi import FastAPI
from sqlalchemy import inspect, text

from app.api.assessment_questions import router as assessment_questions_router
from app.api.cmcs import router as cmcs_router
from app.api.learning_packages import router as learning_packages_router
from app.api.module_content_blocks import router as module_content_blocks_router
from app.api.review_records import router as review_records_router
from app.api.question_builder import router as question_builder_router
from app.api.skp_modules import router as skp_modules_router
from app.api.trade_cmcs_mappings import router as trade_cmcs_mappings_router
from app.api.trade_competencies import router as trade_competencies_router
from app.api.trades import router as trades_router
from app.api.workflow_assignments import router as workflow_assignments_router
from app.db.database import Base, engine
from app.models import assessment_question
from app.models import cmcs
from app.models import learning_package
from app.models import module_content_block
from app.models import review_record
from app.models import question_builder_draft
from app.models import skp_module
from app.models import trade
from app.models import trade_cmcs_mapping
from app.models import trade_competency
from app.models import workflow_assignment

Base.metadata.create_all(bind=engine)


def ensure_trade_columns():
    inspector = inspect(engine)
    existing_columns = {column["name"] for column in inspector.get_columns("trades")}
    required_columns = {
        "category_code": "VARCHAR(50)",
        "category_name": "VARCHAR(255)",
        "field_title": "VARCHAR(255)",
        "facilitator_name": "VARCHAR(255)",
        "custom_category": "VARCHAR(255)",
        "custom_field_title": "VARCHAR(255)",
    }

    missing_columns = [
        (name, column_type)
        for name, column_type in required_columns.items()
        if name not in existing_columns
    ]

    if not missing_columns:
        return

    with engine.begin() as connection:
        for name, column_type in missing_columns:
            connection.execute(
                text(f"ALTER TABLE trades ADD COLUMN {name} {column_type}")
            )


ensure_trade_columns()


def ensure_cmcs_columns():
    inspector = inspect(engine)
    existing_columns = {column["name"] for column in inspector.get_columns("cmcs")}

    if "code" not in existing_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE cmcs ADD COLUMN code VARCHAR(50)"))
            connection.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS ix_cmcs_code ON cmcs (code)")
            )


ensure_cmcs_columns()

app = FastAPI(
    title="SKP-CIDB Builder API",
    description="Backend API for SKP-CIDB Module and Assessment Development System",
    version="0.1.0",
)

app.include_router(cmcs_router)
app.include_router(trades_router)
app.include_router(trade_cmcs_mappings_router)
app.include_router(trade_competencies_router)
app.include_router(workflow_assignments_router)
app.include_router(review_records_router)
app.include_router(module_content_blocks_router)
app.include_router(skp_modules_router)
app.include_router(learning_packages_router)
app.include_router(assessment_questions_router)
app.include_router(question_builder_router)

@app.get("/")
def root():
    return {
        "message": "SKP-CIDB Backend Running",
        "status": "ok"
    }
