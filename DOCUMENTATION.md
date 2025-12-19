# Goggins Habit Tracker - Documentation

Stay hard. This documentation provides a comprehensive guide on how to use, build, and extend the Goggins Habit Tracker.

---

## 1. Usage Guide: Step-by-Step

### Step 1: Authentication
- **Sign Up / Login**: Start by creating an account or logging in. The system uses a centralized authentication service.
- **BYOK (Bring Your Own Key)**: To enable AI features, you can provide your own Gemini API key in the settings/profile section (stored securely).

### Step 2: Defining Objectives
- **Create a Goal**: Navigate to the "Objectives" section. Define what you want to achieve.
- **AI Contract**: The AI will help you forge a "contract" for your goal, defining the stakes and the path.
- **Five Whys**: Optionally use the "Five Whys" technique to dig deep into your motivation.

### Step 3: Managing Tasks
- **Daily Tasks**: Add tasks you need to complete today.
- **Recurring Tasks**: Set up habits that repeat (daily, weekly, etc.).
- **Side Quests**: Add minor, low-effort tasks for quick wins.

### Step 4: Tracking Progress
- **Toggle Completion**: Mark tasks as done as you complete them.
- **Daily Grind**: Track your "Daily Grind" bonus by completing all target tasks.
- **Diary/Reflection**: At the end of the day, write a reflection. The AI will provide "Goggins-style" feedback and grade your performance.

### Step 5: Accountability & Bets
- **Bets**: Place a "bet" on a task. If you fail, you face the consequences defined in your contract.
- **Character Progression**: Earn rewards and level up your character based on your consistency.

---

## 2. Technical Architecture: How it was Built

### Backend (FastAPI)
The backend is built with **FastAPI** for high performance and modern Python features.
- **Framework**: FastAPI
- **Dependency Management**: `uv`
- **Database**: SQLite with SQLAlchemy ORM.
- **Key Modules**:
    - `app/main.py`: Entry point, includes routers and CORS configuration.
    - `app/models.py`: Database schema definitions (Users, Tasks, Goals, etc.).
    - `app/routers/`: Feature-specific API endpoints (`auth`, `tasks`, `goals`, `ai`, `resources`).
    - `app/dependencies.py`: Shared dependencies like DB sessions and authentication.

### Frontend (React + Vite)
The frontend is a modern **React SPA** built with **Vite** and **TypeScript**.
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with a focus on dark, high-contrast aesthetics (Goggins inspired).
- **Key Components**:
    - `App.tsx`: Main application logic and state management.
    - `components/CalendarView`: Visualization of tasks over time.
    - `components/Chatbot`: Interactive AI assistant.
    - `context/AuthContext`: Centralized authentication state.

### AI Integration
- **Model**: Google Gemini (`gemini-2.0-flash`).
- **Integration**: The `app/routers/ai.py` handles requests to the Gemini API for goal forging, task generation, and motivational feedback.

---

## 3. Component Overview

### Core Components
- **Task List**: Manages daily and recurring tasks.
- **Goal Forge**: Interface for creating and refining long-term objectives.
- **Goggins Chatbot**: A persistent AI companion for motivation.
- **Reward System**: Tracks character progress and purchased rewards.
- **Diary Entry**: Daily reflection tool with AI grading.

---

## 4. Roadmap: What's Next & To-Do List

### Short-Term (To-Do)
- [ ] **Refactor `App.tsx`**: Break down the massive `App.tsx` into smaller, feature-specific hooks and components.
- [ ] **Mobile Responsiveness**: Enhance the UI for better use on mobile devices.
- [ ] **Unit Testing**: Implement backend tests with `pytest` and frontend tests with `vitest`.
- [ ] **Data Visualization**: Add charts to visualize habit consistency over weeks/months.

### Long-Term (Future Features)
- [ ] **Social Features**: Accountability groups or leaderboards (staying within the "Goggins" ethos).
- [ ] **Voice Integration**: Interacting with the AI chatbot via voice.
- [ ] **Advanced Notifications**: Browser/Email notifications for task reminders and bet deadlines.
- [ ] **Integration with Wearables**: Sync data from fitness trackers.

---

*Stay hard. Keep grinding.*
