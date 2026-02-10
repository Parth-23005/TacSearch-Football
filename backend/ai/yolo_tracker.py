import cv2
import numpy as np

class YOLOTracker:
    def __init__(self, model_name="yolov8n.pt"):
        from ultralytics import YOLO
        self.model = YOLO(model_name)

    def count_players(self, frame):
        """
        Runs YOLO on a single frame and returns player count.
        Detects both persons (class 0) and sports balls (class 32) for comprehensive football object detection.
        """
        # Class 0 = Person, Class 32 = Sports Ball
        # This ensures we detect both players and the football itself
        results = self.model(frame, classes=[0, 32], verbose=False)
        return len(results[0].boxes)

    def detect_players(self, video_path: str, sample_interval: int = 30):
        """
        Runs YOLO on the video and returns detections.
        sample_interval: Frame interval to sample (to save time).
        """
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        detections = []
        
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_idx % sample_interval == 0:
                player_count = self.count_players(frame)
                frame_timestamp = frame_idx / fps
                
                detections.append({
                    "timestamp": frame_timestamp,
                    "player_count": player_count,
                })
            
            frame_idx += 1
            
        cap.release()
        return detections
