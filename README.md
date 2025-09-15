# Prompt-D-Voice

AI-powered Script Generator and Text-to-Speech Application

## Features
- Generate scripts with AI (Gemini)
- Convert text to speech
- User authentication
- Usage tracking

## Tech Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite
- AI: Google Gemini API

## Live Demo
- Frontend: https://spsocial.github.io/Prompt-D-Voice/
- Backend: (Deploy on Railway)

## Local Development

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables
Create `.env` in backend folder:
```
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
```

## Deployment
- Frontend: GitHub Pages
- Backend: Railway