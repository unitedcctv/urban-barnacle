"""Create database tables using SQLModel."""
import logging

from sqlmodel import SQLModel, create_engine

from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_tables() -> None:
    """Create all tables in the database."""
    # Import all models to ensure they're registered
    from app import models  # noqa: F401
    
    logger.info(f"Creating tables in database: {settings.SQLALCHEMY_DATABASE_URI}")
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    # Create all tables
    SQLModel.metadata.create_all(engine)
    logger.info("Tables created successfully")


if __name__ == "__main__":
    create_tables()
