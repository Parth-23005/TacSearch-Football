from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from ..database import get_session
from ..models import Clip, VideoSegment, Video
from ..ai.clip_search import CLIPSearchEngine
from typing import List, Optional

router = APIRouter()

@router.get("/", response_model=List[Clip])
def list_clips(video_id: Optional[int] = None, session: Session = Depends(get_session)):
    statement = select(Clip)
    if video_id:
        statement = statement.where(Clip.video_id == video_id)
    clips = session.exec(statement).all()
    return clips

@router.get("/search")
def search_clips(q: str, session: Session = Depends(get_session)):
    from ..ai.search import search_video
    return search_video(q, threshold=0.05)
