from sqlmodel import Session, select
from backend.database import engine
from backend.models import Video, VideoSegment

session = Session(engine)
v = session.get(Video, 1)
segs = session.exec(select(VideoSegment).where(VideoSegment.video_id == 1)).all()

print(f"Video 1 Progress: {v.processing_progress:.1f}%")
print(f"Segments created: {len(segs)}")
if segs:
    print(f"Latest segment action: {segs[-1].text_description}")
    
session.close()
