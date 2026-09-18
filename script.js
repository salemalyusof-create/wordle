// Wordle Game - Backend-driven version
const API_URL = 'http://127.0.0.1:8080';
let useBackend = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const supportedLanguages = new Set(['english', 'turkish']);

function getInitialLanguage() {
    try {
        const storedLanguage = localStorage.getItem('wordleLanguage');
        return supportedLanguages.has(storedLanguage) ? storedLanguage : 'english';
    } catch {
        return 'english';
    }
}

let selectedLanguage = getInitialLanguage();
let sessionId = null;
let words = [];
let secretWord = '';
let localAttempts = 0;

const translations = {
    english: {
        pageTitle: 'Wordle Game',
        dailyChallenge: 'DAILY WORD CHALLENGE',
        subtitle: 'Guess the word. Beat the challenge.',
        languageSelection: 'Language selection',
        englishLanguage: 'English',
        turkishLanguage: 'Turkish',
        gameStatusLabel: 'Game status',
        currentRun: 'CURRENT RUN',
        firstGuess: 'Make your first guess',
        keepGoing: 'Keep the momentum going',
        roundComplete: 'Round complete',
        attempts: 'ATTEMPTS',
        hint: 'HINT',
        hintsLeft: '{remaining} left',
        useHint: 'Use hint, {remaining} remaining',
        wordGuesses: 'Word guesses',
        submitInstruction: 'to submit',
        eraseInstruction: 'to erase',
        gameInformation: 'Game information',
        howToPlay: 'How to play',
        howToPlayDescription: 'Find the hidden five-letter word in six tries.',
        rightLetterRightSpot: 'Right letter, right spot',
        rightLetterWrongSpot: 'Right letter, wrong spot',
        notInWord: 'Not in the word',
        showHowToPlay: 'Show how to play',
        hideHowToPlay: 'Hide how to play',
        yourStats: 'Your stats',
        played: 'Played',
        won: 'Won',
        streak: 'Streak',
        keyboard: 'KEYBOARD',
        yourTurn: 'Your turn',
        onScreenKeyboard: 'On-screen keyboard',
        enterKey: 'Enter key',
        backspaceKey: 'Backspace key',
        muteSound: 'Mute sound effects',
        enableSound: 'Enable sound effects',
        mustBeFiveLetters: 'Must be 5 letters',
        wordNotInList: 'Word not in list',
        validationFailed: 'Validation failed',
        networkError: 'Network error',
        unableToLoadHint: 'Unable to load a hint',
        allLettersRevealed: 'All letters are already revealed',
        noHintsRemaining: 'No hints remaining',
        invalidSession: 'Invalid game session',
        unexpectedError: 'Something went wrong',
        hintRevealed: 'Hint revealed: {letter}',
        niceWork: 'NICE WORK',
        roundCompleteHeading: 'ROUND COMPLETE',
        cleverSolve: 'A clever solve.',
        wordGotAway: 'The word got away.',
        playAgain: 'Play Again',
        wonMessage: 'You won in {attempts} attempts!',
        lostMessage: 'Game over after {attempts} attempts.',
        changeLanguageConfirm: 'Changing language will reset your current progress. Continue?'
    },
    turkish: {
        pageTitle: 'Wordle Oyunu',
        dailyChallenge: 'GÜNLÜK KELİME MEYDAN OKUMASI',
        subtitle: 'Kelimeyi tahmin et. Mücadeleyi kazan.',
        languageSelection: 'Dil seçimi',
        englishLanguage: 'İngilizce',
        turkishLanguage: 'Türkçe',
        gameStatusLabel: 'Oyun durumu',
        currentRun: 'MEVCUT TUR',
        firstGuess: 'İlk tahminini yap',
        keepGoing: 'Devam et',
        roundComplete: 'Tur tamamlandı',
        attempts: 'DENEMELER',
        hint: 'İPUCU',
        hintsLeft: '{remaining} kaldı',
        useHint: 'İpucu kullan, {remaining} ipucu kaldı',
        wordGuesses: 'Kelime tahminleri',
        submitInstruction: 'ile gönder',
        eraseInstruction: 'ile sil',
        gameInformation: 'Oyun bilgileri',
        howToPlay: 'Nasıl Oynanır',
        howToPlayDescription: 'Gizli beş harfli kelimeyi altı denemede bul.',
        rightLetterRightSpot: 'Doğru harf, doğru yer',
        rightLetterWrongSpot: 'Doğru harf, yanlış yer',
        notInWord: 'Kelimede yok',
        showHowToPlay: 'Nasıl oynanır bölümünü göster',
        hideHowToPlay: 'Nasıl oynanır bölümünü gizle',
        yourStats: 'İstatistiklerin',
        played: 'Oynanan',
        won: 'Kazanılan',
        streak: 'Seri',
        keyboard: 'KLAVYE',
        yourTurn: 'Sıra sende',
        onScreenKeyboard: 'Ekran klavyesi',
        enterKey: 'Enter tuşu',
        backspaceKey: 'Backspace tuşu',
        muteSound: 'Ses efektlerini kapat',
        enableSound: 'Ses efektlerini aç',
        mustBeFiveLetters: '5 harf girmelisiniz',
        wordNotInList: 'Kelime listede yok',
        validationFailed: 'Doğrulama başarısız oldu',
        networkError: 'Ağ hatası',
        unableToLoadHint: 'İpucu yüklenemedi',
        allLettersRevealed: 'Tüm harfler zaten açıklandı',
        noHintsRemaining: 'İpucu hakkınız kalmadı',
        invalidSession: 'Oyun oturumu geçersiz',
        unexpectedError: 'Bir hata oluştu',
        hintRevealed: 'İpucu açıldı: {letter}',
        niceWork: 'HARİKA!',
        roundCompleteHeading: 'TUR TAMAMLANDI',
        cleverSolve: 'Güzel çözdün!',
        wordGotAway: 'Kelimeyi bulamadın.',
        playAgain: 'Tekrar Oyna',
        wonMessage: '{attempts} denemede kazandın!',
        lostMessage: 'Oyun {attempts} denemeden sonra sona erdi.',
        changeLanguageConfirm: 'Dili değiştirmek mevcut ilerlemenizi sıfırlayacak. Devam etmek istiyor musunuz?'
    }
};

function t(key, replacements = {}) {
    const template = translations[selectedLanguage]?.[key]
        ?? translations.english[key]
        ?? key;

    return Object.entries(replacements).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
        template
    );
}

const serverErrorTranslationKeys = {
    'Invalid session': 'invalidSession',
    'No hints remaining': 'noHintsRemaining',
    'All letters are already revealed': 'allLettersRevealed',
    'Guess must be 5 letters': 'mustBeFiveLetters'
};

function translateServerError(error) {
    return t(serverErrorTranslationKeys[error] || 'unexpectedError');
}

// ================= SOUND =================
// Shared, softly filtered tonal palette. Notes: frequency, end frequency,
// duration, relative gain, delay, waveform (optional).
const SOUND_VOLUME = 0.12;
const soundEffects = {
    key: [[680, 420, 0.045, 0.28, 0, 'triangle']],
    backspace: [[360, 190, 0.07, 0.32, 0, 'triangle']],
    submit: [[330, 440, 0.12, 0.3, 0], [660, 660, 0.1, 0.16, 0.055]],
    reveal: [[520, 580, 0.18, 0.22, 0], [780, 780, 0.22, 0.12, 0.09]],
    invalid: [[245, 185, 0.15, 0.32, 0, 'triangle'], [185, 145, 0.17, 0.24, 0.1]],
    hint: [[880, 880, 0.18, 0.21, 0], [1320, 1320, 0.27, 0.14, 0.075]],
    win: [[440, 440, 0.3, 0.27, 0], [550, 550, 0.3, 0.25, 0.1], [660, 660, 0.34, 0.22, 0.2], [880, 880, 0.42, 0.18, 0.3]],
    lose: [[392, 370, 0.25, 0.25, 0], [330, 294, 0.35, 0.23, 0.16]]
};

const soundManager = {
    enabled: (() => {
        try { return localStorage.getItem('wordleSoundEnabled') !== 'false'; }
        catch { return true; }
    })(),
    context: null,
    output: null,
    resuming: null,
    generation: 0,
    voices: new Set(),

    // Called only by trusted user gestures, never by initialization or timers.
    unlock(event) {
        if (!event.isTrusted || !this.enabled) return;
        try {
            if (!this.context) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                this.context = new AudioContextClass();
                this.output = this.context.createGain();
                this.output.gain.value = SOUND_VOLUME;
                this.output.connect(this.context.destination);
            }
            if (this.context.state !== 'running' && !this.resuming) {
                this.resuming = this.context.resume().catch(() => {}).finally(() => {
                    this.resuming = null;
                });
            }
        } catch {
            // Audio is optional; a denied/unavailable device must not interrupt play.
        }
    },

    play(type, generation = this.generation) {
        if (!this.enabled || !this.context || !this.output || !soundEffects[type]) return;
        const requestedAt = performance.now();
        const schedule = () => {
            if (!this.enabled || generation !== this.generation || this.context.state !== 'running'
                || performance.now() - requestedAt > 200) return;
            try {
                const start = this.context.currentTime + 0.005;
                for (const [frequency, endFrequency, duration, volume, delay, waveform = 'sine'] of soundEffects[type]) {
                    // Fresh voices allow rapid taps to overlap without restarting a clip.
                    const oscillator = this.context.createOscillator();
                    const envelope = this.context.createGain();
                    const filter = this.context.createBiquadFilter();
                    const at = start + delay;
                    oscillator.type = waveform;
                    oscillator.frequency.setValueAtTime(frequency, at);
                    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, at + duration);
                    filter.type = 'lowpass';
                    filter.frequency.value = 2400;
                    filter.Q.value = 0.5;
                    envelope.gain.setValueAtTime(0, at);
                    envelope.gain.linearRampToValueAtTime(volume, at + 0.006);
                    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
                    envelope.gain.linearRampToValueAtTime(0, at + duration + 0.01);
                    oscillator.connect(filter);
                    filter.connect(envelope);
                    envelope.connect(this.output);
                    oscillator.onended = () => {
                        oscillator.disconnect();
                        filter.disconnect();
                        envelope.disconnect();
                        this.voices.delete(oscillator);
                    };
                    this.voices.add(oscillator);
                    oscillator.start(at);
                    oscillator.stop(at + duration + 0.015);
                }
            } catch {
                this.stop();
            }
        };
        if (this.resuming) this.resuming.then(schedule).catch(() => {});
        else schedule();
    },

    stop() {
        this.generation += 1;
        for (const voice of this.voices) {
            try { voice.stop(); } catch { /* Already ended. */ }
        }
        this.voices.clear();
    },

    toggle(event) {
        this.enabled = !this.enabled;
        if (!this.enabled) this.stop();
        else this.unlock(event);
        try { localStorage.setItem('wordleSoundEnabled', String(this.enabled)); }
        catch { /* Keep the preference for this session if storage is unavailable. */ }
        updateSoundButtonUI();
    }
};

function updateSoundButtonUI() {
    const button = document.getElementById('soundToggle');
    if (!button) return;
    const label = t(soundManager.enabled ? 'muteSound' : 'enableSound');
    button.setAttribute('aria-label', label);
    button.title = label;
    button.dataset.muted = String(!soundManager.enabled);
}

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
let gameReady = null;
let keyboardListenerAttached = false;
let languageLocked = false;
let toastTimer = null;
let hintsUsed = 0;
const revealedHintPositions = new Set();
const revealedHintLetters = new Map();
const maxAttempts = 6;
const hintRowIndex = maxAttempts - 1;
const typedLettersByRow = new Map();
const keyboardLetterStatuses = new Map();
let inputLocked = false;
let gameVersion = 0;
let invalidClearTimer = null;
let hintRequestPending = false;
const keyboardStatusPriority = {
    absent: 1,
    present: 2,
    correct: 3
};

function evaluateGuess(guess, secret) {
    const guessed = Array.from(normalizeGuess(guess));
    const answer = Array.from(normalizeGuess(secret));
    const result = Array(5).fill('absent');
    const remaining = new Map();

    for (let index = 0; index < 5; index += 1) {
        if (guessed[index] === answer[index]) {
            result[index] = 'correct';
        } else {
            remaining.set(answer[index], (remaining.get(answer[index]) || 0) + 1);
        }
    }

    for (let index = 0; index < 5; index += 1) {
        if (result[index] === 'correct') continue;
        const count = remaining.get(guessed[index]) || 0;
        if (count) {
            result[index] = 'present';
            remaining.set(guessed[index], count - 1);
        }
    }

    return result;
}

// Handle language selection
function handleLanguageSelect(language) {
    if (!supportedLanguages.has(language) || language === selectedLanguage) {
        return;
    }

    const isActiveRound = guesses.length > 0 && !gameOver;
    if (isActiveRound) {
        const confirmed = window.confirm(t('changeLanguageConfirm'));
        if (!confirmed) {
            updateLanguageButtonUI();
            return;
        }
    }

    selectedLanguage = language;
    try {
        localStorage.setItem('wordleLanguage', language);
    } catch (error) {
        console.warn('Could not save the selected language:', error);
    }
    resetGame();
}

// Update language button UI
function updateLanguageButtonUI() {
    const englishBtn = document.getElementById('englishBtn');
    const turkishBtn = document.getElementById('turkishBtn');

    if (englishBtn) {
        const isEnglish = selectedLanguage === 'english';
        englishBtn.classList.toggle('active', isEnglish);
        englishBtn.setAttribute('aria-pressed', String(isEnglish));
        englishBtn.disabled = false;
    }

    if (turkishBtn) {
        const isTurkish = selectedLanguage === 'turkish';
        turkishBtn.classList.toggle('active', isTurkish);
        turkishBtn.setAttribute('aria-pressed', String(isTurkish));
        turkishBtn.disabled = false;
    }
}

function updateInterfaceLanguage() {
    document.documentElement.lang = selectedLanguage === 'turkish' ? 'tr' : 'en';

    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });

    const howToPlayToggle = document.getElementById('howToPlayToggle');
    if (howToPlayToggle) {
        const isExpanded = howToPlayToggle.getAttribute('aria-expanded') === 'true';
        howToPlayToggle.setAttribute('aria-label', t(isExpanded ? 'hideHowToPlay' : 'showHowToPlay'));
    }

    document.querySelectorAll('[data-key-action]').forEach(key => {
        key.setAttribute('aria-label', t(key.dataset.keyAction === 'enter' ? 'enterKey' : 'backspaceKey'));
    });

    updateLanguageButtonUI();
    updateGameMeta();
    updateHintUI();
    updateSoundButtonUI();
}

function updateGameMeta() {
    const count = document.getElementById('attemptCount');
    const status = document.getElementById('gameStatus');
    const dots = document.getElementById('attemptDots');

    if (count) count.textContent = `${guesses.length} / ${maxAttempts}`;
    if (status) status.textContent = gameOver ? t('roundComplete') : guesses.length ? t('keepGoing') : t('firstGuess');
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
    if (count) count.textContent = t('hintsLeft', { remaining });
    if (button) {
        button.disabled = remaining === 0 || gameOver || hintRequestPending;
        button.setAttribute('aria-label', t('useHint', { remaining }));
    }
}

function getRowTiles(rowIndex) {
    return Array.from(document.querySelectorAll(`.row:nth-child(${rowIndex + 1}) .tile`));
}

function displayLetter(letter) {
    return selectedLanguage === 'turkish'
        ? letter.toLocaleUpperCase('tr-TR')
        : letter.toUpperCase();
}

function getTypedLetters(rowIndex) {
    if (!typedLettersByRow.has(rowIndex)) {
        typedLettersByRow.set(rowIndex, new Map());
    }
    return typedLettersByRow.get(rowIndex);
}

function isHintPosition(rowIndex, position) {
    return rowIndex === hintRowIndex && revealedHintPositions.has(position);
}

function getNextEditablePosition(rowIndex, start = 0) {
    const typedLetters = getTypedLetters(rowIndex);
    for (let position = start; position < 5; position += 1) {
        if (!isHintPosition(rowIndex, position) && !typedLetters.has(position)) return position;
    }
    return 5;
}

function isRowComplete(rowIndex) {
    const typedLetters = getTypedLetters(rowIndex);
    return Array.from({ length: 5 }, (_, position) =>
        isHintPosition(rowIndex, position) || typedLetters.has(position)
    ).every(Boolean);
}

function buildGuess(rowIndex) {
    const typedLetters = getTypedLetters(rowIndex);
    return normalizeGuess(Array.from({ length: 5 }, (_, position) =>
        isHintPosition(rowIndex, position)
            ? revealedHintLetters.get(position)
            : typedLetters.get(position)
    ).join(''));
}

function renderPersistentHints(animatePosition = null) {
    const tiles = getRowTiles(hintRowIndex);
    const typedLetters = getTypedLetters(hintRowIndex);

    revealedHintPositions.forEach(position => {
        const tile = tiles[position];
        const letter = revealedHintLetters.get(position);
        if (!tile || !letter) return;

        // A newly revealed hint is authoritative on the final row.
        typedLetters.delete(position);
        tile.textContent = displayLetter(letter);
        tile.dataset.state = 'hint';
        tile.classList.remove('invalid');
        if (position === animatePosition) {
            tile.classList.remove('hint-reveal');
            void tile.offsetWidth;
            tile.classList.add('hint-reveal');
        }
    });
}

async function useHint() {
    if (gameOver || inputLocked || hintRequestPending || hintsUsed >= 2) return;

    const requestVersion = gameVersion;
    hintRequestPending = true;
    updateHintUI();

    try {
        if (gameReady) await gameReady;
        if (requestVersion !== gameVersion || !sessionId) return;

        const excludedPositions = new Set();
        document.querySelectorAll('.row').forEach((row, rowIndex) => {
            if (rowIndex === hintRowIndex) return;
            Array.from(row.querySelectorAll('.tile')).forEach((tile, position) => {
                if (tile.dataset.state === 'correct') excludedPositions.add(position);
            });
        });

        revealedHintPositions.forEach(position => excludedPositions.add(position));

        const excluded = Array.from(excludedPositions).sort((a, b) => a - b).join(',');
        let data;
        if (useBackend) {
            const response = await fetch(`${API_URL}/api/hint?sid=${encodeURIComponent(sessionId)}&exclude=${encodeURIComponent(excluded)}`);
            data = await response.json();
        } else {
            const excludedSet = new Set(excluded ? excluded.split(',').map(Number) : []);
            const candidates = [0, 1, 2, 3, 4].filter(position => !excludedSet.has(position) && !revealedHintPositions.has(position));
            if (!candidates.length) {
                data = { errorKey: 'allLettersRevealed' };
            } else {
                const position = candidates[Math.floor(Math.random() * candidates.length)];
                data = { position, letter: Array.from(secretWord)[position] };
            }
        }
        if (requestVersion !== gameVersion) return;
        if (data.error || data.errorKey) {
            showMessage(data.errorKey ? t(data.errorKey) : translateServerError(data.error));
            updateHintUI();
            return;
        }

        hintsUsed += 1;
        revealedHintPositions.add(data.position);
        revealedHintLetters.set(data.position, data.letter);
        renderPersistentHints(data.position);
        soundManager.play('hint');
        if (currentRow === hintRowIndex) currentCol = getNextEditablePosition(currentRow, 0);
        showMessage(t('hintRevealed', { letter: displayLetter(data.letter) }));
    } catch (error) {
        if (requestVersion !== gameVersion) return;
        console.error('Hint request failed:', error);
        showMessage(t('unableToLoadHint'));
    } finally {
        if (requestVersion === gameVersion) {
            hintRequestPending = false;
            updateHintUI();
        }
    }
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
        const wordSource = useBackend
            ? `${API_URL}/api/words?lang=${selectedLanguage}`
            : `${selectedLanguage}wordlist.txt`;
        const resp = await fetch(wordSource);
        if (!useBackend) {
            words = (await resp.text()).split(/\r?\n/).map(word => word.trim()).filter(word => Array.from(word).length === 5);
        } else {
            const data = await resp.json();
            words = data.words || [];
        }
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
        if (useBackend) {
            const resp = await fetch(`${API_URL}/api/init?lang=${selectedLanguage}`);
            const data = await resp.json();
            sessionId = data.sessionId;
        } else {
            sessionId = `local_${Date.now()}`;
        }
        await loadWords();
        if (!useBackend) secretWord = words[Math.floor(Math.random() * words.length)];
    } catch(e) {
        console.error('Failed to initialize game:', e);
        if (useBackend) {
            useBackend = false;
            await loadWords();
        }
        if (!useBackend) {
            if (!words.length) words = ["apple", "berry", "crane", "slate", "plant", "brave"];
            secretWord = words[Math.floor(Math.random() * words.length)];
            sessionId = `local_${Date.now()}`;
        }
    }
}

// ================= GAME (Backend API) =================

function normalizeGuess(value) {
    return selectedLanguage === 'turkish'
        ? value.toLocaleLowerCase('tr-TR')
        : value.toLowerCase();
}

async function submitGuess() {
    if (inputLocked || gameOver) return;
    const submittedRow = currentRow;
    const submittedVersion = gameVersion;
    if (!isRowComplete(submittedRow)) return showMessage(t('mustBeFiveLetters'));

    inputLocked = true;
    soundManager.play('submit');
    const soundGeneration = soundManager.generation;
    if (gameReady) await gameReady;
    if (submittedVersion !== gameVersion || submittedRow !== currentRow || gameOver) return;

    const guess = buildGuess(submittedRow);

    // Validate against the backend locally, or against the bundled list on hosted copies.
    try {
        if (useBackend) {
            const encodedGuess = encodeURIComponent(guess);
            const validResp = await fetch(`${API_URL}/api/validate?lang=${selectedLanguage}&word=${encodedGuess}`);
            const validData = await validResp.json();
            if (submittedVersion !== gameVersion) return;
            if (!validData.valid) return rejectInvalidWord(submittedRow, submittedVersion);
        } else if (!words.some(word => normalizeGuess(word) === guess)) {
            return rejectInvalidWord(submittedRow, submittedVersion);
        }
    } catch(e) {
        if (submittedVersion !== gameVersion) return;
        console.error('Validation error:', e);
        inputLocked = false;
        return showMessage(t('validationFailed'));
    }

    try {
        let data;
        if (useBackend) {
            const encodedGuess = encodeURIComponent(guess);
            const resp = await fetch(`${API_URL}/api/guess?sid=${sessionId}&guess=${encodedGuess}`);
            data = await resp.json();
        } else {
            localAttempts += 1;
            const result = evaluateGuess(guess, secretWord);
            data = { result, won: result.every(state => state === 'correct'), attempts: localAttempts };
        }
        if (submittedVersion !== gameVersion || submittedRow !== currentRow) return;

        if (data.error) {
            showMessage(translateServerError(data.error));
            inputLocked = false;
            return;
        }

        guesses.push(guess);
        languageLocked = true;
        const result = data.result;

        updateBoard(guess, result, submittedRow);
        updateKeyboard(guess, result);
        updateGameMeta();
        updateLanguageButtonUI();

        if (result.every(r => r === 'correct')) {
            gameOver = true;
            languageLocked = false;
            recordGame(true);
            updateGameMeta();
            setTimeout(() => {
                if (submittedVersion !== gameVersion) return;
                soundManager.play('win', soundGeneration);
                showPopup(data.attempts, true);
            }, 600);
            updateLanguageButtonUI();
            return;
        }

        if (data.attempts >= maxAttempts) {
            gameOver = true;
            languageLocked = false;
            recordGame(false);
            updateGameMeta();
            setTimeout(() => {
                if (submittedVersion !== gameVersion) return;
                soundManager.play('lose', soundGeneration);
                showPopup(data.attempts, false);
            }, 600);
            updateLanguageButtonUI();
        } else {
            currentRow++;
            currentCol = getNextEditablePosition(currentRow);
            renderPersistentHints();
            inputLocked = false;
        }
    } catch(e) {
        if (submittedVersion !== gameVersion) return;
        console.error('Guess submission error:', e);
        showMessage(t('networkError'));
        inputLocked = false;
    }
}

function rejectInvalidWord(rowIndex, version) {
    if (version !== gameVersion) return;

    const row = document.querySelector(`.row:nth-child(${rowIndex + 1})`);
    const typedLetters = getTypedLetters(rowIndex);
    const tiles = getRowTiles(rowIndex);

    showMessage(t('wordNotInList'));
    soundManager.play('invalid');
    if (row) {
        row.classList.remove('shake', 'invalid-word');
        void row.offsetWidth;
        row.classList.add('invalid-word');
    }
    typedLetters.forEach((_, position) => tiles[position]?.classList.add('invalid'));

    clearTimeout(invalidClearTimer);
    invalidClearTimer = setTimeout(() => {
        if (version !== gameVersion || currentRow !== rowIndex) return;

        typedLetters.clear();
        tiles.forEach((tile, position) => {
            tile.classList.remove('invalid', 'pop');
            if (isHintPosition(rowIndex, position)) return;
            tile.textContent = '';
            tile.dataset.state = 'empty';
        });
        row?.classList.remove('invalid-word');
        renderPersistentHints();
        currentCol = getNextEditablePosition(rowIndex);
        inputLocked = false;
        invalidClearTimer = null;
    }, 1850);
}

// ================= UI =================

function updateBoard(guess, result, rowIndex) {
    const tiles = document.querySelectorAll(`.row:nth-child(${rowIndex + 1}) .tile`);
    const version = gameVersion;
    const soundGeneration = soundManager.generation;

    tiles.forEach((tile, i) => {
        tile.textContent = selectedLanguage === 'turkish'
            ? guess[i].toLocaleUpperCase('tr-TR')
            : guess[i].toUpperCase();
        tile.dataset.state = result[i];
        tile.classList.remove('flip', 'correct', 'present', 'absent', 'hint-reveal', 'invalid', 'pop');

        setTimeout(() => {
            if (version !== gameVersion) return;
            tile.classList.add('flip', result[i]);
            if (i === 0) soundManager.play('reveal', soundGeneration);
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

function showPopup(attempts, won = false) {
    let popup = document.getElementById('popup');
    if (!popup) return;
    popup.innerHTML = `
        <div class="popup-content" role="dialog" aria-modal="true" aria-labelledby="popupTitle" aria-describedby="popupMessage">
            <p class="eyebrow">${t(won ? 'niceWork' : 'roundCompleteHeading')}</p>
            <h2 id="popupTitle">${t(won ? 'cleverSolve' : 'wordGotAway')}</h2>
            <p id="popupMessage">${t(won ? 'wonMessage' : 'lostMessage', { attempts })}</p>
            <button id="closePopup" type="button">${t('playAgain')}</button>
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
    gameVersion += 1;
    soundManager.stop();
    clearTimeout(invalidClearTimer);
    invalidClearTimer = null;
    guesses = [];
    gameOver = false;
    currentRow = 0;
    currentCol = 0;
    inputLocked = false;
    hintRequestPending = false;
    localAttempts = 0;
    languageLocked = false;
    hintsUsed = 0;
    revealedHintPositions.clear();
    revealedHintLetters.clear();
    typedLettersByRow.clear();
    keyboardLetterStatuses.clear();
    gameReady = initializeGame();
    updateKeyboardLayout();
    updateInterfaceLanguage();

    document.querySelectorAll('.tile').forEach(t => {
        t.textContent = '';
        t.className = 'tile';
        t.dataset.state = 'empty';
    });
    document.querySelectorAll('.row').forEach(row => row.classList.remove('invalid-word', 'shake'));

    renderStats();
}

// ================= INPUT =================

function handleKeyPress(key) {
    if (gameOver || inputLocked) return;

    const tiles = getRowTiles(currentRow);
    const typedLetters = getTypedLetters(currentRow);

    if (key === 'Enter') {
        if (isRowComplete(currentRow)) submitGuess();
    } else if (key === 'Backspace' || key === '⌫') {
        for (let position = Math.min(currentCol - 1, 4); position >= 0; position -= 1) {
            if (!typedLetters.has(position)) continue;
            typedLetters.delete(position);
            tiles[position].textContent = '';
            tiles[position].dataset.state = 'empty';
            tiles[position].classList.remove('pop');
            currentCol = position;
            soundManager.play('backspace');
            break;
        }
    } else if (/^[A-Za-zÇçĞğıİÖöŞşÜü]$/.test(key) && currentCol < 5) {
        const position = getNextEditablePosition(currentRow, currentCol);
        if (position >= 5) return;
        typedLetters.set(position, normalizeGuess(key));
        tiles[position].textContent = displayLetter(key);
        tiles[position].dataset.state = 'filled';
        tiles[position].classList.remove('pop');
        void tiles[position].offsetWidth;
        tiles[position].classList.add('pop');
        currentCol = getNextEditablePosition(currentRow, position + 1);
        soundManager.play('key');
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
            btn.type = 'button';

            if (letter === 'Enter' || letter === '⌫') {
                btn.classList.add('wide');
                btn.dataset.keyAction = letter === 'Enter' ? 'enter' : 'backspace';
                btn.setAttribute('aria-label', t(letter === 'Enter' ? 'enterKey' : 'backspaceKey'));
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
    gameReady = initializeGame();
    updateKeyboardLayout();
    updateInterfaceLanguage();
    renderStats();

    if (!keyboardListenerAttached) {
        document.addEventListener('pointerdown', event => soundManager.unlock(event), { capture: true, passive: true });
        document.addEventListener('keydown', e => {
            soundManager.unlock(e);
            // Let focused controls activate natively; avoid Enter also submitting a guess.
            if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
            const control = e.target.closest?.('button');
            if (control && !control.classList.contains('key') && (e.key === 'Enter' || e.key === ' ')) return;
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.key === 'Enter' || e.key === 'Backspace') e.preventDefault();
            handleKeyPress(e.key);
        });
        keyboardListenerAttached = true;
    }

}

// ================= START =================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('soundToggle')?.addEventListener('click', event => soundManager.toggle(event));
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

    const howToPlayToggle = document.getElementById('howToPlayToggle');
    const howToPlayCard = document.querySelector('.how-to-play-card');
    if (howToPlayToggle && howToPlayCard) {
        howToPlayToggle.addEventListener('click', () => {
            const expanded = howToPlayCard.classList.toggle('expanded');
            howToPlayToggle.setAttribute('aria-expanded', String(expanded));
            howToPlayToggle.setAttribute('aria-label', t(expanded ? 'hideHowToPlay' : 'showHowToPlay'));
        });
    }

    init();
});




