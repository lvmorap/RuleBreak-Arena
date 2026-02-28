/**
 * RuleBreak Arena - Tower Mode
 * King of the Hill - stay on top of the tower to score
 */

import { SCORING, ARENA } from '../../shared/config.js';

export class TowerMode {
  constructor(physics) {
    this.physics = physics;
    this.name = 'TOWER';
    this.description = 'Be the King of the Tower!';
    this.scores = {}; // Player ID -> time on tower
    this.currentKing = null;
  }
  
  init() {
    this.scores = {};
    this.currentKing = null;
    
    // Create the tower
    this.physics.createTower();
    
    // Hide the ball
    this.physics.ballBody.position.set(0, -100, 0);
    this.physics.ballBody.velocity.set(0, 0, 0);
  }
  
  update(deltaTime, players) {
    // Initialize scores for all players
    Object.keys(players).forEach(playerId => {
      if (!(playerId in this.scores)) {
        this.scores[playerId] = 0;
      }
    });
    
    // Check who is on top of the tower
    let playersOnTower = [];
    
    Object.keys(players).forEach(playerId => {
      if (this.physics.isPlayerOnTower(playerId)) {
        playersOnTower.push(playerId);
      }
    });
    
    // Only the player at the highest position on tower scores
    if (playersOnTower.length > 0) {
      // Find highest player
      let highestPlayer = null;
      let highestY = -Infinity;
      
      playersOnTower.forEach(playerId => {
        const pos = this.physics.getPlayerPosition(playerId);
        if (pos && pos.y > highestY) {
          highestY = pos.y;
          highestPlayer = playerId;
        }
      });
      
      if (highestPlayer) {
        this.currentKing = highestPlayer;
        this.scores[highestPlayer] += deltaTime * SCORING.TOWER_POINTS_PER_SECOND;
      }
    } else {
      this.currentKing = null;
    }
    
    return null;
  }
  
  getScores() {
    const scores = {};
    Object.entries(this.scores).forEach(([playerId, time]) => {
      scores[playerId] = Math.floor(time);
    });
    return scores;
  }
  
  getWinner() {
    let maxScore = 0;
    let winner = null;
    
    Object.entries(this.scores).forEach(([playerId, score]) => {
      if (score > maxScore) {
        maxScore = score;
        winner = playerId;
      }
    });
    
    return winner;
  }
  
  cleanup() {
    // Remove the tower when mode ends
    this.physics.removeTower();
  }
  
  getModeState() {
    return {
      mode: this.name,
      scores: this.getScores(),
      currentKing: this.currentKing
    };
  }
}
