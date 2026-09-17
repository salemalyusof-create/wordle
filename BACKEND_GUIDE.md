# Wordle Game - JavaScript Backend

## Overview

The backend is a dependency-free Node.js HTTP server in `backend.js`. It preserves the API, in-memory sessions, English and Turkish word lists, duplicate-letter scoring, hint limits, and administrator secret-word endpoint.

## Run

```bash
cd "C:\Users\admin\Desktop\private copy"
npm start
```

The API listens on `http://127.0.0.1:8080`. Serve the frontend separately, for example:

```bash
npx serve . -l 5500
```

Node.js 18 or later is required. No extra backend packages or C++ compiler are needed.

## API

- `GET /api/init?lang=english|turkish` — starts a game and returns a session ID.
- `GET /api/words?lang=english|turkish` — returns the word list.
- `GET /api/validate?lang=english|turkish&word=WORD` — validates a guess.
- `GET /api/guess?sid=SESSION_ID&guess=WORD` — scores a guess and updates attempts.
- `GET /api/hint?sid=SESSION_ID&exclude=0,1` — reveals one of up to two letters.
- `GET /api/secret?sid=SESSION_ID&adminEmail=EMAIL` — returns the secret for the configured administrator.

Sessions are held in memory and reset when the backend restarts. Keep both word-list files alongside `backend.js`.
