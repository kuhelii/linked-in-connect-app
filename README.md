<h1 align="center">NetworkHub — LinkedIn-style Networking Platform</h1>

Connect with nearby professionals, discover people by location/role, and chat in real time. NetworkHub is a full-stack MERN application with OAuth login and an optional Google ADK-powered search agent for smart discovery.

## What you get

- Authentication: Local + Google + LinkedIn (OAuth)
- Real-time chat with Socket.IO (typing indicators, media, voice notes)
- Friends system (requests/accept/decline), profiles, and privacy (anonymous mode)
- Location-based discovery: nearby users and LinkedIn profile search
- Optional ADK agent that can pick tools (nearby, location, random) to answer queries
- Push notifications (web push) — wiring included, routes currently commented (opt-in)

See FEATURES.md for a full feature list.

## Architecture overview

- Frontend: React + TypeScript + Vite (client/)
- Backend: Node.js + Express + TypeScript + MongoDB + Socket.IO (server/)
- Search Agent: Python-based Google Agent Development Kit (searchagent/) using MongoDB and SerpAPI
- Storage/CDN: Cloudinary for images

High level flow:

- OAuth/login issues JWT tokens. Client stores access/refresh and auto-refreshes via /api/auth/refresh.
- Client calls REST APIs at VITE_API_URL (default http://localhost:5000/api).
- Socket.IO enables real-time chat and presence.
- Optional ADK agent runs separately and can be queried via its web UI or API.

## Repository layout

```
client/           # React app (Vite + TS)
server/           # Express API (TypeScript)
searchagent/      # Google ADK agent (Python)
README.md         # You are here
FEATURES.md       # Detailed feature list
OAUTH_SETUP.md    # Step-by-step OAuth provider setup
AGENT_DOCS.md     # Running the ADK agent locally
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Cloudinary account (optional, for profile/media uploads)
- OAuth credentials (Google, LinkedIn)
- SerpAPI key (for LinkedIn search via backend or agent)
- Python 3.9+ (only if you want the ADK agent)

## Environment variables

Create a .env file in server/ with:

```
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/linkedin-networking

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Media (optional, used for uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# External services
SERPAPI_KEY=your-serpapi-key

# Push Notifications (optional; see Notifications section below)
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

Create a .env in client/ (optional) if your API URL differs:

```
# client/.env
VITE_API_URL=http://localhost:5000/api
```

If you plan to run the ADK agent, create searchagent/.env (see AGENT_DOCS.md):

```
MONGO_URI=mongodb://localhost:27017/linkedin_networking
SERPAPI_KEY=your_serpapi_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

## OAuth provider setup

Follow OAUTH_SETUP.md for detailed LinkedIn and Google setup, including exact callback URLs:

- LinkedIn callback: http://localhost:5000/api/auth/linkedin/callback
- Google callback: http://localhost:5000/api/auth/google/callback

On success, the backend redirects to the frontend at:

- http://localhost:3000/auth/callback?token=ACCESS_TOKEN&refresh=REFRESH_TOKEN

## Install and run (development)

1) Start MongoDB (ensure MONGODB_URI is reachable)

2) Backend API

```bash
cd server
npm install
npm run dev
```

Scripts:

- npm run dev – run with ts-node + nodemon
- npm run build – tsc compile to dist/
- npm start – run compiled JavaScript from dist/

3) Frontend

```bash
cd client
npm install
npm run dev
```

Vite will serve the app at http://localhost:3000.

4) Optional: ADK search agent

See AGENT_DOCS.md for full details. Quick start:

```bash
# from repo root (Windows Git Bash shown)
python -m venv .venv
source ./.venv/Scripts/activate
pip install -r searchagent/requirements.txt

# Run the ADK Web UI or CLI from repo root
adk web              # Web UI at http://127.0.0.1:8000
# OR
adk run searchagent  # CLI mode

# Optional API server (for frontend integration later)
adk api_server --reload_agents --allow_origins http://localhost:3000
```

Note: If the adk command is not found, ensure google-adk is installed (see searchagent/requirements.txt) and your virtual environment is activated.

## How the app works

- Auth: Users can register/login locally, or use Google/LinkedIn. The backend issues access/refresh tokens. The client stores them and refreshes automatically on 401.
- Profiles: Editable profile with headline, bio, photo (Cloudinary), and location (coordinates).
- Friends: Send/accept friend requests; list is available on the Friends page.
- Chat: Real-time 1:1 messaging with text/media/voice, online status, typing indicators, and message search.
- Discover: Find nearby users by geo distance, or search LinkedIn profiles by role/location (SerpAPI). The SmartSeek feature can leverage the ADK agent to find a random or relevant user.

## Enabling Web Push notifications (optional)

The wiring exists on both client and server, but server routes are commented out by default. To enable:

1) Add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY to server/.env
2) In server/src/index.ts, uncomment the notifications route import and mount:

```ts
// import notificationRoutes from "./routes/notifications";
// ...
// app.use("/api/notifications", notificationRoutes);
```

3) Restart the server. The client will fetch /api/notifications/vapid-public-key and register a service worker from client/public/sw.js.

## Production build

Backend:

```bash
cd server
npm run build
npm start
```

Frontend:

```bash
cd client
npm run build
npm run preview   # local preview
```

Deploy the built frontend (client/dist) to a static host and the backend to your Node host. Set CLIENT_URL on the server to your frontend origin and VITE_API_URL on the client to your backend origin.

## Troubleshooting

- OAuth not configured: Ensure Google/LinkedIn client IDs and secrets are present, restart the server, and the provider console has exact callback URLs.
- Invalid redirect URI: Check http vs https, port, and trailing slashes in provider settings.
- CORS errors: Set CLIENT_URL in server/.env to your actual frontend origin.
- Mongo connection: Verify MONGODB_URI and that MongoDB is running/accessible.
- ADK CLI not found: Activate your venv and confirm google-adk is installed. Try pip install google-adk if needed.
- Notifications: If 404s from /api/notifications, ensure routes are uncommented and VAPID keys are set.

## Learn more

- FEATURES.md – deep-dive into current and future features
- OAUTH_SETUP.md – exact provider setup steps and pitfalls
- AGENT_DOCS.md – how to run the ADK agent locally

## License

MIT
