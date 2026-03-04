import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from main import app

# Inside Docker the DB host is "db"; outside it's "localhost"
_base_url = os.environ.get("DATABASE_URL", "postgresql://postgres:password@db:5432/network_gm")
TEST_DATABASE_URL = _base_url.replace("postgresql://", "postgresql+asyncpg://", 1).replace(
    "/network_gm", "/network_gm_test"
)

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

# Tables we want to truncate between tests (order respects FK constraints)
_TABLES = ["edges", "nodes"]


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    """Create schema once for the whole test session."""
    async with test_engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(autouse=True)
async def clear_tables():
    """Truncate data tables before each test for isolation."""
    async with test_engine.begin() as conn:
        for table in _TABLES:
            await conn.execute(text(f"TRUNCATE {table} CASCADE"))
    yield


@pytest_asyncio.fixture(autouse=True)
async def override_db():
    """Point FastAPI's get_db dependency at the test database."""
    async def _get_test_db():
        async with test_session() as session:
            yield session

    app.dependency_overrides[get_db] = _get_test_db
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c


CAMPAIGN_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
OTHER_CAMPAIGN_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
