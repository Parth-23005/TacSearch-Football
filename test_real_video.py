"""
Simple test to process just a few frames and see what happens
"""
import cv2
import numpy as np
from backend.ai.football_model import get_football_model
from backend.ai.clip_search import CLIPSearchEngine

# Test with a real video file
video_path = "static/uploads/5694dea6-c475-4356-a2f8-77b514f900e9.mp4"

print("Loading models...")
football_model = get_football_model()
clip = CLIPSearchEngine()

print(f"Football model loaded: {football_model.is_loaded() if football_model else False}")
print(f"CLIP loaded: {clip is not None}")

print("\nOpening video...")
cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
print(f"FPS: {fps}")

frame_buffer = []
frame_count = 0
max_frames = 50  # Only process 50 frames for testing

print("\nProcessing frames...")
while frame_count < max_frames:
    ret, frame = cap.read()
    if not ret:
        break
    
    frame_buffer.append(frame.copy())
    if len(frame_buffer) > 16:
        frame_buffer.pop(0)
    
    # Process every 15 frames (about 0.5s at 30fps)
    if frame_count % 15 == 0 and len(frame_buffer) >= 16:
        print(f"\nFrame {frame_count}:")
        
        # Try football model
        if football_model:
            try:
                embedding = football_model.get_action_embedding(frame_buffer[-16:])
                if embedding:
                    print(f"  [OK] Football embedding: {len(embedding)} dims, type: {type(embedding)}")
                    print(f"  [OK] First 3 values: {embedding[:3]}")
                else:
                    print(f"  [FAIL] Football embedding is None")
            except Exception as e:
                print(f"  [FAIL] Football error: {e}")
                import traceback
                traceback.print_exc()
        
        # Try CLIP
        if clip:
            try:
                embedding = clip.embed_frame(frame)
                if embedding:
                    print(f"  [OK] CLIP embedding: {len(embedding)} dims")
                else:
                    print(f"  [FAIL] CLIP embedding is None")
            except Exception as e:
                print(f"  [FAIL] CLIP error: {e}")
    
    frame_count += 1

cap.release()
print(f"\nProcessed {frame_count} frames")
