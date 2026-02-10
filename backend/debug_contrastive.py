from sqlmodel import Session, select
from backend.database import engine
from backend.models import VideoSegment
from backend.ai.processor import get_clip_engine
import sys

def debug_contrastive(query="goal"):
    print(f"--- Contrastive Debug: '{query}' vs 'normal play' ---")
    
    clip_engine = get_clip_engine()
    if not clip_engine: return
    
    # 1. Embed Positive Query
    # Using the specific synonyms we defined in search.py would be best, 
    # but let's test the raw concept first.
    pos_text = f"football {query}"
    pos_embed = clip_engine.get_text_embedding(pos_text)
    
    # 2. Embed Negative/Generic Query
    # These are things we want to penalize
    neg_text = "football players running passing normal play midfield"
    neg_embed = clip_engine.get_text_embedding(neg_text)
    
    with Session(engine) as session:
        segments = session.exec(select(VideoSegment)).all()
        
        # We need raw access to cosine similarity
        from backend.ai.search import _cosine_similarity
        
        results = []
        for s in segments:
            # Raw scores
            score_pos = _cosine_similarity(pos_embed, s.embedding)
            score_neg = _cosine_similarity(neg_embed, s.embedding)
            
            # Contrastive Score: Boost specific, penalize generic
            # if score_pos is high but score_neg is ALSO high -> generic scene -> penalize
            # if score_pos is high and score_neg is lower -> specific event -> keep
            
            # Simple subtraction
            score_diff = score_pos - (0.8 * score_neg) 
            
            results.append({
                "time": f"{s.start_time}-{s.end_time}",
                "pos": score_pos,
                "neg": score_neg,
                "diff": score_diff
            })
            
        # Sort by DIFF
        print("\n--- TOP 10 BY CONTRASTIVE SCORE (Pos - 0.8*Neg) ---")
        top_diff = sorted(results, key=lambda x: x["diff"], reverse=True)[:10]
        for r in top_diff:
            print(f"[{r['time']}s] Diff: {r['diff']:.4f} (Pos: {r['pos']:.4f} | Neg: {r['neg']:.4f})")

        print("\n--- TOP 10 BY RAW POSITIVE SCORE (Old Way) ---")
        top_raw = sorted(results, key=lambda x: x["pos"], reverse=True)[:10]
        for r in top_raw:
            print(f"[{r['time']}s] Pos: {r['pos']:.4f}")

if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "goal"
    debug_contrastive(q)
