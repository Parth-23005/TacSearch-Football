"""
Debug script to test football model and processor logic
"""
import cv2
import numpy as np
from backend.ai.football_model import get_football_model
from backend.ai.yolo_tracker import YOLOTracker
from backend.ai.clip_search import CLIPSearchEngine

def test_models():
    print("=== Testing AI Models ===\n")
    
    # Test Football Model
    print("1. Testing Football Model...")
    football_model = get_football_model()
    if football_model and football_model.is_loaded():
        print("   [OK] Football model loaded")
        
        # Create dummy frames
        dummy_frames = [np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8) for _ in range(16)]
        
        try:
            embedding = football_model.get_action_embedding(dummy_frames)
            if embedding:
                print(f"   [OK] Embedding generated: {len(embedding)} dimensions")
                print(f"   [OK] Embedding type: {type(embedding)}")
                print(f"   [OK] First 5 values: {embedding[:5]}")
            else:
                print("   [FAIL] Embedding is None!")
        except Exception as e:
            print(f"   [FAIL] Error generating embedding: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("   [FAIL] Football model failed to load")
    
    # Test YOLO
    print("\n2. Testing YOLO...")
    try:
        yolo = YOLOTracker()
        print("   [OK] YOLO loaded")
        
        # Test with dummy frame
        dummy_frame = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        count = yolo.count_players(dummy_frame)
        print(f"   [OK] Player count (dummy): {count}")
    except Exception as e:
        print(f"   [FAIL] YOLO error: {e}")
    
    # Test CLIP
    print("\n3. Testing CLIP...")
    try:
        clip = CLIPSearchEngine()
        print("   [OK] CLIP loaded")
        
        # Test with dummy frame
        dummy_frame = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        embedding = clip.embed_frame(dummy_frame)
        if embedding:
            print(f"   [OK] CLIP embedding: {len(embedding)} dimensions")
        else:
            print("   [FAIL] CLIP embedding is None!")
    except Exception as e:
        print(f"   [FAIL] CLIP error: {e}")

if __name__ == "__main__":
    test_models()

