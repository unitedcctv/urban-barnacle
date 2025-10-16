"""Background scheduler for periodic tasks"""
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlmodel import Session

from app.core.db import engine
from app.services.social_media import SocialMediaService

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def fetch_social_media_posts():
    """Background task to fetch social media posts every 5 minutes"""
    logger.info("Starting social media posts fetch...")
    
    with Session(engine) as db:
        service = SocialMediaService(db)
        try:
            await service.fetch_all_posts()
            logger.info("Successfully fetched social media posts")
        except Exception as e:
            logger.error(f"Error fetching social media posts: {e}")


def start_scheduler():
    """Start the background scheduler"""
    # Add job to fetch social media posts every 5 minutes
    scheduler.add_job(
        fetch_social_media_posts,
        trigger=IntervalTrigger(minutes=5),
        id="fetch_social_media",
        name="Fetch social media posts",
        replace_existing=True,
    )
    
    scheduler.start()
    logger.info("Scheduler started successfully")


def shutdown_scheduler():
    """Shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler shut down successfully")
