"""
Direct test to process video 1 and capture all output
"""
from backend.ai.processor import process_video_task
import sys

print("=" * 80)
print("DIRECT VIDEO PROCESSING TEST")
print("=" * 80)

# Process video ID 1
video_id = 1
print(f"\nProcessing video {video_id}...")
print("-" * 80)

try:
    process_video_task(video_id)
    print("\n" + "=" * 80)
    print("PROCESSING COMPLETED")
    print("=" * 80)
except Exception as e:
    print("\n" + "=" * 80)
    print("PROCESSING FAILED WITH EXCEPTION")
    print("=" * 80)
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
