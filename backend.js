#!/usr/bin/env node
'use strict';

// Dependency-free JavaScript replacement for the C++ Wordle HTTP server.
const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const HOST = '127.0.0.1';
const PORT = 8080;
const games = new Map();
const fallbackWords = {
    turkish: ['elmas', 'cadde', 'camci', 'edebi', 'fakat', 'istek'],
    english: ['apple', 'berry', 'champ', 'crane', 'slate', 'crazy', 'plant', 'brave', 'shine', 'ghost', 'pride', 'quick', 'roast', 'bloom', 'frame', 'grace', 'might', 'north', 'sweet', 'voice', 'zebra']
};
const languageFrom = language => language === 'turkish' ? 'turkish' : 'english';
const characters = value => Array.from(value);
const lowercase = (word, language) => word.toLocaleLowerCase(language === 'turkish' ? 'tr-TR' : 'en-US');

function loadWords(language) {
    const selected = languageFrom(language);
    const filename = selected === 'turkish' ? 'turkishwordlist.txt' : 'englishwordlist.txt';
    try {
        const words = fs.readFileSync(path.join(__dirname, filename), 'utf8')
            .split(/\r?\n/).map(word => word.trim()).filter(word => characters(word).length === 5);
        if (words.length) return words;
    } catch (error) {
        console.warn(`Could not load ${filename}; using fallback words.`, error.message);
    }
    return fallbackWords[selected];
}

function evaluateGuess(guess, secret, language) {
    const guessed = characters(lowercase(guess, language));
    const answer = characters(lowercase(secret, language));
    const result = Array(5).fill('absent');
    const remaining = new Map();
    for (let index = 0; index < 5; index += 1) {
        if (guessed[index] === answer[index]) result[index] = 'correct';
        else remaining.set(answer[index], (remaining.get(answer[index]) || 0) + 1);
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

function sendJson(response, status, body) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    response.end(JSON.stringify(body));
}

function getGame(sessionId, response) {
    const game = games.get(sessionId);
    if (!sessionId || !game) {
        sendJson(response, 200, { error: 'Invalid session' });
        return null;
    }
    return game;
}

function excludedPositions(value) {
    return new Set((value || '').split(',').map(item => Number.parseInt(item, 10))
        .filter(position => Number.isInteger(position) && position >= 0 && position < 5));
}

function handleRequest(request, response) {
    const url = new URL(request.url, `http://${HOST}:${PORT}`);
    const query = url.searchParams;
    if (url.pathname === '/api/init') {
        const language = languageFrom(query.get('lang'));
        const sessionId = `sess_${crypto.randomUUID()}`;
        const words = loadWords(language);
        games.set(sessionId, { secret: words[crypto.randomInt(words.length)], language, attempts: 0, hints: 0, revealed: new Set(), outcome: null });
        return sendJson(response, 200, { sessionId, message: 'Game initialized' });
    }
    if (url.pathname === '/api/words') return sendJson(response, 200, { words: loadWords(query.get('lang')) });
    if (url.pathname === '/api/giveup') {
        const game = getGame(query.get('sid'), response);
        if (!game) return;
        // End the round BEFORE disclosing the answer. Retrying a lost response
        // is safe: it returns the same terminal result without changing attempts.
        if (!game.outcome) game.outcome = 'giveup';
        return sendJson(response, 200, { gameOver: true, outcome: game.outcome, attempts: game.attempts, word: game.secret });
    }
    if (url.pathname === '/api/hint') {
        const game = getGame(query.get('sid'), response);
        if (!game) return;
        if (game.outcome) return sendJson(response, 409, { error: 'Round already finished' });
        if (game.hints >= 2) return sendJson(response, 200, { error: 'No hints remaining' });
        const excluded = excludedPositions(query.get('exclude'));
        const candidates = [0, 1, 2, 3, 4].filter(position => !game.revealed.has(position) && !excluded.has(position));
        if (!candidates.length) return sendJson(response, 200, { error: 'All letters are already revealed' });
        const position = candidates[crypto.randomInt(candidates.length)];
        game.revealed.add(position);
        game.hints += 1;
        return sendJson(response, 200, { position, letter: characters(game.secret)[position], remaining: 2 - game.hints });
    }
    if (url.pathname === '/api/guess') {
        const game = getGame(query.get('sid'), response);
        if (!game) return;
        if (game.outcome) return sendJson(response, 409, { error: 'Round already finished' });
        const guess = query.get('guess') || '';
        if (characters(guess).length !== 5) return sendJson(response, 200, { error: 'Guess must be 5 letters' });
        const result = evaluateGuess(guess, game.secret, game.language);
        game.attempts += 1;
        const won = result.every(state => state === 'correct');
        if (won) game.outcome = 'win';
        else if (game.attempts >= 6) game.outcome = 'loss';
        return sendJson(response, 200, { guess, result, won, attempts: game.attempts, gameOver: Boolean(game.outcome), ...(game.outcome === 'loss' ? { word: game.secret } : {}) });
    }
    if (url.pathname === '/api/validate') {
        const language = languageFrom(query.get('lang'));
        const guess = query.get('word') || '';
        return sendJson(response, 200, { valid: loadWords(language).some(word => lowercase(word, language) === lowercase(guess, language)) });
    }
    return sendJson(response, 200, { error: 'Endpoint not found' });
}

const server = http.createServer((request, response) => {
    if (request.method === 'OPTIONS') {
        response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
        return response.end();
    }
    const isGiveUp = new URL(request.url, `http://${HOST}:${PORT}`).pathname === '/api/giveup';
    if (request.method !== (isGiveUp ? 'POST' : 'GET')) return sendJson(response, 405, { error: 'Method not allowed' });
    if (request.url === '/' || request.url === '/index.html') {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
        return response.end('Backend API running at /api/*\n');
    }
    return handleRequest(request, response);
});
server.listen(PORT, HOST, () => console.log(`Wordle backend server running on http://${HOST}:${PORT}`));
