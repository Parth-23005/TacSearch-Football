from typing import Optional, List
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, Relationship, JSON
from sqlalchemy import Column

class VideoBase(SQLModel):
    title: str
    filename: str
    filepath: str
    metadata_info: dict = Field(default={}, sa_column=Column(JSON), alias="metadata")
    processed: bool = False
    processing_progress: float = Field(default=0.0, alias="processingProgress")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    match_id: Optional[str] = Field(default=None, alias="matchId")

class Video(VideoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clips: List["Clip"] = Relationship(back_populates="video")
    segments: List["VideoSegment"] = Relationship(back_populates="video")

class VideoSegment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    video_id: int = Field(foreign_key="video.id", alias="videoId")
    start_time: float = Field(alias="startTime")
    end_time: float = Field(alias="endTime")
    embedding: List[float] = Field(sa_column=Column(JSON))
    text_description: Optional[str] = None
    video: Optional[Video] = Relationship(back_populates="segments")

class ClipBase(SQLModel):
    video_id: int = Field(foreign_key="video.id", alias="videoId")
    start_time: float = Field(alias="startTime")
    end_time: float = Field(alias="endTime")
    description: str
    team_id: Optional[str] = Field(default=None, alias="teamId")
    confidence_score: float = Field(alias="confidenceScore")
    tags: List[str] = Field(default=[], sa_column=Column(JSON))
    thumbnail_url: Optional[str] = Field(default=None, alias="thumbnailUrl")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")

class Clip(ClipBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    video: Optional[Video] = Relationship(back_populates="clips")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
