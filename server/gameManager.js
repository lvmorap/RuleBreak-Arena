/**
 * RuleBreak Arena - Game Manager
 * Central game state management and mode rotation
 */

import { PhysicsWorld } from './physics.js';
import { GoalMode } from './modes/goalMode.js';
import { HoldMode } from './modes/holdMode.js';
import { EliminationMode } from './modes/eliminationMode.js';
import { TowerMode } from './modes/towerMode.js';
import {
  GAME_MODES,
  MODE_DURATION,
  MODE_TRANSITION_TIME,
  MATCH_DURATION,
  PLAYER
} from '../shared/config.js';

export class GameManager {
  constructor() {
    // Initialize physics
    this.physics = new PhysicsWorld();
    
    // Initialize modes
    this.modes = {
      GOAL: new GoalMode(this.physics),
      HOLD: new HoldMode(this.physics),
      ELIMINATION: new EliminationMode(this.physics),
      TOWER: new TowerMode(this.physics)
    };
    
    // Game state
    this.players = {};
    this.currentModeIndex = 0;
    this.currentMode = GAME_MODES[0];
    this.modeTimer = MODE_DURATION;
    this.matchTimer = MATCH_DURATION;
    this.isTransitioning = false;
    this.transitionTimer = 0;
    this.modeChangeAnnounced = false;
    this.matchOver = false;
    
    // Match scores (persist across modes)
    this.matchScores = {};
    
    // Initialize first mode
    this.initCurrentMode();
  }
  
  // ==================== Player Management ====================
  
  addPlayer(playerId) {
    // Determine team (balance teams)
    const teamACounts = Object.values(this.players).filter(p => p.team === 'teamA').length;
    const teamBCounts = Object.values(this.players).filter(p => p.team === 'teamB').length;
    const team = teamACounts <= teamBCounts ? 'teamA' : 'teamB';
    
    // Create player
    const player = {
      id: playerId,
      team: team,
      score: 0,
      health: PLAYER.STARTING_HEALTH,
      holdingBall: false,
      isDead: false,
      lastDashTime: 0,
      lastPushTime: 0
    };
    
    this.players[playerId] = player;
    this.matchScores[playerId] = 0;
    
    // Add physics body
    this.physics.addPlayer(playerId);
    
    // Get position
    const pos = this.physics.getPlayerPosition(playerId);
    player.position = pos;
    
    return player;
  }
  
  removePlayer(playerId) {
    delete this.players[playerId];
    delete this.matchScores[playerId];
    this.physics.removePlayer(playerId);
  }
  
  getPlayerCount() {
    return Object.keys(this.players).length;
  }
  
  // ==================== Input Handling ====================
  
  handleInput(playerId, input) {
    const player = this.players[playerId];
    if (!player || player.isDead || this.isTransitioning) return;
    
    const now = Date.now();
    
    // Movement (WASD)
    if (input.movement) {
      const direction = {
        x: input.movement.x || 0,
        z: input.movement.z || 0
      };
      
      // Normalize
      const len = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
      if (len > 0) {
        direction.x /= len;
        direction.z /= len;
        this.physics.applyMovement(playerId, direction);
      }
    }
    
    // Dash (Shift)
    if (input.dash) {
      const cooldown = PLAYER.DASH_COOLDOWN * 1000;
      if (now - player.lastDashTime >= cooldown) {
        const direction = input.dashDirection || { x: 0, z: 1 };
        this.physics.applyDash(playerId, direction);
        player.lastDashTime = now;
      }
    }
    
    // Push (Space)
    if (input.push) {
      const cooldown = PLAYER.PUSH_COOLDOWN * 1000;
      if (now - player.lastPushTime >= cooldown) {
        // Find nearest enemy to push
        const target = this.findNearestEnemy(playerId);
        if (target) {
          const pushed = this.physics.applyPush(playerId, target.id);
          if (pushed) {
            player.lastPushTime = now;
            
            // Notify Hold mode about the push
            if (this.currentMode === 'HOLD') {
              this.modes.HOLD.onPlayerPushed(playerId, target.id);
            }
          }
        }
      }
    }
  }
  
  findNearestEnemy(playerId) {
    const player = this.players[playerId];
    if (!player) return null;
    
    const playerPos = this.physics.getPlayerPosition(playerId);
    if (!playerPos) return null;
    
    let nearest = null;
    let nearestDist = Infinity;
    
    Object.values(this.players).forEach(other => {
      if (other.id !== playerId && other.team !== player.team && !other.isDead) {
        const otherPos = this.physics.getPlayerPosition(other.id);
        if (otherPos) {
          const dist = Math.sqrt(
            Math.pow(playerPos.x - otherPos.x, 2) +
            Math.pow(playerPos.z - otherPos.z, 2)
          );
          if (dist < nearestDist) {
            nearestDist = dist;
            nearest = other;
          }
        }
      }
    });
    
    return nearest;
  }
  
  // ==================== Game Loop ====================
  
  update(deltaTime) {
    // Don't update if no players
    if (this.getPlayerCount() === 0) return;
    
    // Handle mode transition
    if (this.isTransitioning) {
      this.transitionTimer -= deltaTime;
      if (this.transitionTimer <= 0) {
        this.isTransitioning = false;
        this.initCurrentMode();
      }
      return;
    }
    
    // Update physics
    this.physics.update(deltaTime);
    
    // Update player positions from physics
    Object.values(this.players).forEach(player => {
      const pos = this.physics.getPlayerPosition(player.id);
      if (pos) {
        player.position = pos;
      }
    });
    
    // Update current mode
    const modeInstance = this.modes[this.currentMode];
    if (modeInstance) {
      const result = modeInstance.update(deltaTime, this.players);
      
      // Handle mode-specific events
      if (result) {
        this.handleModeEvent(result);
      }
    }
    
    // Update timers
    this.modeTimer -= deltaTime;
    this.matchTimer -= deltaTime;
    
    // Check for mode change
    if (this.modeTimer <= 0) {
      this.switchToNextMode();
    }
    
    // Check for match end
    if (this.matchTimer <= 0) {
      this.endMatch();
    }
  }
  
  handleModeEvent(event) {
    // Handle events from modes (goals, eliminations, etc.)
    if (event.event === 'goal') {
      // Update match scores for the scoring team
      Object.values(this.players).forEach(player => {
        if (player.team === event.team) {
          this.matchScores[player.id] = (this.matchScores[player.id] || 0) + 1;
        }
      });
    }
  }
  
  // ==================== Mode Management ====================
  
  initCurrentMode() {
    const modeInstance = this.modes[this.currentMode];
    if (modeInstance) {
      modeInstance.init();
    }
    
    // Reset player states for new mode
    Object.values(this.players).forEach(player => {
      player.isDead = false;
      player.holdingBall = false;
    });
  }
  
  switchToNextMode() {
    // Cleanup current mode
    const currentModeInstance = this.modes[this.currentMode];
    if (currentModeInstance && currentModeInstance.cleanup) {
      currentModeInstance.cleanup();
    }
    
    // Update match scores from mode scores
    this.updateMatchScores();
    
    // Move to next mode
    this.currentModeIndex = (this.currentModeIndex + 1) % GAME_MODES.length;
    this.currentMode = GAME_MODES[this.currentModeIndex];
    this.modeTimer = MODE_DURATION;
    
    // Start transition
    this.isTransitioning = true;
    this.transitionTimer = MODE_TRANSITION_TIME;
    this.modeChangeAnnounced = true;
  }
  
  updateMatchScores() {
    const modeInstance = this.modes[this.currentMode];
    if (!modeInstance) return;
    
    const modeScores = modeInstance.getScores();
    
    if (this.currentMode === 'GOAL') {
      // For goal mode, add to team members' scores
      Object.values(this.players).forEach(player => {
        const teamScore = modeScores[player.team] || 0;
        this.matchScores[player.id] = (this.matchScores[player.id] || 0) + teamScore;
      });
    } else {
      // For individual modes, add individual scores
      Object.entries(modeScores).forEach(([playerId, score]) => {
        this.matchScores[playerId] = (this.matchScores[playerId] || 0) + score;
      });
    }
  }
  
  shouldAnnounceModeChange() {
    return this.modeChangeAnnounced;
  }
  
  clearModeChangeFlag() {
    this.modeChangeAnnounced = false;
  }
  
  getCurrentMode() {
    return this.currentMode;
  }
  
  getModeMessage() {
    const modeInstance = this.modes[this.currentMode];
    return modeInstance ? modeInstance.description : '';
  }
  
  // ==================== Match Management ====================
  
  endMatch() {
    this.matchOver = true;
    this.updateMatchScores();
  }
  
  isMatchOver() {
    return this.matchOver;
  }
  
  getFinalScores() {
    return this.matchScores;
  }
  
  getWinner() {
    let maxScore = -1;
    let winner = null;
    
    Object.entries(this.matchScores).forEach(([playerId, score]) => {
      if (score > maxScore) {
        maxScore = score;
        winner = playerId;
      }
    });
    
    return winner;
  }
  
  resetMatch() {
    // Reset all state
    this.currentModeIndex = 0;
    this.currentMode = GAME_MODES[0];
    this.modeTimer = MODE_DURATION;
    this.matchTimer = MATCH_DURATION;
    this.isTransitioning = false;
    this.transitionTimer = 0;
    this.modeChangeAnnounced = false;
    this.matchOver = false;
    
    // Reset scores
    Object.keys(this.matchScores).forEach(playerId => {
      this.matchScores[playerId] = 0;
    });
    
    // Reinitialize mode
    this.initCurrentMode();
  }
  
  // ==================== State Serialization ====================
  
  getState() {
    const modeInstance = this.modes[this.currentMode];
    
    return {
      currentMode: this.currentMode,
      modeTimer: Math.max(0, Math.floor(this.modeTimer)),
      matchTimer: Math.max(0, Math.floor(this.matchTimer)),
      isTransitioning: this.isTransitioning,
      transitionTimer: Math.max(0, Math.floor(this.transitionTimer)),
      players: this.serializePlayers(),
      ball: this.serializeBall(),
      modeState: modeInstance ? modeInstance.getModeState() : null,
      matchScores: this.matchScores
    };
  }
  
  serializePlayers() {
    const serialized = {};
    
    Object.values(this.players).forEach(player => {
      const pos = this.physics.getPlayerPosition(player.id);
      const body = this.physics.playerBodies.get(player.id);
      
      serialized[player.id] = {
        id: player.id,
        team: player.team,
        position: pos || { x: 0, y: 0, z: 0 },
        velocity: body ? {
          x: body.velocity.x,
          y: body.velocity.y,
          z: body.velocity.z
        } : { x: 0, y: 0, z: 0 },
        isDead: player.isDead,
        holdingBall: player.holdingBall
      };
    });
    
    return serialized;
  }
  
  serializeBall() {
    return {
      position: this.physics.getBallPosition(),
      velocity: this.physics.getBallVelocity()
    };
  }
}
