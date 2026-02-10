from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, Form, HTTPException
from sqlmodel import Session, select
from ..database import get_session
from ..models import Video, Clip
from ..ai.processor import process_video_task
import shutil
import os
from typing import List

router = APIRouter()

import uuid

UPLOAD_DIR = "static/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
@router.get("", response_model=List[Video])
def list_videos(session: Session = Depends(get_session)):
    videos = session.exec(select(Video)).all()
    return videos

@router.get("/{video_id}", response_model=Video)
def get_video(video_id: int, session: Session = Depends(get_session)):
    video = session.get(Video, video_id)
    return video

@router.post("")
def create_video(
    background_tasks: BackgroundTasks,
    title: str = Form(...), 
    file: UploadFile = File(...), 
    session: Session = Depends(get_session)
):
    # Generate unique filename
    file_uuid = str(uuid.uuid4())
    # Keep extension
    ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_uuid}{ext}"
    file_location = f"{UPLOAD_DIR}/{safe_filename}"
    
    # Stream file to disk (memory efficient)
    try:
        with open(file_location, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    
    # Save to DB
    video = Video(title=title, filename=file.filename, filepath=file_location)
    session.add(video)
    session.commit()
    session.refresh(video)
    
    # Trigger background processing
    # Use loop.run_in_executor to avoid blocking main thread with sync CPU work
    import asyncio
    from concurrent.futures import ThreadPoolExecutor
    
    # Define wrapper for async execution
    async def run_processing_async(vid_id):
        loop = asyncio.get_running_loop()
        # Run in default executor (thread pool)
        await loop.run_in_executor(None, process_video_task, vid_id)

    background_tasks.add_task(run_processing_async, video.id)
    
    return {
        "filename": safe_filename,
        "id": str(video.id),
        "status": "processing_started",
        "url": f"http://localhost:8000/static/uploads/{safe_filename}"
    }

@router.delete("/{video_id}")
def delete_video(video_id: int, session: Session = Depends(get_session)):
    video = session.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Delete all segments for this video
    from ..models import VideoSegment
    from sqlmodel import select
    segments = session.exec(select(VideoSegment).where(VideoSegment.video_id == video_id)).all()
    for seg in segments:
        session.delete(seg)
    
    # Remove file
    if os.path.exists(video.filepath):
        try:
            os.remove(video.filepath)
        except Exception as e:
            print(f"Error deleting file: {e}")
            
    session.delete(video)
    session.commit()
    return {"status": "deleted"}
