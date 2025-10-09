"""API endpoints for viewing application logs (superuser only)."""
import logging
from collections import deque
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.api.deps import CurrentUser
from app.models import UserPermission

router = APIRouter(prefix="/logs", tags=["logs"])

# In-memory log buffer (stores last 1000 log entries)
log_buffer: deque = deque(maxlen=1000)


class LogEntry(BaseModel):
    """Log entry model."""
    timestamp: str
    level: str
    logger: str
    message: str


class LogBufferHandler(logging.Handler):
    """Custom logging handler that stores logs in memory."""
    
    def emit(self, record: logging.LogRecord) -> None:
        """Store log record in buffer."""
        try:
            log_entry = {
                "timestamp": datetime.fromtimestamp(record.created).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": self.format(record)
            }
            log_buffer.append(log_entry)
        except Exception:
            self.handleError(record)


# Initialize the log buffer handler
def setup_log_buffer() -> None:
    """Setup the log buffer handler."""
    buffer_handler = LogBufferHandler()
    buffer_handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(message)s')
    buffer_handler.setFormatter(formatter)
    
    # Add to root logger to catch all logs
    root_logger = logging.getLogger()
    root_logger.addHandler(buffer_handler)


@router.get("/recent")
async def get_recent_logs(
    current_user: CurrentUser,
    limit: int = 100,
    level: str | None = None
) -> dict[str, Any]:
    """
    Get recent application logs (superuser only).
    
    Args:
        limit: Maximum number of log entries to return (default 100, max 1000)
        level: Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    if UserPermission.SUPERUSER not in current_user.permissions:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can access logs"
        )
    
    # Limit the maximum
    limit = min(limit, 1000)
    
    # Get logs from buffer (most recent first)
    logs = list(log_buffer)
    logs.reverse()  # Most recent first
    
    # Filter by level if specified
    if level:
        level = level.upper()
        logs = [log for log in logs if log["level"] == level]
    
    # Apply limit
    logs = logs[:limit]
    
    return {
        "total": len(logs),
        "limit": limit,
        "level_filter": level,
        "logs": logs
    }


@router.delete("/clear")
async def clear_logs(current_user: CurrentUser) -> dict[str, str]:
    """Clear the log buffer (superuser only)."""
    if UserPermission.SUPERUSER not in current_user.permissions:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can clear logs"
        )
    
    log_buffer.clear()
    return {"message": "Log buffer cleared"}


@router.get("/stats")
async def get_log_stats(current_user: CurrentUser) -> dict[str, Any]:
    """Get log statistics (superuser only)."""
    if UserPermission.SUPERUSER not in current_user.permissions:
        raise HTTPException(
            status_code=403,
            detail="Only superusers can access log stats"
        )
    
    logs = list(log_buffer)
    
    # Count by level
    level_counts = {}
    for log in logs:
        level = log["level"]
        level_counts[level] = level_counts.get(level, 0) + 1
    
    return {
        "total_entries": len(logs),
        "buffer_capacity": log_buffer.maxlen,
        "level_counts": level_counts,
        "oldest_entry": logs[0]["timestamp"] if logs else None,
        "newest_entry": logs[-1]["timestamp"] if logs else None,
    }
