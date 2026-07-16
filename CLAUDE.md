# Math Tutor Application

AI-powered math learning platform for 6th-grade students. Features dynamic quiz generation, homework scanning/grading via camera, progress tracking, and gamification — all backed by Google Gemini and Firebase Firestore.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Vite 6, Tailwind CSS 4
- **Backend**: Express.js 4 on Node.js 22
- **AI**: Google Gemini (`@google/genai`)
- **Database**: Firebase Firestore
- **Bundling**: Vite (frontend), esbuild (server)

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Dev server with hot reload (http://localhost:3000)
npm run build        # Build frontend (Vite) + server (esbuild → dist/server.cjs)
npm run start        # Run production build
npm run lint         # TypeScript type check (tsc --noEmit)
npm run clean        # Remove dist/
```

## Environment Variables

Copy `.env.example` to `.env` and set:

```
GEMINI_API_KEY=<required — Google Gemini API key>
APP_URL=<optional — auto-injected by AI Studio in production>
```

Firebase credentials are in `firebase-applet-config.json` (already committed).

## Architecture

```
src/                        # React frontend
  App.tsx                   # Root component: all state, routing, Firebase sync, gamification
  types.ts                  # Shared TypeScript interfaces
  data.ts                   # Curriculum constants (topics, badges, avatars)
  components/               # Feature views (Assessment, Scanner, Dashboard, Profile, History)
  lib/firebase.ts           # Firestore CRUD helpers
  utils/answerValidation.ts # AI answer extraction + auto-correction
server.ts                   # Express backend (API endpoints, Gemini integration)
```

**State flow**: React state → localStorage (offline cache) + Firestore (cloud sync)

**API endpoints** (all on port 3000):
- `GET  /api/health`
- `POST /api/generate-test` — Gemini quiz generation with `responseSchema`
- `POST /api/check-paper` — Gemini image grading with base64 image input

## Key Design Decisions

**Answer validation** (`src/utils/answerValidation.ts`): Gemini sometimes generates wrong answer keys. The validation layer extracts correct values from the AI's own explanation text and auto-corrects mismatches before delivery to students. ~30–40% of tests are corrected this way.

**Gamification**: 15 pts per correct answer + activity bonuses; mastery tracked 0–100% per topic; badges for achievements. All stored in `StudentProfile` in Firestore.

**HMR**: Disabled when `DISABLE_HMR=true` (AI Studio compatibility); file watching also disabled during agent edits.

## Docker

```bash
docker build -t math-tutor .
docker run -p 8080:3000 -e GEMINI_API_KEY=<key> math-tutor
```
