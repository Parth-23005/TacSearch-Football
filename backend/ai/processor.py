from sqlmodel import Session, select
from ..database import engine
from ..models import Video, VideoSegment
from .yolo_tracker import YOLOTracker
from .clip_search import CLIPSearchEngine
from .football_model import get_football_model
import logging

# Lazy Loading Singleton
_yolo_tracker = None
_clip_engine = None
_football_model = None

def get_yolo_tracker():
    global _yolo_tracker
    if _yolo_tracker is None:
        try:
            _yolo_tracker = YOLOTracker()
        except Exception as e:
            logging.error(f"Failed to load YOLO: {e}")
    return _yolo_tracker

def get_clip_engine():
    global _clip_engine
    if _clip_engine is None:
        try:
            _clip_engine = CLIPSearchEngine()
        except Exception as e:
            logging.error(f"Failed to load CLIP: {e}")
    return _clip_engine

def get_football_action_model():
    global _football_model
    if _football_model is None:
        try:
            _football_model = get_football_model()
        except Exception as e:
            logging.error(f"Failed to load Football Model: {e}")
    return _football_model

# Flag to check if models are loaded (simplified for now)
MODELS_LOADED = True # We assume they will load on demand, errors handled in getters

def process_video_task(video_id: int):
    """
    Background task to process a video with Hybrid Gatekeeper Architecture.
    """
    if not MODELS_LOADED:
        logging.error("AI Models not loaded, skipping processing")
        return

    with Session(engine) as session:
        video = session.get(Video, video_id)
        if not video:
            return

        print(f"Starting HYBRID processing for video: {video.title}")
        import os
        import cv2
        import numpy as np
        
        if not os.path.exists(video.filepath):
            print(f"ERROR: Video file not found at {video.filepath}")
            video.processing_progress = -1.0
            session.add(video)
            session.commit()
            return
        
        try:
            # Update progress: Started
            video.processing_progress = 5.0
            session.add(video)
            session.commit()

            # STEP 1: LOAD AI MODELS
            print("\n" + "="*60)
            print("Loading AI models...")
            print("="*60)
            
            football_model = get_football_model()
            if football_model and football_model.is_loaded():
                print("[OK] Football Action Model loaded")
            else:
                print("[WARN] Football model not available, will use CLIP only")
                football_model = None
            
            clip = get_clip_engine()
            if clip:
                print("[OK] CLIP Model loaded")
            else:
                print("[ERROR] CLIP not loaded!")
            
            yolo = get_yolo_tracker()
            if yolo:
                print("[OK] YOLO Tracker loaded")
            else:
                print("[WARN] YOLO not loaded")
            
            print("="*60 + "\n")


            cap = cv2.VideoCapture(video.filepath)
            fps = cap.get(cv2.CAP_PROP_FPS)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / fps
            
            # Process 1 frame every 0.5 seconds (increased sampling)
            step_frames = int(fps / 2)  # Half-second intervals
            current_frame = 0
            
            segments_to_save = []
            frame_buffer = []  # Buffer to collect 16 frames for football model
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Always add frame to buffer for football model
                frame_buffer.append(frame.copy())
                # Keep only last 16 frames
                if len(frame_buffer) > 16:
                    frame_buffer.pop(0)
                
                # Check interval (every 0.5 seconds)
                if current_frame % step_frames == 0:
                    current_time = current_frame / fps
                    
                    # LOGGING
                    print(f"Processed {int(current_time)}s... ({(current_time/duration)*100:.1f}%)")
                    
                    # VALIDATION: Skip empty or black frames
                    if frame is None or frame.size == 0:
                        print(f"  -> Skipped (Empty frame at {current_time}s)")
                        current_frame += 1
                        continue
                        
                    if np.mean(frame) < 5:  # Stricter black frame detection
                        print(f"  -> Skipped (Black frame at {current_time}s)")
                        current_frame += 1
                        continue

                    # STEP A: YOLO DETECTION (for metadata, not gatekeeper)
                    # Downscale for YOLO speed
                    small_frame = cv2.resize(frame, (640, 640))
                    yolo = get_yolo_tracker()
                    if not yolo:
                        player_count = 0
                    else:
                        player_count = yolo.count_players(small_frame)
                    
                    # STEP B: HYBRID EMBEDDINGS (Football Model + CLIP)
                    # Process ALL frames, don't skip based on YOLO
                    embedding = None
                    action_class = "unknown"
                    
                    print(f"[DEBUG] Frame {current_frame} at {current_time:.1f}s - Buffer size: {len(frame_buffer)}")
                    
                    # Try football model first (if available and we have enough frames)
                    if football_model and len(frame_buffer) >= 16:
                        print(f"[DEBUG] Trying football model...")
                        try:
                            # Get action embedding from 16-frame clip
                            embedding = football_model.get_action_embedding(frame_buffer[-16:])
                            print(f"[DEBUG] Football model returned: {type(embedding)}, length: {len(embedding) if embedding else 'None'}")
                            
                            # Also classify the action for metadata
                            action_scores = football_model.classify_action(frame_buffer[-16:])
                            if action_scores:
                                action_class = max(action_scores, key=action_scores.get)
                                print(f"  -> Action detected: {action_class} ({action_scores[action_class]:.2f})")
                        except Exception as e:
                            print(f"  -> Football model error: {e}, falling back to CLIP")
                            import traceback
                            traceback.print_exc()
                            embedding = None
                    else:
                        if not football_model:
                            print(f"[DEBUG] Football model not available")
                        else:
                            print(f"[DEBUG] Not enough frames in buffer ({len(frame_buffer)} < 16)")
                    
                    # Fallback to CLIP if football model failed or unavailable
                    if embedding is None:
                        print(f"[DEBUG] Trying CLIP fallback...")
                        clip = get_clip_engine()
                        if clip:
                            embedding = clip.embed_frame(frame)
                            print(f"[DEBUG] CLIP returned: {type(embedding)}, length: {len(embedding) if embedding else 'None'}")
                            action_class = "clip_fallback"
                        else:
                            print(f"[DEBUG] CLIP not available!")
                    
                    if embedding:
                        # Create 15-second segment centered on this frame
                        # Larger context window for better event capture
                        segment_start = max(0.0, current_time - 7.5)
                        segment_end = current_time + 7.5
                        
                        print(f"[DEBUG] Creating segment: {segment_start:.1f}s-{segment_end:.1f}s")
                        segments_to_save.append(VideoSegment(
                            video_id=video.id,
                            start_time=segment_start,
                            end_time=segment_end,
                            embedding=embedding,
                            text_description=action_class  # Store action class for debugging
                        ))
                        print(f"  -> Indexed (Players: {player_count}, Action: {action_class}) - Total segments: {len(segments_to_save)}")
                    else:
                        print(f"  -> Skipped (No embedding generated)")
                        
                    # Update progress in DB periodically
                    if len(segments_to_save) % 5 == 0 and len(segments_to_save) > 0:
                        progress = 10.0 + (current_time / duration) * 80.0
                        video.processing_progress = progress / 100.0
                        session.add(video)
                        session.commit()
                        print(f"[DEBUG] Progress updated: {progress:.1f}%")

                current_frame += 1
                
            cap.release()

            # Batch save segments
            print(f"Saving {len(segments_to_save)} segments to DB...")
            if len(segments_to_save) == 0:
                print("WARNING: No segments were created during processing!")
            
            try:
                for i, seg in enumerate(segments_to_save):
                    session.add(seg)
                    if i < 3:  # Log first 3 segments for debugging
                        print(f"  Segment {i}: {seg.start_time:.1f}s-{seg.end_time:.1f}s, action: {seg.text_description}")
                
                session.commit()
                print(f"Successfully saved {len(segments_to_save)} segments")
            except Exception as save_error:
                print(f"ERROR saving segments: {save_error}")
                import traceback
                traceback.print_exc()
                raise
            
            # Finished
            video.processed = True
            video.processing_progress = 1.0  # Fixed: should be 1.0 not 100.0
            session.add(video)
            session.commit()
            print(f"Finished processing video: {video.title}")
            
        except Exception as e:
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            print(f"ERROR PROCESSING VIDEO {video_id}")
            import traceback
            traceback.print_exc()
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            video.processing_progress = -1.0 # Error state
            session.add(video)
            session.commit()
