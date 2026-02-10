from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import create_db_and_tables
from .api import videos, clips, auth

app = FastAPI()

from fastapi.staticfiles import StaticFiles

# Allow CORS for dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory for all static files
app.mount("/static", StaticFiles(directory="static"), name="static")
# Keep legacy mounts for compatibility
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads") 

@app.on_event("startup")
def on_startup():
    import os
    # Ensure directories exist to prevent StaticFiles from crashing
    # We do this here so it runs only in the main worker process
    os.makedirs("static/uploads", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)
    
    print("Serving static files from /static")
    create_db_and_tables()

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(clips.router, prefix="/api/clips", tags=["clips"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    # Use this for debugging if the CLI reload causes issues
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
