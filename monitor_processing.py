"""
Check what's happening with video processing
"""
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoSegment
import time

print("=== Monitoring Video Processing ===\n")

for i in range(10):  # Monitor for 10 iterations
    with Session(engine) as session:
        videos = session.exec(select(Video)).all()
        
        print(f"\n[{time.strftime('%H:%M:%S')}] Status:")
        for v in videos:
            segs = session.exec(select(VideoSegment).where(VideoSegment.video_id == v.id)).all()
            print(f"  Video {v.id}: {v.processing_progress*100:.1f}% - {len(segs)} segments")
            
            if segs:
                # Show latest segment
                latest = segs[-1]
                print(f"    Latest: {latest.start_time:.1f}s-{latest.end_time:.1f}s, action: {latest.text_description}")
    
    time.sleep(3)  # Wait 3 seconds between checks

print("\nMonitoring complete.")
