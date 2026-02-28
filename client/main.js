/**
 * RuleBreak Arena - Client Main Entry
 * Initializes the game and connects to server
 */

import { io } from 'socket.io-client';
import { GameScene } from './scene.js';
import { UI } from './ui.js';
import { CAMERA } from '../shared/config.js';

class Game {
  constructor() {
    this.socket = null;
    this.scene = null;
    this.ui = null;
    this.playerId = null;
    this.gameState = null;
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false,
      space: false
    };
    this.lastInputTime = 0;
    this.inputInterval = 1000 / 30; // 30 inputs per second max
  }
  
  async init() {
    // Initialize UI
    this.ui = new UI();
    
    // Initialize 3D scene
    this.scene = new GameScene();
    await this.scene.init();
    
    // Connect to server
    this.connectToServer();
    
    // Setup input handlers
    this.setupInputHandlers();
    
    // Start game loop
    this.gameLoop();
  }
  
  connectToServer() {
    // Connect to server (use relative URL for production compatibility)
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3001' 
      : window.location.origin;
    
    this.socket = io(serverUrl);
    
    // Connection established
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.ui.setConnectionStatus(true);
    });
    
    // Receive initial game state
    this.socket.on('init', (data) => {
      console.log('Received init:', data);
      this.playerId = data.playerId;
      this.gameState = data.gameState;
      
      // Create player meshes
      Object.values(data.gameState.players).forEach(player => {
        this.scene.addPlayer(player.id, player.team, player.id === this.playerId);
      });
      
      // Update UI
      this.ui.updateState(data.gameState, this.playerId);
    });
    
    // New player joined
    this.socket.on('playerJoined', (data) => {
      console.log('Player joined:', data.player.id);
      this.scene.addPlayer(data.player.id, data.player.team, false);
    });
    
    // Player left
    this.socket.on('playerLeft', (data) => {
      console.log('Player left:', data.playerId);
      this.scene.removePlayer(data.playerId);
    });
    
    // Game state update
    this.socket.on('gameState', (state) => {
      this.gameState = state;
      this.updateFromState(state);
    });
    
    // Mode change
    this.socket.on('modeChange', (data) => {
      console.log('Mode change:', data.newMode);
      this.ui.showModeAnnouncement(data.newMode, data.message);
      this.scene.handleModeChange(data.newMode);
    });
    
    // Match end
    this.socket.on('matchEnd', (data) => {
      console.log('Match ended:', data);
      this.ui.showMatchEnd(data.scores, data.winner, this.playerId);
    });
    
    // Error handling
    this.socket.on('error', (data) => {
      console.error('Server error:', data.message);
      alert(data.message);
    });
    
    // Disconnection
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.ui.setConnectionStatus(false);
    });
  }
  
  updateFromState(state) {
    // Update player positions
    Object.values(state.players).forEach(player => {
      this.scene.updatePlayer(player.id, player.position, player.velocity);
      
      // Update local player's camera target
      if (player.id === this.playerId) {
        this.scene.setCameraTarget(player.position);
      }
    });
    
    // Update ball
    if (state.ball) {
      this.scene.updateBall(state.ball.position, state.ball.velocity);
    }
    
    // Update UI
    this.ui.updateState(state, this.playerId);
    
    // Update scene for mode-specific elements
    this.scene.updateModeState(state.modeState);
  }
  
  setupInputHandlers() {
    // Keyboard down
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      if (key === 'w') this.keys.w = true;
      if (key === 'a') this.keys.a = true;
      if (key === 's') this.keys.s = true;
      if (key === 'd') this.keys.d = true;
      if (key === 'shift') this.keys.shift = true;
      if (key === ' ') {
        this.keys.space = true;
        e.preventDefault();
      }
    });
    
    // Keyboard up
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      
      if (key === 'w') this.keys.w = false;
      if (key === 'a') this.keys.a = false;
      if (key === 's') this.keys.s = false;
      if (key === 'd') this.keys.d = false;
      if (key === 'shift') this.keys.shift = false;
      if (key === ' ') this.keys.space = false;
    });
  }
  
  sendInput() {
    if (!this.socket || !this.socket.connected) return;
    
    const now = Date.now();
    if (now - this.lastInputTime < this.inputInterval) return;
    this.lastInputTime = now;
    
    // Calculate movement direction
    const movement = { x: 0, z: 0 };
    if (this.keys.w) movement.z -= 1;
    if (this.keys.s) movement.z += 1;
    if (this.keys.a) movement.x -= 1;
    if (this.keys.d) movement.x += 1;
    
    // Send input to server
    const input = {
      movement: movement,
      dash: this.keys.shift,
      dashDirection: movement,
      push: this.keys.space
    };
    
    // Only send if there's actual input
    if (movement.x !== 0 || movement.z !== 0 || input.dash || input.push) {
      this.socket.emit('input', input);
    }
    
    // Reset one-shot inputs after sending to server
    // Dash and push are intentionally one-shot abilities - holding the key
    // should not trigger multiple actions. Server enforces cooldowns.
    this.keys.shift = false;
    this.keys.space = false;
  }
  
  gameLoop() {
    // Send input
    this.sendInput();
    
    // Update and render scene
    this.scene.update();
    this.scene.render();
    
    // Continue loop
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init();
});
