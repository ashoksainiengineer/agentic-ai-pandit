"""Alembic env.py — async SQLAlchemy with psycopg.

Reads the database URL from ``NEON_DATABASE_URL`` (env var) with a fallback
to ``sqlalchemy.url`` in ``alembic.ini`` so that tooling (CLI, CI, …) does
not require a full ``.env`` file with every secret.
"""

from __future__ import annotations

import asyncio
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Database URL — env var first, then ini fallback, then hard-coded default
# so that ``alembic revision --autogenerate`` works without .env.
database_url: str = (
    os.environ.get("NEON_DATABASE_URL")
    or config.get_main_option("sqlalchemy.url")
    or "postgresql+psycopg://u:p@localhost:5432/db"
)

# Import ALL models so autogenerate detects every table.
from app.db.models import Base  # noqa: E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Offline mode — emit SQL to stdout / file, no DB connection needed."""
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(database_url, poolclass=pool.NullPool)
    try:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
    finally:
        await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_async_migrations())
