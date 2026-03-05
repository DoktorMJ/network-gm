import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.nodes import get_unique_types
from app.database import get_db
from app.schemas.common import TagsResponse

router = APIRouter()


@router.get("", response_model=TagsResponse)
async def list_types(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    types = await get_unique_types(db, campaign_id)
    return TagsResponse(tags=types)
