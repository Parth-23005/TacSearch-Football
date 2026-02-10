"""
Test saving a segment to the database
"""
from sqlmodel import Session
from backend.database import engine
from backend.models import VideoSegment

# Create a test segment
test_embedding = [-11.799, -4.318, 1.496] * 256  # 768 dims like football model

print("Creating test segment...")
segment = VideoSegment(
    video_id=1,
    start_time=0.0,
    end_time=15.0,
    embedding=test_embedding,
    text_description="test_action"
)

print(f"Segment created: {segment}")
print(f"Embedding type: {type(segment.embedding)}")
print(f"Embedding length: {len(segment.embedding)}")

print("\nSaving to database...")
try:
    with Session(engine) as session:
        session.add(segment)
        session.commit()
        print("[OK] Segment saved successfully!")
        print(f"Segment ID: {segment.id}")
except Exception as e:
    print(f"[FAIL] Error saving segment: {e}")
    import traceback
    traceback.print_exc()
