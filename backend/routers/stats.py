from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db import crud
from db.database import get_db
from models.schemas import StatsResponse

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    return crud.get_stats(db)
