# DevOps Copilot

🔗 **[Live demo](https://devops-copilot-k7jwcylb0-ladhetal25-5163s-projects.vercel.app/)** — note: backend runs on a free-tier instance that sleeps after inactivity, so the first request may take ~30-60s to wake up.

An AI-powered incident triage assistant for DevOps & SRE teams. Paste logs → identify root cause → get safe remediation steps → export updates. Self-hostable end-to-end; log analysis is powered by Groq's LLM API.

## Features

 **Intelligent Log Analysis**: Automatically analyze and parse logs to identify issues
**Root Cause Identification**: AI-powered root cause analysis for incidents
**Safe Remediation Steps**: Get actionable, safe remediation recommendations
**Export Updates**: Export findings and updates for documentation
**Self-Hostable**: Full source available — run your own instance with your own Groq API key

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **Python 3.x**

### Frontend
- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Project Structure

```
devops-copilot/
├── backend/                 # FastAPI backend application
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core configuration
│   │   ├── db/             # Database models and migrations
│   │   ├── services/       # Business logic services
│   │   └── main.py         # FastAPI application entry point
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   └── app/            # Next.js app directory
│   ├── package.json        # Node.js dependencies
│   └── next.config.ts      # Next.js configuration
├── infra/                  # Infrastructure as code
├── models/                 # Shared models/schemas
└── README.md              # This file
```

## Prerequisites

- **Python 3.8+** (recommended: Python 3.11+)
- **Node.js 18+** (recommended: Node.js 20+)
- **npm** or **yarn** package manager

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the `backend/` directory:
```bash
GROQ_API_KEY=your_groq_api_key_here
```
Get a free key at [console.groq.com](https://console.groq.com).

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the `frontend/` directory:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Running the Application

### Development Mode

1. **Start the backend server** (from `backend/` directory):
```bash
# Activate virtual environment if not already active
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Run the FastAPI server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

2. **Start the frontend development server** (from `frontend/` directory):
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Production Build

**Backend:**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## API Documentation

Once the backend is running, you can access:
- **Interactive API docs**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative docs**: `http://localhost:8000/redoc` (ReDoc)

## Environment Variables

### Backend (`.env` in `backend/` directory)
```bash
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend (`.env.local` in `frontend/` directory)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Development

### Backend Development

- The backend uses FastAPI with hot-reload enabled in development mode
- API routes should be added in `backend/app/api/`
- Business logic should go in `backend/app/services/`
- Database models should be in `backend/app/db/`

### Frontend Development

- The frontend uses Next.js App Router
- Pages are in `frontend/src/app/`
- React Compiler is enabled for optimized React rendering
- Tailwind CSS is configured for styling

## Health Check

The application includes a health check endpoint:
- **Endpoint**: `GET /health`
- **Response**: `{"status": "ok", "service": "devops-copilot-api"}`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues, questions, or contributions, please open an issue on the repository.
