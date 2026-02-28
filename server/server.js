/**
 * RuleBreak Arena - Main Server
 * Handles multiplayer connections and game state
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameManager } from './gameManager.js';
import { SERVER_PORT, MAX_PLAYERS, TICK_RATE } from '../shared/config.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Game manager instance
const gameManager = new GameManager();

// Handle new player connections
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Check if game is full
  if (gameManager.getPlayerCount() >= MAX_PLAYERS) {
    socket.emit('error', { message: 'Game is full' });
    socket.disconnect();
    return;
  }
  
  // Add player to game
  const player = gameManager.addPlayer(socket.id);
  
  // Send initial game state to new player
  socket.emit('init', {
    playerId: socket.id,
    gameState: gameManager.getState(),
    player: player
  });
  
  // Broadcast new player to others
  socket.broadcast.emit('playerJoined', { player });
  
  // Handle player input
  socket.on('input', (input) => {
    gameManager.handleInput(socket.id, input);
  });
  
  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    gameManager.removePlayer(socket.id);
    io.emit('playerLeft', { playerId: socket.id });
  });
});

// Game loop - runs at TICK_RATE fps
let lastTime = Date.now();
setInterval(() => {
  const now = Date.now();
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;
  
  // Update game state
  gameManager.update(deltaTime);
  
  // Send state to all clients
  const state = gameManager.getState();
  io.emit('gameState', state);
  
  // Handle mode change announcements
  if (gameManager.shouldAnnounceModeChange()) {
    io.emit('modeChange', {
      newMode: gameManager.getCurrentMode(),
      message: gameManager.getModeMessage()
    });
    gameManager.clearModeChangeFlag();
  }
  
  // Handle match end
  if (gameManager.isMatchOver()) {
    io.emit('matchEnd', {
      scores: gameManager.getFinalScores(),
      winner: gameManager.getWinner()
    });
    gameManager.resetMatch();
  }
  
}, 1000 / TICK_RATE);

// Start server
httpServer.listen(SERVER_PORT, () => {
  console.log(`RuleBreak Arena server running on port ${SERVER_PORT}`);
});

export { io, gameManager };
