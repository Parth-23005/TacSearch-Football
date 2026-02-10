"""
Quick test to see where processing is stuck
"""
import sys
import time

print("=" * 80)
print("QUICK PROCESSING TEST")
print("=" * 80)

print("\n[1/5] Importing modules...")
from backend.ai.processor import process_video_task
print("[OK] Modules imported")

print("\n[2/5] Starting processing...")
start_time = time.time()

try:
    process_video_task(1)
    elapsed = time.time() - start_time
    print(f"\n[OK] Processing completed in {elapsed:.1f}s")
except Exception as e:
    elapsed = time.time() - start_time
    print(f"\n[ERROR] Processing failed after {elapsed:.1f}s")
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
