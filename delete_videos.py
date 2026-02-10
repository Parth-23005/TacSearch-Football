"""
Script to delete all videos and segments from the database
"""
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoSegment

def delete_all_videos():
    with Session(engine) as session:
        # Get all videos
        videos = session.exec(select(Video)).all()
        
        print(f"Found {len(videos)} video(s)")
        
        for video in videos:
            # Delete all segments for this video
            segments = session.exec(
                select(VideoSegment).where(VideoSegment.video_id == video.id)
            ).all()
            
            print(f"Deleting video '{video.title}' and {len(segments)} segments...")
            
            for segment in segments:
                session.delete(segment)
            
            session.delete(video)
        
        session.commit()
        print("✓ All videos deleted successfully!")

if __name__ == "__main__":
    delete_all_videos()
