# Real-Time Log Viewer for Superusers

## Overview

A secure, real-time log viewing system accessible via HTTP for superusers to debug issues in production/staging without SSH access.

## Features

✅ **In-Memory Log Buffer** - Stores last 1000 log entries  
✅ **Real-Time Updates** - Auto-refreshes every 5 seconds  
✅ **Level Filtering** - Filter by DEBUG, INFO, WARNING, ERROR, CRITICAL  
✅ **Superuser Only** - Secured with authentication checks  
✅ **Color-Coded Logs** - Easy visual identification of log levels  
✅ **Statistics Dashboard** - View log counts by level  
✅ **Clear Buffer** - Reset logs when needed  

## Architecture

### Backend (`backend/app/api/routes/logs.py`)

**Custom Log Handler:**
```python
class LogBufferHandler(logging.Handler)
```
- Captures all logs from the application
- Stores in thread-safe deque (max 1000 entries)
- Automatically rotates oldest logs

**API Endpoints:**

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/v1/logs/recent` | GET | Get recent logs with optional filtering | Superuser |
| `/api/v1/logs/clear` | DELETE | Clear the log buffer | Superuser |
| `/api/v1/logs/stats` | GET | Get log statistics | Superuser |

**Query Parameters:**
- `limit` (default: 100, max: 1000) - Number of logs to return
- `level` (optional) - Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

### Frontend (`frontend/src/routes/_layout/logs.tsx`)

**Features:**
- Real-time log table with color-coded levels
- Dropdown filters for limit and level
- Auto-refresh every 5 seconds
- Statistics bar showing log counts
- Clear buffer button
- Mobile-responsive design

**Navigation:**
- Automatically appears in navigation menu for superusers
- Icon: FiFileText (file/document icon)

## Setup & Deployment

### 1. Deploy Backend Changes

```bash
# The logs API is already integrated
git add backend/app/api/routes/logs.py
git add backend/app/api/main.py  
git add backend/app/main.py
git commit -m "feat: add real-time log viewer for superusers"
git push origin main
```

### 2. Regenerate OpenAPI Client (After Backend Deployment)

Once the backend is deployed with the new endpoints:

```bash
cd frontend
npm run generate-client
```

This will generate `LogsService` in the TypeScript client with methods:
- `logsGetRecentLogs({ limit?, level? })`
- `logsClearLogs()`
- `logsGetLogStats()`

### 3. Deploy Frontend Changes

```bash
git add frontend/src/routes/_layout/logs.tsx
git add frontend/src/components/Common/NavigationItems.tsx
git add backend/app/api/routes/navigation.py
git commit -m "feat: add logs viewer page for superusers"
git push origin main
```

## Usage

### Accessing the Logs Viewer

1. **Login as Superuser** - Regular users won't see the link
2. **Click "Logs"** in the navigation menu
3. **View Real-Time Logs** - Automatically refreshes every 5 seconds

### Debugging Staging Issues

**Example: Debug Image Upload Issue**

1. Navigate to `/logs` page
2. Set filter to "ERROR" level
3. Try uploading an image in another tab
4. Watch logs page for error messages
5. Error will show with full details:
   ```
   ERROR: BunnyCDN upload failed with status 401: Unauthorized
   ```

### Filtering Logs

**By Limit:**
- Last 50 logs
- Last 100 logs (default)
- Last 200 logs
- Last 500 logs
- Last 1000 logs (maximum buffer size)

**By Level:**
- All Levels (default)
- DEBUG - Detailed debugging information
- INFO - General informational messages
- WARNING - Warning messages
- ERROR - Error messages
- CRITICAL - Critical issues

### Clearing Logs

Click the "Clear Buffer" button to reset all stored logs. Useful when:
- Testing specific functionality
- After fixing an issue
- Buffer is full of old logs

## Security

**Authentication:** All endpoints require `CurrentUser` with `is_superuser=True`

**Authorization Check:**
```python
if not current_user.is_superuser:
    raise HTTPException(status_code=403, detail="Only superusers can access logs")
```

**No Sensitive Data:** Logs are already sanitized by the application. Don't log:
- Passwords
- API keys
- Tokens
- Personal data

## Performance

**Memory Usage:**
- ~1MB for 1000 log entries
- Automatically rotates (FIFO)
- No disk I/O required

**Network:**
- Auto-refresh every 5 seconds
- ~50KB per request (100 logs)
- Only when page is active

## Limitations

1. **In-Memory Only** - Logs lost on restart
2. **Per-Instance** - Each backend instance has its own buffer
3. **1000 Entry Limit** - Oldest logs automatically removed
4. **Not Searchable** - Use external logging service for long-term storage

## Future Enhancements

Potential improvements:
- [ ] WebSocket for real-time streaming
- [ ] Search/filter by message content
- [ ] Export logs to file
- [ ] Integration with external logging (Sentry, LogDNA)
- [ ] Multi-instance log aggregation

## Troubleshooting

### "Error loading logs" message

**Cause:** Not logged in or not a superuser  
**Fix:** Login with superuser account

### LogsService not found (TypeScript error)

**Cause:** OpenAPI client not regenerated after backend deployment  
**Fix:** Run `npm run generate-client` in frontend directory

### Logs not updating

**Cause:** Auto-refresh might be paused  
**Fix:** Click "Refresh" button manually

### Missing recent logs

**Cause:** Buffer might be full (1000 entry limit)  
**Fix:** Clear buffer and test again

## Example: Debugging Staging Image Upload

**Before (Without Logs Viewer):**
```
❌ 500 Internal Server Error
❌ No details visible
❌ Need SSH access to server
❌ Need to check log files
```

**After (With Logs Viewer):**
```
✅ Navigate to /logs page
✅ Set filter to ERROR level  
✅ Try upload → see error immediately:
   "BunnyCDN upload failed with status 401: Unauthorized"
✅ Fix: Update BUNNYCDN_API_KEY in environment
```

## Testing Locally

```bash
# Start backend
docker compose up backend

# In browser (as superuser):
http://localhost:5173/logs

# Trigger some log entries:
# - Upload an image
# - Create an item
# - Call any API endpoint

# Watch logs appear in real-time
```

---

## Summary

This log viewer significantly improves debugging capabilities for staging/production environments by:

1. **Eliminating SSH Requirements** - View logs directly in browser
2. **Real-Time Visibility** - See errors as they happen
3. **Quick Troubleshooting** - Filter and find issues fast
4. **Secure Access** - Only superusers can access
5. **Zero Infrastructure** - No external logging service needed

Perfect for debugging the current staging image upload issue! 🎯
