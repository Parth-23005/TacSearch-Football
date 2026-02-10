from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoSegment
from backend.ai.processor import get_clip_engine
from backend.ai.smart_clipper import find_best_matches, isolate_peaks
import sys

def debug_compare(query1="goal", query2="foul"):
    print(f"--- Comparing '{query1}' vs '{query2}' ---")
    
    clip_engine = get_clip_engine()
    if not clip_engine: return
    
    from backend.ai.search import _expand_query, _average_embeddings

    with Session(engine) as session:
        segments = session.exec(select(VideoSegment)).all()
        if not segments: return
        
        segments_data = [{"embedding": s.embedding, "start_time": s.start_time, "end_time": s.end_time, "id": s.id} for s in segments]
        
        for q in [query1, query2]:
            print(f"\nQUERY: '{q}'")
            
            # Manually run the expansion logic from search.py to test it
            expanded_queries = _expand_query(q)
            print(f"  Expanded to: {expanded_queries}")
            
            all_template_embeddings = []
            for eq in expanded_queries:
                templates = [f"a photo showing {eq}", f"{eq}"]
                for t in templates:
                    all_template_embeddings.append(clip_engine.get_text_embedding(t))
            
            query_embed = _average_embeddings(all_template_embeddings)
            
            # Check matches at varied thresholds
            print("  Top Matches:")
            matches = find_best_matches(query_embed, segments_data, threshold=0.0) # Get all to see scores
            
            # Sort top 5
            top = sorted(matches, key=lambda x: x["score"], reverse=True)[:5]
            for m in top:
                 print(f"    {m['start_time']}s - {m['end_time']}s | Score: {m['score']:.4f}")

if __name__ == "__main__":
    q1 = sys.argv[1] if len(sys.argv) > 1 else "goal"
    q2 = sys.argv[2] if len(sys.argv) > 2 else "foul"
    debug_compare(q1, q2)
