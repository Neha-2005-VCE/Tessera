
# Tessera - Virtual Skills Profiling Platform

**Tessera** is application that transforms user documents (resumes, certificates, projects, videos) into a **visual, AI-enhanced skill profile**. Designed for both students and professionals, Tessera extracts, visualizes, and recommends skills and career paths using interactive UI and cutting-edge AI models.

## 🌟 Core Features

- **Modern Landing Page** highlighting Tessera’s value proposition
- **Dual Authentication Flows**: Separate onboarding for students and professionals
- **File Upload System** integrated with a Flask API for skill extraction
- **AI-Powered Skill Extraction** using Mistral and LLaMA models
- **Dual Visualization Modes**: Interactive skill tree and detailed list view
- **Skills Comparison Tool**: Analyze overlaps and strengths with other users
- **Professional Dashboard** with real-time skill analytics
- **Mobile-Responsive Design** with smooth animations and intuitive navigation

## 🧠 Tech Stack

### 🖥️ Frontend
- React + TypeScript
- Tailwind CSS
- React Router


### 🧪 Backend (Node.js)
- **Node.js + Express**
- PostgreSQL (via `pg` module)
- JWT Authentication
- Secure password handling with `bcrypt`
- RESTful APIs

### 🧠 AI & Processing Layer (Python)
- Flask (API in `FlaskEndpoint/app.py`)
- Mistral + LLaMA models via OpenRouter/Together API
- Faster Whisper for video/audio transcription
- PDF/Image/Video processing with OpenCV, pdf2image, and MoviePy

## 📦 Installation

### 1. Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Python 3.9+

### 2. Setup

```bash
# Clone the repo
https://github.com/Neha-2005-VCE/Tessera.git
cd coachinproject


# Setup PostgreSQL
# Create DB and add details in \`.env\`
CREATE DATABASE tessera_db;
```

### 3. Configure `.env`

```env
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/tessera_db
JWT_SECRET=your_super_secret
```

## 🚀 Run the App

### Development Mode

```bash
# Start Flask AI API
cd FlaskEndpoint
python app.py

# Start Node.js + React concurrently
cd ..
npm run dev
```



## 🧪 Future Roadmap

- ✅ Real-time collaboration on skill trees
- ⏳ Resume ranking against job descriptions

