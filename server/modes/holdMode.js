/**
 * RuleBreak Arena - Hold Mode
 * Hold the ball as long as possible
 */

import { SCORING, PHYSICS } from '../../shared/config.js';

export class HoldMode {
  constructor(physics) {
    this.physics = physics;
    this.name = 'HOLD';
    this.description = 'Hold the ball to score!';
    this.holdingPlayer = null;
    this.holdTime = {}; // Player ID -> hold time in seconds
  }
  
  init() {
    this.holdingPlayer = null;
    this.holdTime = {};
    this.physics.resetBall();
    this.physics.removeTower();
  }
  
  update(deltaTime, players) {
    // Initialize hold times for all players
    Object.keys(players).forEach(playerId => {
      if (!(playerId in this.holdTime)) {
        this.holdTime[playerId] = 0;
      }
    });
    
    // Find closest player to ball
    const { playerId, distance } = this.physics.getClosestPlayerToBall();
    
    // Ball attachment threshold
    const attachDistance = PHYSICS.PLAYER_RADIUS + PHYSICS.BALL_RADIUS + 0.3;
    
    if (playerId && distance < attachDistance) {
      // This player is holding the ball
      if (this.holdingPlayer !== playerId) {
        this.holdingPlayer = playerId;
      }
      
      // Add hold time
      this.holdTime[playerId] += deltaTime * SCORING.HOLD_POINTS_PER_SECOND;
      
      // Move ball with player
      const playerPos = this.physics.getPlayerPosition(playerId);
      if (playerPos) {
        this.physics.ballBody.position.set(
          playerPos.x,
          playerPos.y + 0.5,
          playerPos.z
        );
        this.physics.ballBody.velocity.set(0, 0, 0);
      }
    } else {
      this.holdingPlayer = null;
    }
    
    return null;
  }
  
  onPlayerPushed(pusherId, targetId) {
    // If holding player is pushed, they drop the ball
    if (this.holdingPlayer === targetId) {
      this.holdingPlayer = null;
      
      // Give ball some velocity away from pusher
      const pusherPos = this.physics.getPlayerPosition(pusherId);
      const targetPos = this.physics.getPlayerPosition(targetId);
      
      if (pusherPos && targetPos) {
        const dx = targetPos.x - pusherPos.x;
        const dz = targetPos.z - pusherPos.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        
        this.physics.ballBody.velocity.set(
          (dx / len) * 10,
          5,
          (dz / len) * 10
        );
      }
      
      return true;
    }
    return false;
  }
  
  getScores() {
    // Convert hold times to scores
    const scores = {};
    Object.entries(this.holdTime).forEach(([playerId, time]) => {
      scores[playerId] = Math.floor(time);
    });
    return scores;
  }
  
  getWinner() {
    let maxTime = 0;
    let winner = null;
    
    Object.entries(this.holdTime).forEach(([playerId, time]) => {
      if (time > maxTime) {
        maxTime = time;
        winner = playerId;
      }
    });
    
    return winner;
  }
  
  getModeState() {
    return {
      mode: this.name,
      holdingPlayer: this.holdingPlayer,
      holdTimes: this.getScores()
    };
  }
}
