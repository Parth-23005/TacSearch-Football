from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoSegment
from backend.ai.processor import get_clip_engine
from backend.ai.smart_clipper import find_best_matches
import sys


def debug_compare(query1="goal", query2="shot"):
    print(f"--- Comparing '{query1}' vs '{query2}' ---")
    
    clip_engine = get_clip_engine()
    if not clip_engine: return

    # Embed both
    # We need to manually replicate the search logic (prompts) to see what's happening
    # But for raw debug, let's use the search_video function logic if possible, 
    # OR just check raw embeddings first.
    
    # Actually, let's just run find_best_matches on both and print the TOP SCORING segment for each.
    
    # ... (Fetching segments code redundant, assume loaded) ...
    # For brevity in this tool call, I'll just rewrite the main block to load once and loop queries.
    
    with Session(engine) as session:
        segments = session.exec(select(VideoSegment)).all()
        if not segments: return
        
        segments_data = [{"embedding": s.embedding, "start_time": s.start_time, "end_time": s.end_time} for s in segments]
        
        for q in [query1, query2]:
            print(f"\nQuery: '{q}'")
            # Mimic search.py expansion (simplified)
            context_q = f"football {q}" 
            emb = clip_engine.get_text_embedding(context_q)
            
            matches = find_best_matches(emb, segments_data, threshold=0.0)
            top = sorted(matches, key=lambda x: x["score"], reverse=True)[:5]
            for m in top:
                 print(f"  {m['start_time']}s - {m['end_time']}s | Score: {m['score']:.4f}")

if __name__ == "__main__":
    q1 = sys.argv[1] if len(sys.argv) > 1 else "goal"
    q2 = sys.argv[2] if len(sys.argv) > 2 else "shot"
    debug_compare(q1, q2)
