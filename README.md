# Speech Analyzer

Analyze your speeches and get feedback to improve your public speaking skills.

## Features

- **Audio Recording** - Record directly from your browser
- **Whisper Transcription** - Transcribe audio to text while preserving hesitations
- **GPT-4o Analysis** - Detect filler words and provide feedback
- **Charisma Score** - Rating from 1 to 100
- **Vocabulary Suggestions** - Recommendations for improvement

## Architecture

This app uses a clean **FastAPI + HTML/JS** architecture for maximum modularity:

```
Speech analyzer/
├── backend/
│   ├── main.py              # FastAPI app with REST endpoints
│   ├── services/
│   │   ├── transcription.py # Whisper API integration
│   │   └── analysis.py      # GPT-4o analysis
│   └── prompts/
│       └── analysis_prompt.py
├── frontend/
│   ├── index.html           # Main HTML structure
│   ├── css/
│   │   ├── theme.css        # Colors, fonts (easy to customize)
│   │   ├── layout.css       # Grid, responsive design
│   │   └── components.css   # UI component styles
│   └── js/
│       ├── app.js           # Main application logic
│       ├── api.js           # Backend API calls
│       ├── recorder.js      # Audio recording
│       └── components.js    # UI component renderers
├── requirements.txt
├── .env
└── README.md
```

## Installation

### 1. Clone or download the project

```bash
cd "Speech analyzer"
```

### 2. Create a virtual environment (recommended)

```bash
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure API Key

Create a `.env` file in the main directory:

```
OPENAI_API_KEY=sk-your-api-key-here
```

## Usage

### Start the application

```bash
# From the project root
uvicorn backend.main:app --reload

# Or run directly
python backend/main.py
```

Then open http://localhost:8000 in your browser.

### Steps to use

1. Click **Start Recording**
2. Tell your speech
3. Click **Stop Recording**
4. Click **Analyze Speech**
5. View your results in the tabs

## Customizing the UI

### Theme Colors

Edit `frontend/css/theme.css` to change colors, fonts, and spacing:

```css
:root {
    --primary: #667eea;      /* Main accent color */
    --danger: #ff4444;       /* Error/filler word color */
    --bg-body: #0e1117;      /* Background color */
    --text-primary: #ffffff; /* Main text color */
}
```

### Layout

Edit `frontend/css/layout.css` for grid and responsive changes.

### Components

Edit `frontend/css/components.css` for button styles, cards, gauges, etc.

### JavaScript

- `app.js` - Main controller and state management
- `components.js` - Add/modify UI component renderers
- `api.js` - Change API endpoints
- `recorder.js` - Audio recording configuration

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transcribe` | POST | Upload audio file, returns transcript |
| `/api/analyze` | POST | Send transcript, returns analysis JSON |
| `/` | GET | Serves the frontend |

## What We Analyze

| Aspect | Description |
|--------|-------------|
| **Filler Words** | um, uh, like, you know, basically, actually |
| **Coherence** | Identifies problematic sentences |
| **Vocabulary** | Replacement suggestions |
| **Charisma** | Score 1-100 based on clarity and impact |

## Tips for Demo

- Use a **headset with microphone** for audio quality
- Limit to **60 seconds** for fast processing
- Prepare a **pitch** with some intentional filler words
- Have a **backup audio file** ready in case of issues

## Technologies

- **FastAPI** - Backend REST API
- **Vanilla JS** - Frontend (no framework dependencies)
- **OpenAI Whisper** - Audio transcription
- **GPT-4o** - Speech analysis
- **Python 3.8+**

## License

MIT License - Created for Hackathon

---

Made with ❤️ | Powered by OpenAI
