import sys
import os
import json
import numpy as np
from sqlmodel import Session, select

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from backend.models import VideoSegment

def check_vectors():
    print("--- VECTOR SANITY CHECK ---")
    
    with Session(engine) as session:
        # Fetch first 5 segments
        segments = session.exec(select(VideoSegment).limit(5)).all()
        
        if not segments:
            print("❌ No segments found in DB. Please process a video first.")
            return

        print(f"Found {len(segments)} segments to sample.")
        
        embeddings = []
        for i, seg in enumerate(segments):
            # Handle both JSON string and list formats
            if isinstance(seg.embedding, str):
                vec = json.loads(seg.embedding)
            else:
                vec = seg.embedding
            
            embeddings.append(vec)
            print(f"Segment {i}: Time={seg.start_time}s, Vector Dim={len(vec)}, First 3 val={vec[:3]}")

        # Check Variance
        matrix = np.array(embeddings)
        variance = np.var(matrix, axis=0)
        mean_variance = np.mean(variance)
        
        print(f"\nMean Variance across dimensions: {mean_variance:.6f}")
        
        if mean_variance < 1e-5:
            print("\n⚠️ CRITICAL ERROR: All embeddings are identical!")
            print("Possible causes:")
            print("1. OpenCV is reading black/empty frames.")
            print("2. CLIP model is receiving bad input.")
            print("3. Database saved the same vector repeatedly.")
        else:
            print("\n✅ Embeddings look unique and healthy.")

if __name__ == "__main__":
    check_vectors()
