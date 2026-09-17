# Wordle Game - Backend-Driven Architecture

## Overview
The Wordle game has been refactored to use a **C++ backend server** for core game logic instead of relying on JavaScript.

## Architecture

### Backend (C++ HTTP Server)
**File:** `backend.c++`

The C++ backend runs as an HTTP server on `localhost:8080` and handles:

- **Game Logic**: Word matching, letter evaluation, game state
- **Word Lists**: Loading and validating words in English and Turkish
- **Session Management**: Storing game sessions with unique IDs
- **API Endpoints**:
  - `GET /api/init?lang=english|turkish` - Initialize a new game
  - `GET /api/words?lang=english|turkish` - Load word list for a language
  - `GET /api/guess?sid=SESSION_ID&guess=WORD` - Evaluate a guess
  - `GET /api/validate?lang=english|turkish&word=WORD` - Check if word is valid

### Frontend (JavaScript + HTML)
**Files:** `script.js`, `index.html`, `styles.css`

JavaScript now handles:
- **UI Rendering**: Board display, keyboard, animations
- **User Management**: Login/registration (localStorage)
- **API Communication**: Calls to backend for game logic
- **Input Handling**: Keyboard events

## How to Run

### 1. Build the C++ Backend
```bash
cd "c:\Users\admin\Desktop\private copy"
g++ -fdiagnostics-color=always -g backend.c++ -o backend.exe -lws2_32
```

Or use the build task in VS Code:
- Press `Ctrl+Shift+B` to build

### 2. Start the Backend Server
```bash
cd "c:\Users\admin\Desktop\private copy"
.\backend.exe
```

You should see:
```
Wordle backend server running on http://127.0.0.1:8080
```

### 3. Open the Game
- Open `index.html` in a browser, OR
- Serve files via HTTP (recommended for better CORS support)

### 4. Play
- Login with default credentials:
  - Username: `admin`
  - Password: `pass`
- Select language (English/Turkish)
- Play Wordle!

## Key Changes from Original

| Aspect | Before | After |
|--------|--------|-------|
| Game Logic | JavaScript | C++ Backend |
| Word Matching | Local JS function | HTTP API call |
| Word Lists | Loaded from files | Backend API |
| Game State | Client-side | Server-side sessions |
| Secret Word | Generated in JS | Generated in C++ |
| Dependency | Requires script.js | Can work without JS logic |

## Technical Details

### Backend Features
- **Multi-session support**: Each game gets a unique session ID
- **Language support**: English and Turkish word lists
- **Wordle logic**: Proper handling of duplicate letters
- **JSON API**: Simple HTTP-based communication

### Frontend Improvements
- **Reduced complexity**: Game logic removed from JavaScript
- **Better separation**: UI/UX separate from game rules
- **API-driven**: Can be replaced with different frontend

## Dependencies

### For Building
- **MinGW** (g++ compiler)
- Windows Winsock2 library (included in Windows)

### For Running
- No external dependencies needed
- Works on Windows with MinGW installed

## Notes

- The backend server must be running for the game to work
- Make sure port 8080 is not in use
- Word lists (`englishwordlist.txt`, `turkishwordlist.txt`) must be in the same directory as `backend.exe`
- Session data is stored in memory and lost when the server restarts

## Troubleshooting

**Backend won't start:**
- Check if port 8080 is already in use
- Verify backend.exe was built correctly
- Check MinGW installation

**API calls failing:**
- Ensure backend server is running
- Check browser console for network errors
- Verify files are being served from the correct location

**Word validation errors:**
- Check if word list files are in the correct directory
- Verify word lists contain 5-letter words only


"c:\Users\admin\Desktop\private copy"; g++ -fdiagnostics-color=always -g backend.c++ -o backend.exe -lws2_32; .\backend.exe
cd "c:\Users\admin\Desktop\private copy"; npx serve . -l 5500