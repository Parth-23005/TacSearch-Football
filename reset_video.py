"""
Reset video processing status and trigger reprocessing
"""
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoSegment

print("=== Resetting Video Processing Status ===\n")

with Session(engine) as session:
    # Get Video 1
    video = session.get(Video, 1)
    
    if video:
        print(f"Video ID: {video.id}")
        print(f"Title: {video.title}")
        print(f"Current Progress: {video.processing_progress:.2f}")
        print(f"Current Processed: {video.processed}")
        
        # Delete all existing segments for this video
        segments = session.exec(
            select(VideoSegment).where(VideoSegment.video_id == video.id)
        ).all()
        
        print(f"\nDeleting {len(segments)} existing segments...")
        for seg in segments:
            session.delete(seg)
        
        # Reset video processing status
        video.processed = False
        video.processing_progress = 0.0
        
        session.add(video)
        session.commit()
        
        print("\n[OK] Video reset successfully!")
        print("Ready for reprocessing.")
    else:
        print("[ERROR] Video 1 not found!")

print("\nNow trigger reprocessing by calling process_video_task(1)")
