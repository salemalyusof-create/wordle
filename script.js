// Wordle Game - Backend-driven version
const API_URL = 'http://127.0.0.1:8080';

let selectedLanguage = 'english';
let sessionId = null;
let words = [];

const keyboardLayouts = {
    english: [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
    ],
    turkish: [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'İ', 'O', 'P', 'Ç'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ş', 'I'],
        ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Ö', 'Ğ', 'Ü', '⌫']
    ]
};
let guesses = [];
let gameOver = false;
let currentRow = 0;
let currentCol = 0;
let appInitialized = false;
let keyboardListenerAttached = false;
let languageLocked = false;
let toastTimer = null;
let hintsUsed = 0;
const revealedHintPositions = new Set();
const revealedHintLetters = new Map();
const maxAttempts = 6;
const keyboardLetterStatuses = new Map();
const keyboardStatusPriority = {
    absent: 1,
    present: 2,
    correct: 3
};

// Handle language selection
function handleLanguageSelect(language) {
    if (language === selectedLanguage) {
        return;
    }

    const isActiveRound = guesses.length > 0 && !gameOver;
    if (isActiveRound) {
        const confirmed = window.confirm('Changing language will reset your current progress. Continue?');
        if (!confirmed) {
            updateLanguageButtonUI();
            return;
        }
    }

    selectedLanguage = language;
    localStorage.setItem('wordleLanguage', language);
    resetGame();
}

// Update language button UI
function updateLanguageButtonUI() {
    const englishBtn = document.getElementById('englishBtn');
    const turkishBtn = document.getElementById('turkishBtn');
    const isLocked = guesses.length > 0 && !gameOver;

    if (englishBtn) {
        englishBtn.classList.toggle('active', selectedLanguage === 'english');
        englishBtn.disabled = isLocked && selectedLanguage !== 'english';
    }

    if (turkishBtn) {
        turkishBtn.classList.toggle('active', selectedLanguage === 'turkish');
        turkishBtn.disabled = isLocked && selectedLanguage !== 'turkish';
    }
}

function updateGameMeta() {
    const count = document.getElementById('attemptCount');
    const status = document.getElementById('gameStatus');
    const dots = document.getElementById('attemptDots');

    if (count) count.textContent = `${guesses.length} / ${maxAttempts}`;
    if (status) status.textContent = gameOver ? 'Round complete' : guesses.length ? 'Keep the momentum going' : 'Make your first guess';
    if (dots) {
        dots.innerHTML = Array.from({ length: maxAttempts }, (_, index) =>
            `<i class="${index < guesses.length ? 'used' : ''}"></i>`
        ).join('');
    }
}

function updateHintUI() {
    const button = document.getElementById('hintButton');
    const count = document.getElementById('hintCount');
    const remaining = Math.max(0, 2 - hintsUsed);
    if (count) count.textContent = `${remaining} left`;
    if (button) {
        button.disabled = remaining === 0 || gameOver;
        button.setAttribute('aria-label', `Use hint, ${remaining} remaining`);
    }
}

async function useHint() {
    if (gameOver || hintsUsed >= 2 || !sessionId) return;

    const button = document.getElementById('hintButton');
    if (button) button.disabled = true;

    try {
        const excludedPositions = new Set();
        document.querySelectorAll('.row').forEach(row => {
            Array.from(row.querySelectorAll('.tile')).forEach((tile, position) => {
                if (tile.dataset.state === 'correct') excludedPositions.add(position);
            });
        });

        const currentTiles = document.querySelectorAll(`.row:nth-child(${currentRow + 1}) .tile`);
        Array.from(currentTiles).forEach((tile, position) => {
            if (tile.textContent) excludedPositions.add(position);
        });

        const excluded = Array.from(excludedPositions).sort((a, b) => a - b).join(',');
        const response = await fetch(`${API_URL}/api/hint?sid=${encodeURIComponent(sessionId)}&exclude=${encodeURIComponent(excluded)}`);
        const data = await response.json();
        if (data.error) {
            showMessage(data.error);
            updateHintUI();
            return;
        }

        hintsUsed += 1;
        revealedHintPositions.add(data.position);
        revealedHintLetters.set(data.position, data.letter);
        const rowTiles = document.querySelectorAll(`.row:nth-child(${currentRow + 1}) .tile`);
        const tile = rowTiles[data.position];
        if (tile) {
            tile.textContent = selectedLanguage === 'turkish'
                ? data.letter.toLocaleUpperCase('tr-TR')
                : data.letter.toUpperCase();
            tile.dataset.state = 'hint';
            tile.classList.remove('hint-reveal');
            void tile.offsetWidth;
            tile.classList.add('hint-reveal');
        }
        updateHintUI();
        showMessage(`Hint revealed: ${data.letter.toUpperCase()}`);
    } catch (error) {
        console.error('Hint request failed:', error);
        showMessage('Unable to load a hint');
        updateHintUI();
    }
}

function applyHintsToCurrentRow() {
    const tiles = document.querySelectorAll(`.row:nth-child(${currentRow + 1}) .tile`);
    revealedHintPositions.forEach(position => {
        const tile = tiles[position];
        if (!tile || tile.textContent) return;
        const letter = revealedHintLetters.get(position);
        tile.textContent = selectedLanguage === 'turkish'
            ? letter.toLocaleUpperCase('tr-TR')
            : letter.toUpperCase();
        tile.dataset.state = 'hint';
    });
}

function getStatsKey() {
    return 'wordleStats:guest';
}

function readStats() {
    try {
        return JSON.parse(localStorage.getItem(getStatsKey())) || { played: 0, wins: 0, streak: 0 };
    } catch {
        return { played: 0, wins: 0, streak: 0 };
    }
}

function renderStats() {
    const stats = readStats();
    const values = {
        gamesPlayed: stats.played,
        gamesWon: stats.wins,
        currentStreak: stats.streak
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

function recordGame(won) {
    const stats = readStats();
    stats.played += 1;
    stats.wins += won ? 1 : 0;
    stats.streak = won ? stats.streak + 1 : 0;
    localStorage.setItem(getStatsKey(), JSON.stringify(stats));
    renderStats();
}

// ================= WORD LOGIC (Backend API) =================

async function loadWords() {
    try {
        const resp = await fetch(`${API_URL}/api/words?lang=${selectedLanguage}`);
        const data = await resp.json();
        words = data.words || [];
        if (words.length === 0) {
            words = ["APPLE", "BERRY", "CRANE", "SLATE", "PLANT", "BRAVE"];
        }
    } catch(e) {
        console.error('Failed to load words:', e);
        words = ["APPLE", "BERRY", "CRANE", "SLATE", "PLANT", "BRAVE"];
    }
}

async function initializeGame() {
    try {
        const resp = await fetch(`${API_URL}/api/init?lang=${selectedLanguage}`);
        const data = await resp.json();
        sessionId = data.sessionId;
        await loadWords();
    } catch(e) {
        console.error('Failed to initialize game:', e);
    }
}

// ================= GAME (Backend API) =================

function normalizeGuess(value) {
    return selectedLanguage === 'turkish'
        ? value.toLocaleLowerCase('tr-TR')
        : value.toLowerCase();
}

async function submitGuess() {
    const tiles = document.querySelectorAll(`.row:nth-child(${currentRow + 1}) .tile`);
    const guess = normalizeGuess(Array.from(tiles).map(t => t.textContent).join(''));

    if (guess.length !== 5) return showMessage('Must be 5 letters');
    
    // Validate word against backend
    try {
        const encodedGuess = encodeURIComponent(guess);
        const validResp = await fetch(`${API_URL}/api/validate?lang=${selectedLanguage}&word=${encodedGuess}`);
        const validData = await validResp.json();
        if (!validData.valid) return showMessage('Word not in list');
    } catch(e) {
        console.error('Validation error:', e);
        return showMessage('Validation failed');
    }

    // Submit guess to backend
    try {
        const encodedGuess = encodeURIComponent(guess);
        const resp = await fetch(`${API_URL}/api/guess?sid=${sessionId}&guess=${encodedGuess}`);
        const data = await resp.json();

        if (data.error) {
            showMessage(data.error);
            return;
        }

        guesses.push(guess);
        languageLocked = true;
        const result = data.result;

        updateBoard(guess, result, currentRow);
        updateKeyboard(guess, result);
        updateGameMeta();
        updateLanguageButtonUI();

        if (result.every(r => r === 'correct')) {
            gameOver = true;
            languageLocked = false;
            recordGame(true);
            updateGameMeta();
            setTimeout(() => showPopup(`You won in ${data.attempts} attempts!`, true), 600);
            updateLanguageButtonUI();
            return;
        }

        if (data.attempts >= maxAttempts) {
            gameOver = true;
            languageLocked = false;
            recordGame(false);
            updateGameMeta();
            setTimeout(() => showPopup(`Game over after ${data.attempts} attempts.`, false), 600);
            updateLanguageButtonUI();
        } else {
            currentRow++;
            currentCol = 0;
            revealedHintPositions.clear();
            revealedHintLetters.clear();
        }
    } catch(e) {
        console.error('Guess submission error:', e);
        showMessage('Network error');
    }
}

// ================= UI =================

function updateBoard(guess, result, rowIndex) {
    const tiles = document.querySelectorAll(`.row:nth-child(${rowIndex + 1}) .tile`);

    tiles.forEach((tile, i) => {
        tile.textContent = selectedLanguage === 'turkish'
            ? guess[i].toLocaleUpperCase('tr-TR')
            : guess[i].toUpperCase();
        tile.dataset.state = result[i];
        tile.classList.remove('flip', 'correct', 'present', 'absent');

        setTimeout(() => {
            tile.classList.add('flip', result[i]);
        }, i * 100);
    });
}

function getKeyboardLetterKey(value) {
    return normalizeGuess(value);
}

function updateKeyboard(guess, result) {
    Array.from(guess).forEach((letter, index) => {
        const nextStatus = result[index];
        if (!keyboardStatusPriority[nextStatus]) return;

        const letterKey = getKeyboardLetterKey(letter);
        const currentStatus = keyboardLetterStatuses.get(letterKey);
        if (!currentStatus || keyboardStatusPriority[nextStatus] > keyboardStatusPriority[currentStatus]) {
            keyboardLetterStatuses.set(letterKey, nextStatus);
        }
    });

    document.querySelectorAll('.key').forEach(key => {
        const letter = key.textContent.trim();
        const status = keyboardLetterStatuses.get(getKeyboardLetterKey(letter));
        key.classList.remove('absent', 'present', 'correct');
        if (status) key.classList.add(status);
    });
}

function showMessage(msg) {
    const row = document.querySelector(`.row:nth-child(${currentRow + 1})`);
    if (row) {
        row.classList.remove('shake');
        void row.offsetWidth;
        row.classList.add('shake');
    }

    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 2200);
}

function showPopup(message, won = false) {
    let popup = document.getElementById('popup');
    if (!popup) return;
    popup.innerHTML = `
        <div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="popupTitle">
            <p class="eyebrow">${won ? 'NICE WORK' : 'ROUND COMPLETE'}</p>
            <h2 id="popupTitle">${won ? 'A clever solve.' : 'The word got away.'}</h2>
            <p id="popupMessage">${message}</p>
            <button id="closePopup" type="button">Play Again</button>
        </div>
    `;
    popup.classList.toggle('won', won);
    popup.setAttribute('aria-hidden', 'false');
    popup.querySelector('#closePopup').onclick = () => {
        popup.setAttribute('aria-hidden', 'true');
        resetGame();
    };
}

function resetGame() {
    guesses = [];
    gameOver = false;
    currentRow = 0;
    currentCol = 0;
    languageLocked = false;
    hintsUsed = 0;
    revealedHintPositions.clear();
    revealedHintLetters.clear();
    keyboardLetterStatuses.clear();
    initializeGame();
    updateKeyboardLayout();
    updateGameMeta();

    document.querySelectorAll('.tile').forEach(t => {
        t.textContent = '';
        t.className = 'tile';
        t.dataset.state = 'empty';
    });

    updateLanguageButtonUI();
    updateHintUI();
    renderStats();
}

// ================= INPUT =================

function handleKeyPress(key) {
    if (gameOver) return;

    const tiles = document.querySelectorAll(`.row:nth-child(${currentRow + 1}) .tile`);

    if (key === 'Enter') {
        if (currentCol === 5) submitGuess();
    } else if (key === 'Backspace' || key === '⌫') {
        while (currentCol > 0 && revealedHintPositions.has(currentCol - 1)) currentCol--;
        if (currentCol > 0) {
            currentCol--;
            tiles[currentCol].textContent = '';
        }
    } else if (/^[A-Za-zÇçĞğıİÖöŞşÜü]$/.test(key) && currentCol < 5) {
        while (currentCol < 5 && revealedHintPositions.has(currentCol)) currentCol++;
        if (currentCol >= 5) return;
        const displayKey = selectedLanguage === 'turkish'
            ? key.toLocaleUpperCase('tr-TR')
            : key.toUpperCase();
        tiles[currentCol].textContent = displayKey;
        tiles[currentCol].dataset.state = 'filled';
        tiles[currentCol].classList.remove('pop');
        void tiles[currentCol].offsetWidth;
        tiles[currentCol].classList.add('pop');
        currentCol++;
    }
}

function updateKeyboardLayout() {
    const layout = keyboardLayouts[selectedLanguage] || keyboardLayouts.english;
    const keyboardSection = document.querySelector('.keyboard');
    
    if (!keyboardSection) return;
    
    keyboardSection.innerHTML = '';
    
    layout.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';
        
        row.forEach(letter => {
            const btn = document.createElement('button');
            btn.className = 'key';
            btn.textContent = letter;
            
            if (letter === 'Enter' || letter === '⌫') {
                btn.classList.add('wide');
            }
            
            btn.onclick = () => handleKeyPress(letter);
            rowDiv.appendChild(btn);
        });
        
        keyboardSection.appendChild(rowDiv);
    });
}

// ================= INIT =================

function init() {
    if (appInitialized) {
        return;
    }

    appInitialized = true;
    initializeGame();
    updateKeyboardLayout();
    updateGameMeta();
    updateHintUI();
    renderStats();

    if (!keyboardListenerAttached) {
        document.addEventListener('keydown', e => {
            handleKeyPress(e.key);
        });
        keyboardListenerAttached = true;
    }

}

// ================= START =================

document.addEventListener('DOMContentLoaded', () => {
    updateLanguageButtonUI();

    const hintButton = document.getElementById('hintButton');
    if (hintButton) {
        hintButton.addEventListener('click', useHint);
    }

    const englishBtn = document.getElementById('englishBtn');
    if (englishBtn) {
        englishBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLanguageSelect('english');
        });
    }

    const turkishBtn = document.getElementById('turkishBtn');
    if (turkishBtn) {
        turkishBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLanguageSelect('turkish');
        });
    }

    init();
});




