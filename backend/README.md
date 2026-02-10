# TacSearch Football - Backend Setup

This project uses a Python FastAPI backend with YOLOv8 and OpenAI CLIP for video analysis.

## Prerequisites

- Python 3.8+
- Node.js & npm (for frontend)

## Installation

1.  **Install Python Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
    *Note: This installs PyTorch, Ultralytics, Transformers, and other heavy libraries. It may take some time.*

## Running the Application

You need to run the Frontend and the Backend in separate terminals.

### Terminal 1: Frontend
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`.

### Terminal 2: Backend
```bash
# Run from the root directory
uvicorn backend.main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.

## Features
-   **Video Upload**: Uploads match footage.
-   **AI Processing**: Automatically runs YOLOv8 player tracking and CLIP segmentation.
-   **Search**: Semantic search (e.g., "defensive error") using CLIP embeddings.

## Note on AI Models
-   The first run will download the `yolov8n.pt` and `openai/clip-vit-base-patch32` models automatically.
-   Use a GPU if available for faster processing.
