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
JWT_SECRET = os.environ.get('JWT_SECRET', 'crammax_secret_key')
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
    validated: bool = False  # AI verification passed

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

class StudyDeclaration(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    session_id: str
    user_id: str
    subject: str
    exam_board: str
    grade: str
    topic: str
    study_material: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecallSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    session_id: str
    user_id: str
    content: str
    word_count: int
    validated: bool = False
    validation_feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Quiz(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    quiz_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: str
    topic: str
    questions: List[dict]  # [{"question": "...", "correct_answer": "..."}]
    user_answers: dict = {}  # {"0": "answer", "1": "answer"}
    score: int = 0
    passed: bool = False
    attempt_number: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class KnowledgeProgress(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    subject: str
    topic: str
    mastery_level: int = 0  # 0-3
    quiz_attempts: int = 0
    quizzes_passed: int = 0
    study_xp: int = 0
    knowledge_xp: int = 0
    last_studied: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudySession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_id: str  # Reference to Session model
    subject: str
    topic: str
    session_date: str  # YYYY-MM-DD format
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    level_earned: int
    quiz_score: int
    phases_completed: int
    recall_passed: bool
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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

class DeclareStudyRequest(BaseModel):
    subject: str
    exam_board: str
    grade: str
    topic: str
    study_material: Optional[str] = None

class SubmitRecallRequest(BaseModel):
    content: str

class SubmitQuizRequest(BaseModel):
    answers: dict  # {"0": "answer1", "1": "answer2", ...}

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

async def generate_quiz(topic: str, subject: str, grade: str, exam_board: str, attempt: int = 1) -> List[dict]:
    """Generate 5 quiz questions based on the study topic"""
    try:
        context = f"""
Generate exactly 5 quiz questions for this study session:

Subject: {subject}
Exam Board: {exam_board}
Grade/Class: {grade}
Topic: {topic}
Attempt Number: {attempt}

Requirements:
1. Generate 5 questions that test understanding, not just memorization
2. Mix question types: definitions, concepts, applications, differences
3. Questions should be clear and specific
4. Each question should have a clear correct answer
5. If this is attempt {attempt}, vary the questions from previous attempts
6. Make questions progressively challenging

Return in this EXACT JSON format:
[
  {{"question": "Question 1 text here?", "correct_answer": "Brief correct answer"}},
  {{"question": "Question 2 text here?", "correct_answer": "Brief correct answer"}},
  {{"question": "Question 3 text here?", "correct_answer": "Brief correct answer"}},
  {{"question": "Question 4 text here?", "correct_answer": "Brief correct answer"}},
  {{"question": "Question 5 text here?", "correct_answer": "Brief correct answer"}}
]

Only return the JSON array, nothing else.
"""
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"quiz_{topic}_{attempt}",
            system_message="You are an educational assessment expert. Generate clear, specific quiz questions that test understanding."
        )
        chat.with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=context)
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        questions = json.loads(response.strip())
        
        return questions
    except Exception as e:
        logging.error(f"Quiz generation failed: {e}")
        # Fallback questions
        return [
            {"question": f"What is the main concept of {topic}?", "correct_answer": "User should provide answer"},
            {"question": f"Explain one key principle related to {topic}.", "correct_answer": "User should provide answer"},
            {"question": f"How is {topic} applied in real scenarios?", "correct_answer": "User should provide answer"},
            {"question": f"What are the components of {topic}?", "correct_answer": "User should provide answer"},
            {"question": f"Why is {topic} important in {subject}?", "correct_answer": "User should provide answer"}
        ]

async def validate_recall_summary(content: str, topic: str, subject: str) -> tuple[bool, str]:
    """Validate if recall summary is relevant and meaningful"""
    try:
        word_count = len(content.split())
        
        if word_count < 80:
            return False, f"Too short. Write at least 80 words. Current: {word_count} words."
        
        context = f"""
Analyze this recall summary written by a student after studying:

Topic: {topic}
Subject: {subject}
Student's Recall:
{content}

Determine if this recall summary demonstrates genuine learning:

1. Does it contain relevant concepts about the topic?
2. Is it meaningful and not just filler text?
3. Does it show understanding, not just copy-paste?
4. Are there specific details mentioned?

Respond in this format:
VALID: yes/no
FEEDBACK: One sentence feedback

Example responses:
VALID: yes
FEEDBACK: Good recall with specific concepts mentioned.

VALID: no
FEEDBACK: Summary lacks specific concepts. Write about key principles and definitions.
"""
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        chat = LlmChat(
            api_key=api_key,
            session_id=f"recall_{topic}",
            system_message="You are an educational validator. Check if student recall is genuine and meaningful."
        )
        chat.with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=context)
        response = await chat.send_message(user_message)
        
        # Parse response
        lines = response.strip().split('\n')
        is_valid = "yes" in lines[0].lower()
        feedback = lines[1].replace("FEEDBACK:", "").strip() if len(lines) > 1 else "Recall validated."
        
        return is_valid, feedback
    except Exception as e:
        logging.error(f"Recall validation failed: {e}")
        # Fallback - basic validation
        word_count = len(content.split())
        if word_count >= 80:
            return True, "Recall accepted based on length."
        else:
            return False, f"Write at least 80 words. Current: {word_count} words."

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

# ==================== STUDY VERIFICATION SYSTEM ====================

@api_router.post("/session/{session_id}/declare")
async def declare_study_topic(
    session_id: str,
    request: DeclareStudyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Declare what will be studied before starting MAX MODE"""
    session = await db.sessions.find_one(
        {"session_id": session_id, "user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Create study declaration
    declaration = StudyDeclaration(
        session_id=session_id,
        user_id=current_user['user_id'],
        subject=request.subject,
        exam_board=request.exam_board,
        grade=request.grade,
        topic=request.topic,
        study_material=request.study_material
    )
    
    decl_dict = declaration.model_dump()
    decl_dict['created_at'] = decl_dict['created_at'].isoformat()
    
    await db.study_declarations.insert_one(decl_dict)
    
    return {"success": True, "message": "Study topic declared"}

@api_router.post("/session/{session_id}/recall")
async def submit_recall_summary(
    session_id: str,
    request: SubmitRecallRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit recall summary after completing session"""
    session = await db.sessions.find_one(
        {"session_id": session_id, "user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Get study declaration
    declaration = await db.study_declarations.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not declaration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No study declaration found")
    
    # Validate recall summary with AI
    is_valid, feedback = await validate_recall_summary(
        request.content,
        declaration['topic'],
        declaration['subject']
    )
    
    # Save recall summary
    word_count = len(request.content.split())
    recall = RecallSummary(
        session_id=session_id,
        user_id=current_user['user_id'],
        content=request.content,
        word_count=word_count,
        validated=is_valid,
        validation_feedback=feedback
    )
    
    recall_dict = recall.model_dump()
    recall_dict['created_at'] = recall_dict['created_at'].isoformat()
    
    await db.recall_summaries.insert_one(recall_dict)
    
    return {
        "success": is_valid,
        "validated": is_valid,
        "feedback": feedback,
        "word_count": word_count
    }

@api_router.post("/session/{session_id}/generate-quiz")
async def generate_session_quiz(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Generate AI quiz for session verification"""
    session = await db.sessions.find_one(
        {"session_id": session_id, "user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Check if recall summary was validated
    recall = await db.recall_summaries.find_one(
        {"session_id": session_id, "validated": True},
        {"_id": 0}
    )
    
    if not recall:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must submit valid recall summary first"
        )
    
    # Get study declaration
    declaration = await db.study_declarations.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not declaration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No study declaration found")
    
    # Check existing quiz attempts
    existing_quizzes = await db.quizzes.find(
        {"session_id": session_id},
        {"_id": 0}
    ).to_list(10)
    
    attempt_number = len(existing_quizzes) + 1
    
    # Generate quiz questions
    questions = await generate_quiz(
        declaration['topic'],
        declaration['subject'],
        declaration['grade'],
        declaration['exam_board'],
        attempt_number
    )
    
    # Create quiz
    quiz = Quiz(
        session_id=session_id,
        user_id=current_user['user_id'],
        topic=declaration['topic'],
        questions=questions,
        attempt_number=attempt_number
    )
    
    quiz_dict = quiz.model_dump()
    quiz_dict['created_at'] = quiz_dict['created_at'].isoformat()
    
    await db.quizzes.insert_one(quiz_dict)
    
    # Return questions without correct answers
    quiz_questions = [
        {"id": i, "question": q["question"]}
        for i, q in enumerate(questions)
    ]
    
    return {
        "quiz_id": quiz.quiz_id,
        "questions": quiz_questions,
        "attempt_number": attempt_number
    }

@api_router.post("/session/{session_id}/submit-quiz")
async def submit_quiz_answers(
    session_id: str,
    request: SubmitQuizRequest,
    current_user: dict = Depends(get_current_user)
):
    """Submit quiz answers and validate session"""
    # Get latest quiz for this session
    quiz = await db.quizzes.find_one(
        {"session_id": session_id, "user_id": current_user['user_id']},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    
    # Calculate score
    correct_count = 0
    for idx, user_answer in request.answers.items():
        question_idx = int(idx)
        if question_idx < len(quiz['questions']):
            correct_answer = quiz['questions'][question_idx]['correct_answer'].lower().strip()
            if user_answer.lower().strip() in correct_answer or correct_answer in user_answer.lower().strip():
                correct_count += 1
    
    total_questions = len(quiz['questions'])
    score = correct_count
    passed = score >= 3  # Need 3/5 to pass
    
    # Update quiz with results
    await db.quizzes.update_one(
        {"quiz_id": quiz['quiz_id']},
        {"$set": {
            "user_answers": request.answers,
            "score": score,
            "passed": passed
        }}
    )
    
    # Get study declaration
    declaration = await db.study_declarations.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if passed:
        # Mark session as validated
        await db.sessions.update_one(
            {"session_id": session_id},
            {"$set": {"validated": True}}
        )
        
        # Get session details for recording
        session_details = await db.sessions.find_one(
            {"session_id": session_id},
            {"_id": 0}
        )
        
        # Update knowledge progress
        knowledge = await db.knowledge_progress.find_one(
            {
                "user_id": current_user['user_id'],
                "subject": declaration['subject'],
                "topic": declaration['topic']
            },
            {"_id": 0}
        )
        
        if knowledge:
            # Update existing
            quiz_attempts = knowledge['quiz_attempts'] + 1
            quizzes_passed = knowledge['quizzes_passed'] + 1
            study_xp = knowledge['study_xp'] + 100
            knowledge_xp = knowledge['knowledge_xp'] + (score * 20)
            
            # Calculate mastery level
            mastery_level = min(3, quizzes_passed // 3)
            
            await db.knowledge_progress.update_one(
                {
                    "user_id": current_user['user_id'],
                    "subject": declaration['subject'],
                    "topic": declaration['topic']
                },
                {"$set": {
                    "quiz_attempts": quiz_attempts,
                    "quizzes_passed": quizzes_passed,
                    "study_xp": study_xp,
                    "knowledge_xp": knowledge_xp,
                    "mastery_level": mastery_level,
                    "last_studied": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            # Create new
            new_progress = KnowledgeProgress(
                user_id=current_user['user_id'],
                subject=declaration['subject'],
                topic=declaration['topic'],
                mastery_level=0,
                quiz_attempts=1,
                quizzes_passed=1,
                study_xp=100,
                knowledge_xp=score * 20
            )
            
            progress_dict = new_progress.model_dump()
            progress_dict['last_studied'] = progress_dict['last_studied'].isoformat()
            progress_dict['updated_at'] = progress_dict['updated_at'].isoformat()
            
            await db.knowledge_progress.insert_one(progress_dict)
        
        # Record study session (NEW)
        start_time = datetime.fromisoformat(session_details['started_at'])
        end_time = datetime.now(timezone.utc)
        duration_minutes = int((end_time - start_time).total_seconds() / 60)
        
        # Check if recall passed
        recall_summary = await db.recall_summaries.find_one(
            {"session_id": session_id, "validated": True},
            {"_id": 0}
        )
        
        study_session = StudySession(
            user_id=current_user['user_id'],
            session_id=session_id,
            subject=declaration['subject'],
            topic=declaration['topic'],
            session_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            level_earned=current_user['level'],
            quiz_score=score,
            phases_completed=len(session_details.get('phases_completed', [])),
            recall_passed=recall_summary is not None
        )
        
        study_session_dict = study_session.model_dump()
        study_session_dict['start_time'] = study_session_dict['start_time'].isoformat()
        study_session_dict['end_time'] = study_session_dict['end_time'].isoformat()
        study_session_dict['created_at'] = study_session_dict['created_at'].isoformat()
        
        await db.study_sessions.insert_one(study_session_dict)
    
    return {
        "success": passed,
        "passed": passed,
        "score": score,
        "total": total_questions,
        "message": "Session validated! Discipline score earned." if passed else "Quiz failed. Retry to validate session.",
        "correct_answers": [q["correct_answer"] for q in quiz['questions']]
    }

@api_router.get("/knowledge-map")
async def get_knowledge_map(current_user: dict = Depends(get_current_user)):
    """Get user's knowledge mastery map"""
    knowledge_items = await db.knowledge_progress.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    
    # Group by subject
    knowledge_map = {}
    for item in knowledge_items:
        subject = item['subject']
        if subject not in knowledge_map:
            knowledge_map[subject] = []
        
        knowledge_map[subject].append({
            "topic": item['topic'],
            "mastery_level": item['mastery_level'],
            "mastery_name": ["Not Started", "Basic", "Concept Clarity", "Mastery"][item['mastery_level']],
            "quiz_attempts": item['quiz_attempts'],
            "quizzes_passed": item['quizzes_passed'],
            "study_xp": item['study_xp'],
            "knowledge_xp": item['knowledge_xp'],
            "last_studied": item['last_studied']
        })
    
    return {"knowledge_map": knowledge_map}

@api_router.get("/session/{session_id}/verification-status")
async def get_verification_status(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Check verification status of a session"""
    session = await db.sessions.find_one(
        {"session_id": session_id, "user_id": current_user['user_id']},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    # Check declaration
    declaration = await db.study_declarations.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    # Check recall
    recall = await db.recall_summaries.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    # Check quiz
    quiz = await db.quizzes.find_one(
        {"session_id": session_id, "passed": True},
        {"_id": 0}
    )
    
    return {
        "session_id": session_id,
        "declared": declaration is not None,
        "recall_submitted": recall is not None,
        "recall_validated": recall['validated'] if recall else False,
        "quiz_passed": quiz is not None,
        "session_validated": session.get('validated', False)
    }

# ==================== STUDY SESSION TRACKING & ANALYTICS ====================

@api_router.get("/analytics/daily")
async def get_daily_analytics(current_user: dict = Depends(get_current_user)):
    """Get today's study analytics"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get today's study sessions
    today_sessions = await db.study_sessions.find(
        {"user_id": current_user['user_id'], "session_date": today},
        {"_id": 0}
    ).to_list(100)
    
    total_sessions = len(today_sessions)
    total_minutes = sum(s['duration_minutes'] for s in today_sessions)
    
    return {
        "date": today,
        "sessions_count": total_sessions,
        "total_minutes": total_minutes,
        "sessions": today_sessions
    }

@api_router.get("/analytics/monthly")
async def get_monthly_analytics(current_user: dict = Depends(get_current_user)):
    """Get monthly study analytics"""
    # Get current month sessions
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    
    all_sessions = await db.study_sessions.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).to_list(10000)
    
    # Group by month
    monthly_data = {}
    for session in all_sessions:
        month = session['session_date'][:7]  # YYYY-MM
        if month not in monthly_data:
            monthly_data[month] = {
                "month": month,
                "sessions_count": 0,
                "total_minutes": 0
            }
        monthly_data[month]["sessions_count"] += 1
        monthly_data[month]["total_minutes"] += session['duration_minutes']
    
    # Sort by month descending
    monthly_list = sorted(monthly_data.values(), key=lambda x: x['month'], reverse=True)
    
    # Get current month data
    current_month_data = monthly_data.get(current_month, {
        "month": current_month,
        "sessions_count": 0,
        "total_minutes": 0
    })
    
    return {
        "current_month": current_month_data,
        "all_months": monthly_list
    }

@api_router.get("/analytics/yearly")
async def get_yearly_analytics(current_user: dict = Depends(get_current_user)):
    """Get yearly study analytics"""
    all_sessions = await db.study_sessions.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).to_list(10000)
    
    # Group by year
    yearly_data = {}
    for session in all_sessions:
        year = session['session_date'][:4]  # YYYY
        if year not in yearly_data:
            yearly_data[year] = {
                "year": year,
                "sessions_count": 0,
                "total_minutes": 0,
                "total_hours": 0
            }
        yearly_data[year]["sessions_count"] += 1
        yearly_data[year]["total_minutes"] += session['duration_minutes']
    
    # Calculate hours
    for year_data in yearly_data.values():
        year_data["total_hours"] = round(year_data["total_minutes"] / 60, 1)
    
    # Sort by year descending
    yearly_list = sorted(yearly_data.values(), key=lambda x: x['year'], reverse=True)
    
    return {
        "all_years": yearly_list,
        "lifetime_minutes": sum(s['duration_minutes'] for s in all_sessions),
        "lifetime_hours": round(sum(s['duration_minutes'] for s in all_sessions) / 60, 1),
        "lifetime_sessions": len(all_sessions)
    }

@api_router.get("/sessions/history")
async def get_session_history(
    current_user: dict = Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    """Get paginated session history"""
    sessions = await db.study_sessions.find(
        {"user_id": current_user['user_id']},
        {"_id": 0}
    ).sort("session_date", -1).skip(skip).limit(limit).to_list(limit)
    
    total_count = await db.study_sessions.count_documents(
        {"user_id": current_user['user_id']}
    )
    
    return {
        "sessions": sessions,
        "total_count": total_count,
        "limit": limit,
        "skip": skip
    }

# Health check
@api_router.get("/")
async def root():
    return {"message": "Cram Max API is running"}

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
