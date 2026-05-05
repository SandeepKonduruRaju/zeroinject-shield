import os
from datetime import datetime

from dotenv import load_dotenv
from sqlalchemy import Boolean, Column, Float, Integer, String, Text, create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zeroinject.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
class Base(DeclarativeBase):
    pass


class AnalysisLog(Base):
    __tablename__ = "analysis_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, default=lambda: datetime.utcnow().isoformat())
    original_input = Column(Text)
    sanitized_input = Column(Text, nullable=True)
    verdict = Column(String)
    injection_score = Column(Float)
    was_sanitized = Column(Boolean, default=False)
    processing_time_ms = Column(Integer)
    agent1_verdict = Column(Text, nullable=True)
    agent2_verdict = Column(Text, nullable=True)
    agent3_verdict = Column(Text, nullable=True)
    mode = Column(String, default="strict")
    action_taken = Column(String, nullable=True)    # ALLOW / SANITIZE / BLOCK
    chatbot_response = Column(Text, nullable=True)  # Final output shown to user
    attack_type = Column(String, nullable=True)      # Extracted threat type from agent analysis
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())


class DemoRun(Base):
    __tablename__ = "demo_runs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, default=lambda: datetime.utcnow().isoformat())
    total_samples = Column(Integer)
    true_positives = Column(Integer)
    false_positives = Column(Integer)
    true_negatives = Column(Integer)
    false_negatives = Column(Integer)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)


def create_tables():
    Base.metadata.create_all(bind=engine)
    _migrate_columns()


def _migrate_columns():
    """Add new columns to existing tables if they don't exist (preserves data)."""
    inspector = inspect(engine)
    existing_cols = [col["name"] for col in inspector.get_columns("analysis_logs")]

    with engine.connect() as conn:
        if "action_taken" not in existing_cols:
            conn.execute(text("ALTER TABLE analysis_logs ADD COLUMN action_taken VARCHAR"))
            conn.commit()
        if "chatbot_response" not in existing_cols:
            conn.execute(text("ALTER TABLE analysis_logs ADD COLUMN chatbot_response TEXT"))
            conn.commit()
        if "attack_type" not in existing_cols:
            conn.execute(text("ALTER TABLE analysis_logs ADD COLUMN attack_type VARCHAR"))
            conn.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
