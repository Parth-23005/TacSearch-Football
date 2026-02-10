"""
Football Action Recognition Model
Uses VideoMAE for temporal action understanding in football videos.
"""
import torch
import numpy as np
from typing import List, Dict, Optional
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
from PIL import Image
import cv2

class FootballActionModel:
    """
    Wrapper for VideoMAE model to recognize football actions.
    Maps generic actions to football-specific events.
    """
    
    # Mapping from Kinetics-400 classes to football events
    ACTION_MAPPINGS = {
        # Goal-related actions
        "celebrating": ["goal", "victory"],
        "hugging": ["goal", "celebration"],
        "high_fiving": ["goal", "celebration"],
        "applauding": ["goal", "good play"],
        
        # Shot-related actions
        "kicking_soccer_ball": ["shot", "pass", "clearance"],
        "shooting_goal_(soccer)": ["shot", "penalty"],
        
        # Save-related actions
        "catching_or_throwing_baseball": ["save", "goalkeeper"],
        "diving_cliff_diving": ["save", "goalkeeper diving"],
        
        # Pass-related actions
        "passing_American_football_(not_in_game)": ["pass"],
        
        # Tackle-related actions
        "tackling": ["tackle", "foul"],
        "wrestling": ["tackle", "physical play"],
        
        # General play
        "playing_soccer": ["general play"],
        "dribbling_basketball": ["dribbling"],
        "running": ["running", "sprint"],
        "jumping": ["header", "aerial duel"],
    }
    
    def __init__(self, model_name: str = "MCG-NJU/videomae-base-finetuned-kinetics"):
        """
        Initialize the VideoMAE model.
        
        Args:
            model_name: Hugging Face model identifier
        """
        print(f"[FootballActionModel] Loading {model_name}...")
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[FootballActionModel] Using device: {self.device}")
        
        try:
            self.processor = VideoMAEImageProcessor.from_pretrained(model_name)
            self.model = VideoMAEForVideoClassification.from_pretrained(model_name)
            self.model.to(self.device)
            self.model.eval()
            print("[FootballActionModel] Model loaded successfully")
        except Exception as e:
            print(f"[FootballActionModel] Failed to load model: {e}")
            self.processor = None
            self.model = None
    
    def is_loaded(self) -> bool:
        """Check if model is successfully loaded."""
        return self.model is not None and self.processor is not None
    
    def preprocess_frames(self, frames: List[np.ndarray]) -> torch.Tensor:
        """
        Convert OpenCV frames to format expected by VideoMAE.
        
        Args:
            frames: List of BGR frames from OpenCV (H, W, 3)
            
        Returns:
            Preprocessed tensor ready for model
        """
        # Convert BGR to RGB and to PIL Images
        pil_frames = []
        for frame in frames:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_frame)
            pil_frames.append(pil_image)
        
        # Process with VideoMAE processor
        inputs = self.processor(pil_frames, return_tensors="pt")
        return inputs["pixel_values"].to(self.device)
    
    def get_action_embedding(self, frames: List[np.ndarray]) -> Optional[List[float]]:
        """
        Extract action embedding from video frames.
        
        Args:
            frames: List of 16 frames (0.5s at 30fps)
            
        Returns:
            768-dimensional embedding vector, or None if failed
        """
        if not self.is_loaded():
            print("[FootballActionModel] Model not loaded, cannot extract embedding")
            return None
        
        try:
            # Ensure we have exactly 16 frames
            if len(frames) < 16:
                # Repeat last frame to reach 16
                frames = frames + [frames[-1]] * (16 - len(frames))
            elif len(frames) > 16:
                # Sample 16 frames evenly
                indices = np.linspace(0, len(frames) - 1, 16, dtype=int)
                frames = [frames[i] for i in indices]
            
            # Preprocess
            pixel_values = self.preprocess_frames(frames)
            
            # Get hidden states (embeddings)
            with torch.no_grad():
                outputs = self.model(pixel_values, output_hidden_states=True)
                # Use the last hidden state's CLS token as embedding
                embedding = outputs.hidden_states[-1][:, 0, :].squeeze()
                
            return embedding.cpu().numpy().tolist()
            
        except Exception as e:
            print(f"[FootballActionModel] Error extracting embedding: {e}")
            return None
    
    def classify_action(self, frames: List[np.ndarray], top_k: int = 5) -> Dict[str, float]:
        """
        Classify the action in video frames.
        
        Args:
            frames: List of 16 frames
            top_k: Number of top predictions to return
            
        Returns:
            Dictionary mapping action labels to confidence scores
        """
        if not self.is_loaded():
            print("[FootballActionModel] Model not loaded, cannot classify")
            return {}
        
        try:
            # Ensure we have exactly 16 frames
            if len(frames) < 16:
                frames = frames + [frames[-1]] * (16 - len(frames))
            elif len(frames) > 16:
                indices = np.linspace(0, len(frames) - 1, 16, dtype=int)
                frames = [frames[i] for i in indices]
            
            # Preprocess
            pixel_values = self.preprocess_frames(frames)
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(pixel_values)
                logits = outputs.logits
                probs = torch.nn.functional.softmax(logits, dim=-1)
            
            # Get top-k predictions
            top_probs, top_indices = torch.topk(probs[0], top_k)
            
            results = {}
            for prob, idx in zip(top_probs, top_indices):
                label = self.model.config.id2label[idx.item()]
                results[label] = float(prob.item())
            
            return results
            
        except Exception as e:
            print(f"[FootballActionModel] Error classifying action: {e}")
            return {}
    
    def map_to_football_event(self, action_scores: Dict[str, float]) -> Dict[str, float]:
        """
        Map generic action labels to football-specific events.
        
        Args:
            action_scores: Dictionary of action labels and scores
            
        Returns:
            Dictionary of football events and aggregated scores
        """
        event_scores = {}
        
        for action, score in action_scores.items():
            # Check if this action maps to any football events
            for key, events in self.ACTION_MAPPINGS.items():
                if key.lower() in action.lower():
                    for event in events:
                        if event not in event_scores:
                            event_scores[event] = 0.0
                        event_scores[event] = max(event_scores[event], score)
        
        return event_scores


# Singleton instance
_football_model_instance: Optional[FootballActionModel] = None


def get_football_model() -> Optional[FootballActionModel]:
    """
    Get or create the singleton FootballActionModel instance.
    
    Returns:
        FootballActionModel instance, or None if failed to load
    """
    global _football_model_instance
    
    if _football_model_instance is None:
        try:
            _football_model_instance = FootballActionModel()
            if not _football_model_instance.is_loaded():
                print("[WARNING] FootballActionModel failed to load, returning None")
                _football_model_instance = None
        except Exception as e:
            print(f"[ERROR] Failed to create FootballActionModel: {e}")
            _football_model_instance = None
    
    return _football_model_instance
