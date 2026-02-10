from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoSegment, Video

def debug_db():
    print("--- Debugging Database Segments ---")
    with Session(engine) as session:
        # Get latest video
        video = session.exec(select(Video).order_by(Video.id.desc())).first()
        if not video:
            print("No videos found.")
            return

        print(f"Checking Video ID {video.id}: '{video.title}'")
        
        # Get segments
        segments = session.exec(select(VideoSegment).where(VideoSegment.video_id == video.id)).all()
        print(f"Total Segments: {len(segments)}")
        
        if segments:
            print("\nFirst 10 Segments:")
            for s in segments[:10]:
                print(f"ID: {s.id} | Time: {s.start_time:.1f}s - {s.end_time:.1f}s | Emb Len: {len(s.embedding)}")
            
            print("\nLast 5 Segments:")
            for s in segments[-5:]:
                print(f"ID: {s.id} | Time: {s.start_time:.1f}s - {s.end_time:.1f}s")
        else:
            print("WARNING: No segments found! Video might not be processed.")

if __name__ == "__main__":
    debug_db()
