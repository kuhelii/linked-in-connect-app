# LinkedIn Networking Platform - ADK Search Agent Quick Start (Local Usage)

This guide explains how to run the Google Agent Development Kit (ADK) search agent locally in the `linkedin-networking-platform` project. The agent provides search functionality (nearby users, LinkedIn profiles, random users) and integrates with your MERN stack's MongoDB database (`linkedin_networking`).

## Prerequisites
- Python 3.9+ installed.
- Node.js 14+ for the MERN stack (`client/` and `server/`).
- MongoDB running locally or via Atlas, with the `linkedin_networking` database set up.
- `searchagent/.env` configured with:
  ```plaintext
  MONGO_URI=mongodb://localhost:27017/linkedin_networking
  SERPAPI_KEY=your_serpapi_key
  GOOGLE_AI_API_KEY=your_google_ai_api_key
  ```
- Virtual environment set up at `linkedin-networking-platform/venv` with dependencies installed (`google-adk==0.1.0`, `pymongo==4.8.0`, `python-dotenv==1.0.1`, `httpx==0.27.2`, `bcrypt==4.2.0`).

## Project Structure
```
linkedin-networking-platform/
├── client/                    # React frontend
├── server/                    # Node.js/Express backend
├── searchagent/               # ADK search agent
│   ├── app.py
│   ├── tools.py
│   ├── utils.py
│   ├── linkedin_service.py
│   ├── models.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── venv/                     # Python virtual environment
└── .gitignore
```

## Running the ADK Agent

### 1. Activate the Virtual Environment
```bash
python -m venv .venv
.\venv\Scripts\activate
```

### 2. Run the ADK Agent
Navigate to the `searchagent/` directory and start the ADK server using either `adk web` or `adk run`:

#### Option 1: Run with Web UI (`adk web`)
```bash
cd C:\Users\ASUS\Downloads\linkedin-networking-platform [not inside the searchagent folder]
adk web
```
- Open `http://127.0.0.1:8000` in your browser.
- Test queries in the ADK Web UI:
  - `Find users within 10km from lat 37.7749, lng -122.4194`
  - `Search for software engineers in India`
  - `Find a random user`

#### Option 2: Run with CLI (`adk run`)
```bash
cd C:\Users\ASUS\Downloads\linkedin-networking-platform [not inside the searchagent folder]
adk run searchagent
```
- Follow the CLI prompts to enter queries like above.

3. Integrate with React Frontend
# SOON
```bash
cd C:\Users\ASUS\Downloads\linkedin-networking-platform [not inside the searchagent folder]
adk api_server --reload_agents --allow_origins http://localhost:3000
```