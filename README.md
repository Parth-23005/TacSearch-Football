# TacSearch Football ⚽

AI-powered football video analysis platform with semantic search capabilities.

## Features

- 🎥 Upload and process football match videos
- 🤖 AI-powered event detection (goals, fouls, passes, etc.)
- 🔍 Semantic search for specific moments
- 📊 Temporal action recognition using VideoMAE
- 🎯 Player tracking with YOLOv8

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLModel (ORM)
- PyTorch + Transformers
- YOLOv8, VideoMAE, CLIP

**Frontend:**
- React + TypeScript
- Vite
- TanStack Query
- Tailwind CSS

## Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- (Optional) CUDA-capable GPU for faster processing

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd TacSearch-Football
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Install Node dependencies**
```bash
npm install
```

4. **Download AI models** (automatic on first run)
- YOLOv8n model will download automatically
- VideoMAE and CLIP models will download from Hugging Face

### Running the Application

**Start Backend** (Terminal 1):
```bash
python -m uvicorn backend.main:app --reload --port 8000
```

**Start Frontend** (Terminal 2):
```bash
npm run dev
```

**Access the app**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Usage

1. Upload a football match video
2. Wait for AI processing (5-15 minutes depending on video length)
3. Search for specific events using natural language
4. View timestamped clips of detected events

## Project Structure

```
TacSearch-Football/
├── backend/
│   ├── ai/              # AI models and processing
│   ├── api/             # API routes
│   ├── models.py        # Database models
│   └── main.py          # FastAPI app
├── client/src/          # React frontend
├── static/uploads/      # Uploaded videos (not in git)
├── requirements.txt     # Python dependencies
└── package.json         # Node dependencies
```

## Important Notes

### Large Files Not Included

The following are excluded from git (download/generate on setup):

- **AI Models**: YOLOv8, VideoMAE, CLIP (auto-download)
- **Videos**: Upload your own videos
- **Database**: Created automatically on first run
- **node_modules**: Install with `npm install`

### First Run

On first run, the application will:
1. Download AI models (~500MB total)
2. Create database tables
3. Set up upload directories

This may take 5-10 minutes depending on your internet connection.

## Known Issues

- Processing is slow on CPU-only systems (use GPU for faster results)
- Large videos (>30 min) may require significant RAM

## License

MIT

## Contributing

Pull requests welcome! Please ensure code follows existing style.
