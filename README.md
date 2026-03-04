# StudyMax - Discipline Transformation System

**Not a productivity tool. A discipline transformation system.**

StudyMax turns students into high-focus, high-consistency performers through structured study phases, gamification, and behavioral pressure.

---

## 🎯 Core Philosophy

**Discipline over Motivation.**

StudyMax is designed for students aged 15-22, competitive exam aspirants, and anyone who struggles with consistency. It's a behavioral experiment testing if structured pressure + gamification can increase study consistency.

---

## ✨ Features

### MAX MODE (Primary Feature)
A guided 50-minute structured session with 4 phases:
- **Preview** (5 min) - Survey material
- **Learn** (35 min) - Deep focus study
- **Recall** (10 min) - Active retrieval
- **Test** (10 min) - Self-assessment

Fullscreen focus mode with:
- Visible timer countdown
- Phase progression indicators
- Pause/Resume functionality
- Exit confirmation (with streak warning)

### Discipline Score System
Hidden server-side formula based on:
- Sessions completed per day
- Streak consistency
- Completion of all 4 phases
- No early exits

### Streak System
- Daily session completed = streak +1
- Miss a day = streak resets to 0
- Visual indicators on dashboard

### Dashboard Analytics
- Today's sessions count
- Discipline Score
- Current streak
- Total lifetime sessions
- Weekly consistency chart
- Level progression tracker

### AI Coach
Powered by **OpenAI GPT-4o** with Emergent LLM key:
- Daily strict feedback
- Direct, no-nonsense tone
- Based on session completion, streak, and performance
- Example: "Zero sessions today. Discipline demands action."

### Gamification System
**Levels** (Based on Discipline Score):
- Level 1-5: **Beginner**
- Level 6-15: **Focused**
- Level 16-30: **Consistent**
- Level 31-50: **Elite**
- Level 50+: **Study Machine**

**Badges** earned through milestones:
- First Session
- 10 Sessions
- 50 Sessions
- 100 Sessions
- 3-Day Streak
- Week Warrior (7 days)
- Month Master (30 days)
- Century Streak (100 days)

### Authentication
- JWT-based email/password authentication
- Protected routes
- Secure session management
- 30-day token expiration

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern async Python framework
- **MongoDB** with Motor - NoSQL database for user data, sessions, stats
- **emergentintegrations** - LLM integration library
- **JWT** - Secure authentication
- **bcrypt** - Password hashing

### Frontend
- **React 19** - UI framework
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Component library
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Router** - Navigation
- **Sonner** - Toast notifications

### Design System
- **Theme**: Obsidian Stealth (Dark mode)
- **Fonts**: 
  - Barlow Condensed (Headings)
  - JetBrains Mono (Data/Timer)
  - Inter (Body text)
- **Colors**: 
  - Background: Zinc 950 (#09090b)
  - Primary: Electric Blue (#2563eb)
  - Accent: Zinc 800-900 shades
- **Style**: Minimalistic, sharp edges, no soft motivation

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB

### Environment Variables

**Backend** (`/app/backend/.env`):
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="studymax_db"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=your_emergent_key_here
JWT_SECRET=your_secret_key_here
```

**Frontend** (`/app/frontend/.env`):
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Installation

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend:**
```bash
cd frontend
yarn install
yarn start
```

### API Documentation
Access interactive API docs at: `http://localhost:8001/docs`

---

## 📊 Success Metrics

The app tracks key behavioral metrics:
- **% of users returning next day** - Core retention metric
- **Average sessions per user** - Engagement depth
- **7-day retention rate** - Weekly consistency
- **Streak survival rate** - Long-term behavior change

**Goal**: If 30%+ return daily → continue building. If below 15% → pivot.

---

## 🔐 Security Features

- Hidden discipline formula (server-side only)
- Secure password hashing with bcrypt
- JWT token authentication
- Protected API endpoints
- AI prompts not exposed in frontend
- CORS configuration

---

## 🎨 Design Principles

1. **Serious, not childish** - Professional interface for focused students
2. **Minimalistic** - No clutter, essential info only
3. **Direct communication** - No soft motivation or emojis
4. **Performance-oriented** - Fast transitions (<150ms)
5. **Dark mode only** - Reduced eye strain for long study sessions
6. **Data-driven** - Clear metrics and progress indicators

---

## 📱 Pages Overview

1. **Landing** - Hero section, philosophy, CTAs
2. **Auth** - Login/Signup with email
3. **Home** - Quick stats and START MAX MODE button
4. **MAX MODE** - Fullscreen focus timer
5. **Dashboard** - Comprehensive analytics
6. **Profile** - User info, level, badges
7. **AI Coach** - Daily feedback generation

---

## 🧪 Testing

**Backend Testing:**
```bash
cd backend
pytest backend_test.py
```

**Test Coverage**: 100% (13/13 endpoints passing)

**Test User Credentials:**
- Email: testuser@studymax.com
- Password: Test123!

---

## 🚧 Future Enhancements (Not in MVP)

- Google OAuth integration
- Session history and detailed analytics
- Customizable phase durations
- Sound notifications
- Leaderboards (optional social pressure)
- Export study data
- Mobile app
- Premium features (advanced analytics, hardcore focus mode)

---

## 📈 Discipline Formula

**CONFIDENTIAL** - Calculated server-side only.

Example (simplified): `(Sessions × 100) + (Streak × 10)`

Actual formula includes additional factors for phase completion consistency and early exit penalties.

---

## 🎯 Project Goal

StudyMax is a **behavioral experiment** testing:
> Can structured pressure + gamification increase student consistency?

If **YES** → Scale to more users and add features.  
If **NO** → Extract learnings and pivot.

---

## 📄 License

© 2026 StudyMax. All rights reserved.

**Note**: This is a stealth-mode experiment. Do not share the discipline formula or AI prompts publicly.

---

## 🤝 Contributing

This is currently a closed experiment for initial user testing. Contribution guidelines will be added if the experiment proves successful.

---

## 📞 Support

For issues or questions, please check the API documentation or review the test reports in `/app/test_reports/`.

---

**Built with Emergent AI Platform**

*Discipline over motivation. Start your transformation today.*
