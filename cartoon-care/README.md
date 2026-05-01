# 🎨 CartoonCare — AI Medical Storybooks for Children

CartoonCare generates personalized, AI-illustrated storybooks that explain medical conditions to children in a fun, friendly, and age-appropriate way.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | FastAPI, SQLAlchemy, SQLite |
| Story AI | Ollama (Mistral) + Groq API |
| Image AI | Stable Diffusion (DreamShaper v8) |
| Auth | JWT + Google OAuth |
| PDF | ReportLab |

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) installed and running
- NVIDIA GPU recommended (RTX 4050+ for SD)

## ⚙️ Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env

# Run database migration
python migrate.py

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ollama (Story Generation)

```bash
ollama pull mistral
ollama serve
```

## 🌐 URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

## 🔑 Environment Variables

See `backend/.env.example` for all required variables.

## 👥 Default Admin

```
Email: admin@cartooncare.com
Password: Admin@123456
```

## 📁 Project Structure

```
cartoon-care/
├── backend/
│   ├── ai/              # Story + image generation
│   ├── app/             # FastAPI app, config, database
│   ├── models/          # SQLAlchemy models
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/  # Navbar, PageCard, StoryForm
    │   ├── pages/       # All page components
    │   ├── api/         # API client
    │   └── context/     # Auth context
    └── public/          # Static assets, icons, logo
```

## 🎓 GLA University — B.Tech Project 2026
