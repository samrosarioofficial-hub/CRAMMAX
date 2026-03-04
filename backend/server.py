from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'studymax_secret_key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 30  # 30 days

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: Optional[str] = None
    auth_provider: str = "email"  # "email" or "google"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    discipline_score: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    total_sessions: int = 0
    level: int = 1
    last_session_date: Optional[str] = None

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    phases_completed: List[str] = []
    is_completed: bool = False
    early_exit: bool = False
    notes: dict = {}  # {"preview": "note", "learn": "note", etc.}

class DailyStats(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    date: str  # YYYY-MM-DD format
    sessions_completed: int = 0
    discipline_score_earned: int = 0
    phases_data: dict = {}

class AIFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    date: str  # YYYY-MM-DD format
    feedback: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserPreferences(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    phase_durations: dict = {
        "preview": 5,
        "learn": 35,
        "recall": 10,
        "test": 10
    }
    timer_brightness: int = 100  # 0-100
    enable_sounds: bool = True
    show_on_leaderboard: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== REQUEST/RESPONSE MODELS ====================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: dict

class StartSessionRequest(BaseModel):
    pass

class CompletePhaseRequest(BaseModel):
    phase: str  # "preview", "learn", "recall", "test"

class SessionResponse(BaseModel):
    session_id: str
    phases_completed: List[str]
    is_completed: bool

class DashboardResponse(BaseModel):
    discipline_score: int
    current_streak: int
    longest_streak: int
    total_sessions: int
    level: int
    level_name: str
    today_sessions: int
    weekly_stats: List[dict]

class ProfileResponse(BaseModel):
    name: str
    email: str
    level: int
    level_name: str
    discipline_score: int
    total_sessions: int
    current_streak: int
    longest_streak: int
    badges: List[str]

class AIFeedbackResponse(BaseModel):
    feedback: str
    date: str

class UpdatePreferencesRequest(BaseModel):
    phase_durations: Optional[dict] = None
    timer_brightness: Optional[int] = None
    enable_sounds: Optional[bool] = None
    show_on_leaderboard: Optional[bool] = None

class SaveNoteRequest(BaseModel):
    phase: str
    note: str

class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_jwt_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "user_id": user_id,
        "exp": expiration
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    payload = decode_jwt_token(token)
    user_id = payload.get("user_id")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return user

def calculate_discipline_score(sessions: int, streak: int) -> int:
    """Hidden formula for discipline score calculation"""
    return (sessions * 100) + (streak * 10)

def get_level_name(level: int) -> str:
    if level <= 5:
        return "Beginner"
    elif level <= 15:
        return "Focused"
    elif level <= 30:
        return "Consistent"
    elif level <= 50:
        return "Elite"
    else:
        return "Study Machine"

def calculate_level(discipline_score: int) -> int:
    """Calculate level based on discipline score"""
    return min(1 + (discipline_score // 1000), 100)

def get_badges(user: dict) -> List[str]:
    badges = []
    if user['total_sessions'] >= 1:
        badges.append("First Session")
    if user['total_sessions'] >= 10:
        badges.append("10 Sessions")
    if user['total_sessions'] >= 50:
        badges.append("50 Sessions")
    if user['total_sessions'] >= 100:
        badges.append("100 Sessions")
    if user['current_streak'] >= 3:
        badges.append("3-Day Streak")
    if user['current_streak'] >= 7:
        badges.append("Week Warrior")
    if user['current_streak'] >= 30:
        badges.append("Month Master")
    if user['longest_streak'] >= 100:
        badges.append("Century Streak")
    return badges

async def generate_ai_feedback(user_id: str, user: dict, today_stats: dict) -> str:
    """Generate AI feedback using OpenAI via emergentintegrations"""
    try:
        # Prepare context for AI
        context = f"""
User Performance Analysis:
- Sessions completed today: {today_stats.get('sessions_completed', 0)}
- Current streak: {user['current_streak']} days
- Total lifetime sessions: {user['total_sessions']}
- Discipline score: {user['discipline_score']}
- Level: {user['level']} ({get_level_name(user['level'])})

Generate a SHORT, STRICT, DIRECT feedback message (max 2 sentences). 
Tone: Disciplined coach. No soft motivation. No emojis.
Focus on: consistency, accountability, and maintaining pressure.
Examples:
- "You broke your streak. Fix it tomorrow."
- "Consistency is improving. Maintain pressure."
- "Three days strong. Don't let up now."
- "Zero sessions today. Discipline demands action."
"""
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"feedback_{user_id}",
            system_message="You are a strict discipline coach for students. Your feedback is direct, brief, and focuses on accountability."
        )
        chat.with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=context)
        response = await chat.send_message(user_message)
        
        return response.strip()
    except Exception as e:
        logging.error(f"AI feedback generation failed: {e}")
        # Fallback feedback
        if today_stats.get('sessions_completed', 0) == 0:
            return "No sessions today. Discipline demands action."
        elif user['current_streak'] == 0:
            return "Streak broken. Rebuild starting now."
        else:
            return "Maintain the pressure. Consistency is everything."

# ==================== ROUTES ====================

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(request: SignupRequest):
    # Check if user exists
    existing_user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Create new user
    user = User(
        email=request.email,
        name=request.name,
        password_hash=hash_password(request.password),
        auth_provider="email"
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Generate token
    token = create_jwt_token(user.user_id)
    
    return TokenResponse(
        token=token,
        user={
            "user_id": user.user_id,
            "email": user.email,
            "name": user.name,
            "level": user.level,
            "discipline_score": user.discipline_score
        }
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user or not verify_password(request.password, user['password_hash']):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    token = create_jwt_token(user['user_id'])
    
    return TokenResponse(
        token=token,
        user={
            "user_id": user['user_id'],
            "email": user['email'],
            "name": user['name'],
            "level": user['level'],
            "discipline_score": user['discipline_score']
        }
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user['user_id'],
        "email": current_user['email'],
        "name": current_user['name'],
        "level": current_user['level'],
        "discipline_score": current_user['discipline_score'],
        "current_streak": current_user['current_streak']
    }

@api_router.post("/session/start", response_model=SessionResponse)
async def start_session(current_user: dict = Depends(get_current_user)):
    # Check for active session
    active_session = await db.sessions.find_one(
        {"user_id": current_user['user_id'], "is_completed": False},
        {"_id": 0}
    )
    
    if active_session:
        return SessionResponse(
            session_id=active_session['session_id'],
            phases_completed=active_session['phases_completed'],
            is_completed=active_session['is_completed']
        )
    
    # Create new session
    session = Session(
        user_id=current_user['user_id']
    )
    
    session_dict = session.model_dump()
    session_dict['started_at'] = session_dict['started_at'].isoformat()
    
    await db.sessions.insert_one(session_dict)
    
    return SessionResponse(
        session_id=session.session_id,
        phases_completed=session.phases_completed,
        is_completed=session.is_completed
    )

@api_router.post("/session/{session_id}/complete-phase", response_model=SessionResponse)
async def complete_phase(
    session_id: str,
    request: CompletePhaseRequest,
    current_user: dict = Depends(get_current_user)
):
    session = await db.sessions.find_one(
        {"session_id": session_id, "user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    if session['is_completed']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Session already completed")
    
    # Add phase if not already completed
    phases_completed = session['phases_completed']
    if request.phase not in phases_completed:
        phases_completed.append(request.phase)
    
    # Check if all phases are completed
    all_phases = ["preview", "learn", "recall", "test"]
    is_completed = all(phase in phases_completed for phase in all_phases)
    
    update_data = {
        "phases_completed": phases_completed,
        "is_completed": is_completed
    }
    
    if is_completed:
        update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
        
        # Update user stats
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        user_id = current_user['user_id']
        
        # Update daily stats
        daily_stats = await db.daily_stats.find_one(
            {"user_id": user_id, "date": today},
            {"_id": 0}
        )
        
        if daily_stats:
            sessions_count = daily_stats['sessions_completed'] + 1
            await db.daily_stats.update_one(
                {"user_id": user_id, "date": today},
                {"$set": {"sessions_completed": sessions_count}}
            )
        else:
            new_stats = DailyStats(
                user_id=user_id,
                date=today,
                sessions_completed=1
            )
            await db.daily_stats.insert_one(new_stats.model_dump())
        
        # Update user stats
        total_sessions = current_user['total_sessions'] + 1
        
        # Update streak
        last_session_date = current_user.get('last_session_date')
        current_streak = current_user['current_streak']
        
        if last_session_date:
            last_date = datetime.fromisoformat(last_session_date).date()
            today_date = datetime.now(timezone.utc).date()
            days_diff = (today_date - last_date).days
            
            if days_diff == 0:
                # Same day, keep streak
                pass
            elif days_diff == 1:
                # Consecutive day, increase streak
                current_streak += 1
            else:
                # Streak broken, reset
                current_streak = 1
        else:
            current_streak = 1
        
        longest_streak = max(current_user['longest_streak'], current_streak)
        
        # Calculate discipline score
        discipline_score = calculate_discipline_score(total_sessions, current_streak)
        level = calculate_level(discipline_score)
        
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "total_sessions": total_sessions,
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "discipline_score": discipline_score,
                "level": level,
                "last_session_date": today
            }}
        )
    
    await db.sessions.update_one(
        {"session_id": session_id},
        {"$set": update_data}
    )
    
    return SessionResponse(
        session_id=session_id,
        phases_completed=phases_completed,
        is_completed=is_completed
    )

@api_router.get("/session/active", response_model=Optional[SessionResponse])
async def get_active_session(current_user: dict = Depends(get_current_user)):
    session = await db.sessions.find_one(
        {"user_id": current_user['user_id'], "is_completed": False},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    return SessionResponse(
        session_id=session['session_id'],
        phases_completed=session['phases_completed'],
        is_completed=session['is_completed']
    )

@api_router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get today's stats
    today_stats = await db.daily_stats.find_one(
        {"user_id": current_user['user_id'], "date": today},
        {"_id": 0}
    )
    
    today_sessions = today_stats['sessions_completed'] if today_stats else 0
    
    # Get weekly stats (last 7 days)
    weekly_stats = []
    for i in range(6, -1, -1):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        day_stats = await db.daily_stats.find_one(
            {"user_id": current_user['user_id'], "date": date},
            {"_id": 0}
        )
        weekly_stats.append({
            "date": date,
            "sessions": day_stats['sessions_completed'] if day_stats else 0
        })
    
    return DashboardResponse(
        discipline_score=current_user['discipline_score'],
        current_streak=current_user['current_streak'],
        longest_streak=current_user['longest_streak'],
        total_sessions=current_user['total_sessions'],
        level=current_user['level'],
        level_name=get_level_name(current_user['level']),
        today_sessions=today_sessions,
        weekly_stats=weekly_stats
    )

@api_router.get("/profile", response_model=ProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    badges = get_badges(current_user)
    
    return ProfileResponse(
        name=current_user['name'],
        email=current_user['email'],
        level=current_user['level'],
        level_name=get_level_name(current_user['level']),
        discipline_score=current_user['discipline_score'],
        total_sessions=current_user['total_sessions'],
        current_streak=current_user['current_streak'],
        longest_streak=current_user['longest_streak'],
        badges=badges
    )

@api_router.post("/ai-coach/generate")
async def generate_daily_feedback(current_user: dict = Depends(get_current_user)):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Check if feedback already exists for today
    existing_feedback = await db.ai_feedback.find_one(
        {"user_id": current_user['user_id'], "date": today},
        {"_id": 0}
    )
    
    if existing_feedback:
        return AIFeedbackResponse(
            feedback=existing_feedback['feedback'],
            date=existing_feedback['date']
        )
    
    # Get today's stats
    today_stats = await db.daily_stats.find_one(
        {"user_id": current_user['user_id'], "date": today},
        {"_id": 0}
    )
    
    if not today_stats:
        today_stats = {"sessions_completed": 0}
    
    # Generate feedback
    feedback_text = await generate_ai_feedback(
        current_user['user_id'],
        current_user,
        today_stats
    )
    
    # Save feedback
    feedback = AIFeedback(
        user_id=current_user['user_id'],
        date=today,
        feedback=feedback_text
    )
    
    feedback_dict = feedback.model_dump()
    feedback_dict['created_at'] = feedback_dict['created_at'].isoformat()
    
    await db.ai_feedback.insert_one(feedback_dict)
    
    return AIFeedbackResponse(
        feedback=feedback_text,
        date=today
    )

@api_router.get("/ai-coach/latest", response_model=Optional[AIFeedbackResponse])
async def get_latest_feedback(current_user: dict = Depends(get_current_user)):
    feedback = await db.ai_feedback.find_one(
        {"user_id": current_user['user_id']},
        {"_id": 0},
        sort=[("date", -1)]
    )
    
    if not feedback:
        return None
    
    return AIFeedbackResponse(
        feedback=feedback['feedback'],
        date=feedback['date']
    )

@api_router.get("/sessions/history")
async def get_session_history(current_user: dict = Depends(get_current_user), limit: int = 10):
    """Get recent completed sessions"""
    sessions = await db.sessions.find(
        {"user_id": current_user['user_id'], "is_completed": True},
        {"_id": 0}
    ).sort("completed_at", -1).limit(limit).to_list(limit)
    
    return {"sessions": sessions, "total": len(sessions)}

# ==================== PREFERENCES ====================

@api_router.get("/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """Get user preferences"""
    prefs = await db.preferences.find_one(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not prefs:
        # Return defaults
        return {
            "phase_durations": {"preview": 5, "learn": 35, "recall": 10, "test": 10},
            "timer_brightness": 100,
            "enable_sounds": True,
            "show_on_leaderboard": False
        }
    
    return prefs

@api_router.post("/preferences")
async def update_preferences(
    request: UpdatePreferencesRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user preferences"""
    prefs = await db.preferences.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    
    if prefs:
        # Update existing
        update_data = {}
        if request.phase_durations is not None:
            update_data["phase_durations"] = request.phase_durations
        if request.timer_brightness is not None:
            update_data["timer_brightness"] = request.timer_brightness
        if request.enable_sounds is not None:
            update_data["enable_sounds"] = request.enable_sounds
        if request.show_on_leaderboard is not None:
            update_data["show_on_leaderboard"] = request.show_on_leaderboard
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.preferences.update_one(
            {"user_id": current_user['user_id']},
            {"$set": update_data}
        )
    else:
        # Create new
        new_prefs = UserPreferences(
            user_id=current_user['user_id'],
            phase_durations=request.phase_durations or {"preview": 5, "learn": 35, "recall": 10, "test": 10},
            timer_brightness=request.timer_brightness if request.timer_brightness is not None else 100,
            enable_sounds=request.enable_sounds if request.enable_sounds is not None else True,
            show_on_leaderboard=request.show_on_leaderboard if request.show_on_leaderboard is not None else False
        )
        
        prefs_dict = new_prefs.model_dump()
        prefs_dict['updated_at'] = prefs_dict['updated_at'].isoformat()
        
        await db.preferences.insert_one(prefs_dict)
    
    return {"success": True, "message": "Preferences updated"}

# ==================== SESSION NOTES ====================

@api_router.post("/session/{session_id}/note")
async def save_session_note(
    session_id: str,
    request: SaveNoteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save a note for a specific phase in a session"""
    session = await db.sessions.find_one(
        {"session_id": session_id, "user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    notes = session.get('notes', {})
    notes[request.phase] = request.note
    
    await db.sessions.update_one(
        {"session_id": session_id},
        {"$set": {"notes": notes}}
    )
    
    return {"success": True, "message": "Note saved"}

# ==================== LEADERBOARD ====================

@api_router.get("/leaderboard")
async def get_leaderboard(limit: int = 50):
    """Get top performers leaderboard"""
    # Get users who opted in to leaderboard
    opted_in_users = await db.preferences.find(
        {"show_on_leaderboard": True},
        {"_id": 0, "user_id": 1}
    ).to_list(1000)
    
    opted_in_ids = [p['user_id'] for p in opted_in_users]
    
    if not opted_in_ids:
        return {"leaderboard": []}
    
    # Get users with highest discipline scores
    users = await db.users.find(
        {"user_id": {"$in": opted_in_ids}},
        {"_id": 0, "user_id": 1, "name": 1, "discipline_score": 1, "level": 1, "current_streak": 1, "total_sessions": 1}
    ).sort("discipline_score", -1).limit(limit).to_list(limit)
    
    # Add rank
    leaderboard = []
    for idx, user in enumerate(users):
        leaderboard.append({
            "rank": idx + 1,
            "name": user['name'],
            "discipline_score": user['discipline_score'],
            "level": user['level'],
            "level_name": get_level_name(user['level']),
            "current_streak": user['current_streak'],
            "total_sessions": user['total_sessions']
        })
    
    return {"leaderboard": leaderboard}

# ==================== EXPORT DATA ====================

@api_router.get("/export/sessions")
async def export_sessions(current_user: dict = Depends(get_current_user)):
    """Export user session data as CSV"""
    from io import StringIO
    import csv
    
    sessions = await db.sessions.find(
        {"user_id": current_user['user_id'], "is_completed": True},
        {"_id": 0}
    ).sort("completed_at", -1).to_list(1000)
    
    # Create CSV
    output = StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Session ID', 'Started At', 'Completed At', 'Phases Completed', 'Notes'])
    
    # Data
    for session in sessions:
        writer.writerow([
            session['session_id'],
            session['started_at'],
            session.get('completed_at', ''),
            ', '.join(session['phases_completed']),
            str(session.get('notes', {}))
        ])
    
    csv_content = output.getvalue()
    
    return {
        "filename": f"studymax_sessions_{datetime.now(timezone.utc).strftime('%Y%m%d')}.csv",
        "content": csv_content
    }

@api_router.get("/export/stats")
async def export_stats(current_user: dict = Depends(get_current_user)):
    """Export user statistics as JSON"""
    # Get all stats
    daily_stats = await db.daily_stats.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).sort("date", -1).to_list(1000)
    
    user_data = {
        "user_id": current_user['user_id'],
        "name": current_user['name'],
        "email": current_user['email'],
        "discipline_score": current_user['discipline_score'],
        "level": current_user['level'],
        "level_name": get_level_name(current_user['level']),
        "current_streak": current_user['current_streak'],
        "longest_streak": current_user['longest_streak'],
        "total_sessions": current_user['total_sessions'],
        "badges": get_badges(current_user),
        "daily_stats": daily_stats,
        "export_date": datetime.now(timezone.utc).isoformat()
    }
    
    return user_data

# Health check
@api_router.get("/")
async def root():
    return {"message": "StudyMax API is running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
