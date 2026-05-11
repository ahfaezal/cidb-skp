from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.db.database import engine, Base
from app.api.assessment_questions import router as assessment_questions_router
from app.api.cmcs import router as cmcs_router
from app.api.learning_packages import router as learning_packages_router
from app.api.mapping_groupings import router as mapping_groupings_router
from app.api.module_builder_ai import router as module_builder_ai_router
from app.api.module_content_blocks import router as module_content_blocks_router
from app.api.review_records import router as review_records_router
from app.api.skp_modules import router as skp_modules_router
from app.api.trade_cmcs_mappings import router as trade_cmcs_mappings_router
from app.api.trade_competencies import router as trade_competencies_router
from app.api.trades import router as trades_router
from app.api.workflow_assignments import router as workflow_assignments_router

from app.models.assessment_question import AssessmentQuestion
from app.models.cmcs import CMCS
from app.models.learning_package import LearningPackage
from app.models.mapping_grouping import MappingGrouping
from app.models.module_content_block import ModuleContentBlock
from app.models.review_record import ReviewRecord
from app.models.skp_module import SKPModule
from app.models.trade import Trade
from app.models.trade_cmcs_mapping import TradeCMCSMapping
from app.models.trade_competency import TradeCompetency
from app.models.workflow_assignment import WorkflowAssignment

from app.api.competency_units import router as competency_units_router
from app.models.competency_unit import CompetencyUnit

from app.api.work_activities import router as work_activities_router
from app.models.work_activity import WorkActivity

from app.api.performance_criteria import router as performance_criteria_router
from app.models.performance_criteria import PerformanceCriteria

from app.api.performance_criteria_items import router as performance_criteria_items_router
from app.models.performance_criteria_item import PerformanceCriteriaItem
from app.api.question_builder import router as question_builder_router

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
    title="SKP-CIDB Builder API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cmcs_router)
app.include_router(trades_router)
app.include_router(trade_cmcs_mappings_router)
app.include_router(trade_competencies_router)
app.include_router(workflow_assignments_router)
app.include_router(review_records_router)
app.include_router(module_content_blocks_router)
app.include_router(mapping_groupings_router)
app.include_router(module_builder_ai_router)
app.include_router(skp_modules_router)
app.include_router(learning_packages_router)
app.include_router(assessment_questions_router)
app.include_router(competency_units_router)
app.include_router(work_activities_router)
app.include_router(performance_criteria_router)
app.include_router(performance_criteria_items_router)
app.include_router(question_builder_router)


@app.get("/")
def root():
    return {
        "message": "SKP-CIDB Backend Running",
        "status": "ok",
    }
