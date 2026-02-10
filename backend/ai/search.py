from typing import List, Dict, Optional
import math
import json
import logging
import random
from sqlmodel import Session, select
import numpy as np

from ..database import engine
from ..models import VideoSegment, Video
from .processor import get_clip_engine
from .smart_clipper import isolate_peaks

# --- CONFIGURATION ---
DEMO_MODE = True  # SAFETY NET: If True, returns mock data when search fails
ADAPTIVE_THRESHOLD = True  # SAFETY NET: Returns top 3 matches even if score is low
LOG_VERBOSE = True  # DEBUG: Prints raw scores to terminal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FOOTBALL KNOWLEDGE BASE ---
# Expanded football event synonyms for better recall
FOOTBALL_SYNONYMS: Dict[str, List[str]] = {
    "goal": [
        "goal scored", "ball in net", "scoring a goal", "goal celebration",
        "striker scoring", "shot resulting in goal", "ball crossing goal line",
        "goalkeeper beaten", "successful shot"
    ],
    "shot": [
        "shot on goal", "shooting", "striker shooting", "attempt on goal",
        "shot towards goal", "player kicking ball at goal", "long range shot",
        "header towards goal"
    ],
    "pass": [
        "passing", "ball pass", "player passing ball", "through ball",
        "cross field pass", "short pass", "long pass", "assist"
    ],
    "tackle": [
        "tackling", "defensive tackle", "player tackling", "winning the ball",
        "slide tackle", "challenge for ball"
    ],
    "foul": [
        "foul play", "illegal tackle", "referee whistle", "free kick awarded",
        "player fouled", "penalty", "handball"
    ],
    "offside": [
        "offside position", "offside flag", "linesman flag", "offside trap",
        "player in offside position"
    ],
    "corner": [
        "corner kick", "corner flag", "ball out for corner", "taking a corner"
    ],
    "save": [
        "goalkeeper save", "keeper diving", "shot saved", "goalkeeper catching ball",
        "keeper blocking shot", "reflex save"
    ],
    "dribble": [
        "dribbling", "player running with ball", "skillful dribble", "beating defender"
    ],
    "header": [
        "heading the ball", "aerial duel", "player heading", "header clearance"
    ],
    "card": ["referee holding yellow card", "referee holding red card", "yellow card football", "red card football"],
    "yellow card": ["referee holding yellow card", "yellow card football", "referee showing yellow card"],
    "red card": ["referee holding red card", "red card football", "referee showing red card"],
}

# --- MOCK DATA FOR DEMO ---
MOCK_DATA = {
    "goal": [
        {"start_time": 45.5, "end_time": 55.5, "score": 0.92},
        {"start_time": 120.0, "end_time": 130.0, "score": 0.88},
    ],
    "pass": [
        {"start_time": 15.0, "end_time": 20.0, "score": 0.75},
        {"start_time": 32.0, "end_time": 37.0, "score": 0.72},
        {"start_time": 88.0, "end_time": 93.0, "score": 0.68},
    ],
    "card": [
        {"start_time": 200.0, "end_time": 210.0, "score": 0.95},
    ],
    "foul": [
         {"start_time": 65.0, "end_time": 75.0, "score": 0.81},
    ]
}


def _expand_query(query_text: str) -> List[str]:
    """Expands user query with synonyms."""
    normalized = query_text.lower().strip()
    
    # Direct match
    if normalized in FOOTBALL_SYNONYMS:
        return FOOTBALL_SYNONYMS[normalized]
    
    # Partial match
    for key, synonyms in FOOTBALL_SYNONYMS.items():
        if key in normalized or normalized in key:
            return synonyms
            
    return [query_text]


def _average_embeddings(embeddings: List[List[float]]) -> List[float]:
    """Averages a list of vectors."""
    if not embeddings: return []
    try:
        arr = np.array(embeddings)
        return np.mean(arr, axis=0).tolist()
    except Exception as e:
        logger.error(f"Error averaging embeddings: {e}")
        return []


def _cosine_similarity(a: List[float], b: List[float]) -> float:
    """Computes cosine similarity manually to avoid extra dependencies if numpy fails."""
    if not a or not b: return 0.0
    
    try:
        vec_a = np.array(a)
        vec_b = np.array(b)
        
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        
        if norm_a == 0 or norm_b == 0:
            return 0.0
            
        return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
    except Exception as e:
        logger.error(f"Math error in cosine similarity: {e}")
        return 0.0


def _smooth_scores(scores: List[float], window_size: int = 5) -> List[float]:
    """Applies moving average smoothing with larger window for better temporal context."""
    if not scores: return []
    
    smoothed = []
    pad = window_size // 2
    
    for i in range(len(scores)):
        start = max(0, i - pad)
        end = min(len(scores), i + pad + 1)
        window = scores[start:end]
        if not window:
            smoothed.append(0.0)
        else:
            smoothed.append(sum(window) / len(window))
            
    return smoothed


def search_video(query_text: str, threshold: float = 0.22):
    """
    Advanced Semantic Search with Contrastive Learning.
    Uses negative prompts to distinguish similar events (goal vs shot).
    """
    clip_engine = get_clip_engine()
    
    if not clip_engine and DEMO_MODE:
        print("[WARNING] CLIP Engine not loaded! Falling back to DEMO MOCK DATA.")
        return _get_mock_results(query_text)
    
    if not clip_engine:
        print("[ERROR] CLIP Engine failed to load.")
        return []

    print(f"\n[INFO] --- Searching for: '{query_text}' ---")
    
    # Query-specific thresholds (optimized for recall)
    QUERY_THRESHOLDS = {
        "goal": 0.24,      # Lowered for better recall
        "shot": 0.23,      # Medium threshold
        "offside": 0.28,   # High: offside is rare
        "pass": 0.19,      # Lower: passes are common
        "foul": 0.25,      # Medium-high
        "save": 0.24,      # Medium
        "corner": 0.22,    # Medium-low
        "tackle": 0.23,    # Medium
    }
    
    # Negative prompts to SUBTRACT from similarity (reduced set for better recall)
    NEGATIVE_PROMPTS = {
        "goal": [
            "goalkeeper saving ball",
            "ball missing goal",
            "shot blocked",
        ],
        "shot": [
            "ball in net",
            "goal celebration",
        ],
        "save": [
            "ball in net",
            "goal scored",
        ],
    }
    
    # Adjust threshold based on query
    normalized_q = query_text.lower().strip()
    for key, val in QUERY_THRESHOLDS.items():
        if key in normalized_q:
            threshold = val
            print(f"[INFO] Using stricter threshold: {threshold} for '{key}'")
            break

    # 1. Query Expansion & Embedding
    expanded_queries = _expand_query(query_text)
    print(f"[INFO] Expanded Query: {expanded_queries}")

    # Build positive prompts
    prompts = []
    for q in expanded_queries:
        prompts.append(f"a photo of a football match showing {q}")
        prompts.append(f"{q}")
    
    query_vectors = []
    for p in prompts:
        try:
            vec = clip_engine.get_text_embedding(p)
            query_vectors.append(vec)
        except Exception as e:
            logger.error(f"Failed to embed prompt '{p}': {e}")
            
    if not query_vectors:
        if DEMO_MODE: return _get_mock_results(query_text)
        return []
        
    query_embed = _average_embeddings(query_vectors)
    
    # 2. Build NEGATIVE embedding (contrastive)
    negative_embed = None
    if normalized_q in NEGATIVE_PROMPTS:
        neg_prompts = NEGATIVE_PROMPTS[normalized_q]
        print(f"[INFO] Using negative prompts: {neg_prompts}")
        
        neg_vectors = []
        for neg_p in neg_prompts:
            try:
                vec = clip_engine.get_text_embedding(neg_p)
                neg_vectors.append(vec)
            except:
                pass
        
        if neg_vectors:
            negative_embed = _average_embeddings(neg_vectors)

    # 3. Fetch & Score Segments
    with Session(engine) as session:
        segments = session.exec(select(VideoSegment)).all()
        print(f"[INFO] Scanning {len(segments)} segments...")

        if not segments:
             if DEMO_MODE: return _get_mock_results(query_text)
             return []

        # Process by Video ID
        segments_by_video: Dict[int, List[Dict]] = {}
        for seg in segments:
            # Deserialize
            embedding = []
            if isinstance(seg.embedding, str):
                try:
                    embedding = json.loads(seg.embedding)
                except: continue
            else:
                embedding = seg.embedding
            
            segments_by_video.setdefault(seg.video_id, []).append({
                "segment": seg,
                "embedding": embedding,
                "start_time": seg.start_time
            })

        all_matches = []

        for video_id, video_data in segments_by_video.items():
            video_data.sort(key=lambda x: x["start_time"])
            
            embeddings = [x["embedding"] for x in video_data]
            raw_scores = []
            
            # Calculate Similarity with CONTRASTIVE LOGIC
            for emb in embeddings:
                pos_score = _cosine_similarity(query_embed, emb)
                
                # Subtract negative similarity
                if negative_embed:
                    neg_score = _cosine_similarity(negative_embed, emb)
                    # Contrastive formula: reduced penalty for better recall
                    final_score = pos_score - (0.4 * neg_score)
                else:
                    final_score = pos_score
                
                raw_scores.append(final_score)
            
            # Smooth Scores
            smoothed = _smooth_scores(raw_scores)
            
            # Debug Log
            top_raw = sorted(zip(smoothed, [x["start_time"] for x in video_data]), reverse=True)[:5]
            if LOG_VERBOSE:
                print(f"[DEBUG] Video {video_id} Top 5 Scores: {[(f'{s:.3f}', f'{t}s') for s, t in top_raw]}")

            # Collect Matches
            for i, item in enumerate(video_data):
                score = smoothed[i]
                
                if score > 0.01:  # Basic sanity
                    all_matches.append({
                        "segment": item["segment"],
                        "score": float(score),
                        "video_id": video_id
                    })

        # 4. Filtering & Adaptive Threshold
        all_matches.sort(key=lambda x: x["score"], reverse=True)
        
        high_confidence_matches = [m for m in all_matches if m["score"] > threshold]
        
        final_matches = []
        is_low_confidence = False

        if high_confidence_matches:
            print(f"[INFO] Found {len(high_confidence_matches)} matches above threshold {threshold}.")
            final_matches = high_confidence_matches
        else:
            # ADAPTIVE FALLBACK
            if ADAPTIVE_THRESHOLD and all_matches:
                print(f"[WARNING] No matches above threshold. Returning Top 3 (Adaptive Mode).")
                final_matches = all_matches[:3]
                is_low_confidence = True
            elif DEMO_MODE:
                 print(f"[WARNING] Zero matches found. Activating DEMO GOD MODE.")
                 return _get_mock_results(query_text)
            else:
                 return []
        
        # 5. Deduplication & Formatting
        unique_results = []
        used_times = []
        
        MIN_EVENT_DIST = 10.0
        
        for m in final_matches:
            seg = m["segment"]
            video = session.get(Video, seg.video_id)
            if not video: continue
            
            # Calculate segment center time for deduplication
            # This fixes the issue where many segments have start_time=0.0
            center_time = (seg.start_time + seg.end_time) / 2.0
            
            is_duplicate = False
            for t_vid, t_center in used_times:
                if seg.video_id == t_vid and abs(center_time - t_center) < MIN_EVENT_DIST:
                    is_duplicate = True
                    break
            
            if is_duplicate:
                continue
                
            used_times.append((seg.video_id, center_time))
            
            unique_results.append({
                "id": f"clip_{seg.id}",
                "video_id": seg.video_id,
                "video_title": video.title,
                "startTime": seg.start_time,
                "endTime": seg.end_time,
                "description": query_text,
                "confidenceScore": m["score"],
                "thumbnailUrl": "",
                "isLowConfidence": is_low_confidence
            })
            
            if len(unique_results) >= 15: break  # Increased limit for better coverage

        print(f"[SUCCESS] Returning {len(unique_results)} unique results.")
        return unique_results


def _get_mock_results(query_text: str):
    """Returns fake data for the demo."""
    normalized = query_text.lower().strip()
    key_match = None
    
    for key in MOCK_DATA:
        if key in normalized:
            key_match = key
            break
            
    if not key_match:
        # Generic fallback if keyword is unknown
        return [
            {
                "id": "mock_1",
                "video_id": 1, 
                "video_title": "Demo Match 2024",
                "startTime": 10.0,
                "endTime": 15.0,
                "description": query_text,
                "confidenceScore": 0.85,
                "thumbnailUrl": "",
                "isMock": True 
            }
        ]

    # Return specific mock data
    results = []
    for i, item in enumerate(MOCK_DATA[key_match]):
        results.append({
            "id": f"mock_{key_match}_{i}",
            "video_id": 1, # Assumes video ID 1 exists, or UI handles it gracefully
            "video_title": "Dataset Match (Demo)",
            "startTime": item["start_time"],
            "endTime": item["end_time"],
            "description": query_text,
            "confidenceScore": item["score"],
            "thumbnailUrl": "",
            "isMock": True
        })
        
    return results
