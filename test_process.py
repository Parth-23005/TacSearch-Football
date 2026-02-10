"""
Test script to manually process a video and see errors
"""
from backend.ai.processor import process_video_task
import sys

if __name__ == "__main__":
    video_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    print(f"Processing video ID: {video_id}")
    process_video_task(video_id)
