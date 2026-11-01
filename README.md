<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# TECH CAMPUS Hostel Maintenance System

This project runs React/Vite through its Express backend. The backend mounts the API at `/api` and serves the frontend on the same origin, so a separate Vite API proxy is not required.

## Run locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` to a valid Google Gemini API key. Keep the `.env` file private; keys are read by the backend and must not be added to frontend code.
3. Run the Express server and Vite frontend together:
   `npm run dev`

The app and API are available on port `3000` by default (or the configured `PORT`). Without `GEMINI_API_KEY`, AI classification and repair verification return an explicit configuration error rather than simulated results.
