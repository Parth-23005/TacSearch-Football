from typing import List, Dict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def find_best_matches(query_embedding: List[float], segments: List[Dict], threshold: float = 0.23): # Tuned threshold (lower is safe after removing generic prompt)
    """
    Finds segments that match the query embedding above a certain threshold.
    segments: List of dicts with 'embedding' key (and start_time, end_time).
    """
    if not segments:
        return []

    # Prepare matrix
    segment_embeddings = [s["embedding"] for s in segments]
    
    # Calculate similarities
    # shape: (1, n_segments)
    similarities = cosine_similarity([query_embedding], segment_embeddings)[0]
    
    matches = []
    print(f"Debug: Top similarities: {sorted(similarities, reverse=True)[:5]}") # Debug log
    
    for i, score in enumerate(similarities):
        if score > threshold:
            matches.append({
                **segments[i],
                "score": float(score)
            })
            
    return matches

def isolate_peaks(matches: List[Dict], suppression_window: float = 10.0):
    """
    Non-Maximum Suppression (NMS) to find distinct top events.
    Instead of merging everything, we pick the highest scoring moment
    and suppress neighbors to avoid duplicates.
    
    suppression_window: Seconds +/- around a peak to ignore lower scores.
    """
    if not matches:
        return []
        
    # Sort by Score DESC (Highest confidence first)
    sorted_by_score = sorted(matches, key=lambda x: x["score"], reverse=True)
    
    final_clips = []
    processed_indices = set()
    
    for i, candidate in enumerate(sorted_by_score):
        if i in processed_indices:
            continue
            
        # This is a Peak! Keep it.
        final_clips.append(candidate)
        processed_indices.add(i)
        
        # Suppress temporal neighbors (lower scores within window)
        for j, other in enumerate(sorted_by_score):
            if j in processed_indices:
                continue
                
            time_diff = abs(candidate["start_time"] - other["start_time"])
            if time_diff < suppression_window:
                processed_indices.add(j) # Suppress neighbor
    
    # Return clips sorted by time for display
    return sorted(final_clips, key=lambda x: x["start_time"])
