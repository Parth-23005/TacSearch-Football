"""
Debug script to check video processing status and errors
"""
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoSegment
import os

def check_processing_status():
    with Session(engine) as session:
        videos = session.exec(select(Video)).all()
        
        print(f"=== Video Processing Status ===\n")
        print(f"Total videos: {len(videos)}\n")
        
        for video in videos:
            segments = session.exec(
                select(VideoSegment).where(VideoSegment.video_id == video.id)
            ).all()
            
            print(f"Video ID: {video.id}")
            print(f"Title: {video.title}")
            print(f"File: {video.filepath}")
            print(f"File exists: {os.path.exists(video.filepath)}")
            print(f"Processed: {video.processed}")
            print(f"Progress: {video.processing_progress:.2f}")
            print(f"Segments: {len(segments)}")
            
            if segments:
                # Check first segment
                seg = segments[0]
                print(f"First segment action: {seg.text_description}")
            
            print("-" * 50)

if __name__ == "__main__":
    check_processing_status()
