from PIL import Image
import cv2
import numpy as np

class CLIPSearchEngine:
    def __init__(self, model_id="openai/clip-vit-base-patch16"):
        import torch
        from transformers import CLIPProcessor, CLIPModel
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = CLIPModel.from_pretrained(model_id).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_id)

    def get_text_embedding(self, text: str):
        import torch
        inputs = self.processor(text=[text], return_tensors="pt", padding=True).to(self.device)
        with torch.no_grad():
            outputs = self.model.get_text_features(**inputs)
            
            if hasattr(outputs, 'text_embeds'):
                text_features = outputs.text_embeds
            elif hasattr(outputs, 'pooler_output'):
                text_features = outputs.pooler_output
            else:
                text_features = outputs
                
        return text_features.cpu().numpy().flatten().tolist()

    def embed_frame(self, frame):
        """
        Generates embedding for a single BGR frame (OpenCV).
        """
        # Convert BGR to RGB for PIL
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_frame)
        
        # Generator embedding
        import torch
        inputs = self.processor(images=pil_image, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model.get_image_features(**inputs)
            if hasattr(outputs, 'image_embeds'):
                image_features = outputs.image_embeds
            elif hasattr(outputs, 'pooler_output'):
                image_features = outputs.pooler_output
            else:
                image_features = outputs
                
        return image_features.cpu().numpy().flatten().tolist()

    def analyze_video_segments(self, video_path: str, interval: int = 2):
        """
        Extracts frames every 'interval' seconds and generates embeddings.
        Returns a list of segments with start_time, end_time, and embedding.
        """
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        segments = []
        
        current_sec = 0
        while True:
            # Jump to the specific second
            cap.set(cv2.CAP_PROP_POS_MSEC, current_sec * 1000)
            ret, frame = cap.read()
            if not ret:
                break
            
            # Resize for performance (CLIP uses 224x224 usually)
            frame = cv2.resize(frame, (224, 224))
            
            # Convert BGR to RGB for PIL
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_image = Image.fromarray(rgb_frame)
            
            # Generate embedding
            import torch
            inputs = self.processor(images=pil_image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                outputs = self.model.get_image_features(**inputs)
                # Handle cases where output is not just a tensor
                if hasattr(outputs, 'image_embeds'):
                    image_features = outputs.image_embeds
                elif hasattr(outputs, 'pooler_output'):
                    image_features = outputs.pooler_output
                else:
                    image_features = outputs
            
            segments.append({
                "start_time": current_sec,
                "end_time": current_sec + interval, # Approximation
                "embedding": image_features.cpu().numpy().flatten().tolist()
            })
            
            current_sec += interval
            
        cap.release()
        return segments
