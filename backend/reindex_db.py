import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoSegment, Clip

def reset_analysis():
    """
    Resets the analysis data in the database.
    1. Deletes all VideoSegments (vectors).
    2. Deletes all Clips (search results).
    3. Resets 'processed' flag on Videos so they can be run again.
    """
    print("WARNING: This will delete all analysis data. Press Ctrl+C to cancel in 5 seconds...")
    import time
    time.sleep(5)
    
    from sqlmodel import text
    
    with Session(engine) as session:
        # Delete all segments
        print("Deleting video segments...")
        session.exec(text("DELETE FROM videosegment"))
        
        # Delete all clips
        print("Deleting clips...")
        session.exec(text("DELETE FROM clip")) # Assuming table name is 'clip' (lowercase class name usually)
        
        # Reset videos
        print("Resetting video status...")
        videos = session.exec(select(Video)).all()
        for video in videos:
            video.processed = False
            video.processing_progress = 0.0
            session.add(video)
            print(f"  -> Reset '{video.title}'")
            
        session.commit()
        print("Database reset complete. Please restart the backend and re-process your videos.")

if __name__ == "__main__":
    reset_analysis()
