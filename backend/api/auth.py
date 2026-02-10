from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlmodel import Session, select
from ..database import get_session
from ..models import User
from pydantic import BaseModel
from typing import Optional
from sqlmodel import Session, select
from ..database import get_session
from ..models import User
from pydantic import BaseModel

class UserLogin(BaseModel):
    username: str
    password: str

router = APIRouter()

@router.post("/auth/login")
def login(response: Response, user: UserLogin, session: Session = Depends(get_session)):
    # Verify user exists (password check skipped for MVP)
    statement = select(User).where(User.username == user.username)
    db_user = session.exec(statement).first()
    
    if not db_user:
         # Auto-register for MVP simplicity
         new_user = User(username=user.username, password_hash=user.password)
         session.add(new_user)
         session.commit()
         session.refresh(new_user)

    # Set simple cookie
    response.set_cookie(key="user_session", value=user.username)
    return {"message": "Login successful", "user": user.username}

@router.post("/auth/register")
def register(response: Response, user: UserLogin, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == user.username)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Hash password in real app
    new_user = User(username=user.username, password_hash=user.password)
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    # Auto-login
    response.set_cookie(key="user_session", value=new_user.username)
    
    return new_user

@router.get("/auth/user")
def get_user(request: Request, session: Session = Depends(get_session)):
    username = request.cookies.get("user_session")
    if not username:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()
    
    if not user:
         # Cookie is stale?
         raise HTTPException(status_code=401, detail="User not found")
         
    return user

@router.get("/auth/logout") 
def logout(response: Response):
    response.delete_cookie(key="user_session")
    return {"message": "Logged out"}
