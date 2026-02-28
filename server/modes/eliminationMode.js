/**
 * RuleBreak Arena - Elimination Mode
 * Push enemies off the platform to score
 */

import { SCORING, PLAYER, ARENA } from '../../shared/config.js';

export class EliminationMode {
  constructor(physics) {
    this.physics = physics;
    this.name = 'ELIMINATION';
    this.description = 'Push enemies off the arena!';
    this.kills = {}; // Player ID -> kill count
    this.respawnTimers = {}; // Player ID -> respawn time remaining
    this.platformSize = 1.0; // Multiplier for arena size
    this.elapsedTime = 0;
  }
  
  init() {
    this.kills = {};
    this.respawnTimers = {};
    this.platformSize = 1.0;
    this.elapsedTime = 0;
    this.physics.removeTower();
    
    // Hide the ball in elimination mode
    this.physics.ballBody.position.set(0, -100, 0);
    this.physics.ballBody.velocity.set(0, 0, 0);
  }
  
  update(deltaTime, players) {
    this.elapsedTime += deltaTime;
    
    // Shrink platform over time (optional feature)
    // this.platformSize = Math.max(0.5, 1.0 - this.elapsedTime * 0.005);
    
    // Initialize kill counts for all players
    Object.keys(players).forEach(playerId => {
      if (!(playerId in this.kills)) {
        this.kills[playerId] = 0;
      }
    });
    
    // Update respawn timers
    Object.entries(this.respawnTimers).forEach(([playerId, timer]) => {
      if (timer > 0) {
        this.respawnTimers[playerId] -= deltaTime;
        
        if (this.respawnTimers[playerId] <= 0) {
          this.respawnPlayer(playerId);
          delete this.respawnTimers[playerId];
        }
      }
    });
    
    // Check for fallen players
    Object.values(players).forEach(player => {
      if (!player.isDead && this.physics.checkPlayerFallen(player.id)) {
        this.handlePlayerDeath(player.id, players);
      }
    });
    
    return null;
  }
  
  handlePlayerDeath(playerId, players) {
    const player = players[playerId];
    if (!player || player.isDead) return;
    
    player.isDead = true;
    this.respawnTimers[playerId] = PLAYER.RESPAWN_TIME;
    
    // Find who pushed this player last (simplified: credit nearest enemy)
    const killer = this.findLastPusher(playerId, players);
    if (killer && killer !== playerId) {
      this.kills[killer] = (this.kills[killer] || 0) + SCORING.ELIMINATION_POINTS_PER_KILL;
    }
    
    // Move player body far away
    this.physics.resetPlayerPosition(playerId, { x: 0, y: -50, z: 0 });
  }
  
  findLastPusher(victimId, players) {
    // Simplified: return any enemy player
    // In a full implementation, track push interactions
    const victim = players[victimId];
    if (!victim) return null;
    
    for (const [playerId, player] of Object.entries(players)) {
      if (playerId !== victimId && player.team !== victim.team) {
        return playerId;
      }
    }
    return null;
  }
  
  respawnPlayer(playerId) {
    // Respawn at random position on platform
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 5 + 3;
    
    this.physics.resetPlayerPosition(playerId, {
      x: Math.cos(angle) * radius,
      y: 3,
      z: Math.sin(angle) * radius
    });
  }
  
  onPlayerRespawn(playerId, player) {
    player.isDead = false;
  }
  
  getScores() {
    return this.kills;
  }
  
  getWinner() {
    let maxKills = 0;
    let winner = null;
    
    Object.entries(this.kills).forEach(([playerId, kills]) => {
      if (kills > maxKills) {
        maxKills = kills;
        winner = playerId;
      }
    });
    
    return winner;
  }
  
  getModeState() {
    return {
      mode: this.name,
      kills: this.kills,
      respawnTimers: this.respawnTimers,
      platformSize: this.platformSize
    };
  }
}
