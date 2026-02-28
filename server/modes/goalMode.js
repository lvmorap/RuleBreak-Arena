/**
 * RuleBreak Arena - Goal Mode
 * Soccer-style goal scoring mode
 */

import { SCORING, GOAL_TO_WIN_MODE } from '../../shared/config.js';

export class GoalMode {
  constructor(physics) {
    this.physics = physics;
    this.name = 'GOAL';
    this.description = 'Score goals to win!';
    this.scores = { teamA: 0, teamB: 0 };
    this.goalScored = false;
  }
  
  init() {
    this.scores = { teamA: 0, teamB: 0 };
    this.goalScored = false;
    this.physics.resetBall();
    this.physics.removeTower();
  }
  
  update(deltaTime, players) {
    if (this.goalScored) return;
    
    // Check if ball entered a goal
    const scoringTeam = this.physics.checkBallInGoal();
    
    if (scoringTeam) {
      this.scores[scoringTeam] += SCORING.GOAL_POINTS_PER_GOAL;
      this.goalScored = true;
      
      // Reset after short delay
      setTimeout(() => {
        this.resetPositions(players);
        this.physics.resetBall();
        this.goalScored = false;
      }, 1000);
      
      return {
        event: 'goal',
        team: scoringTeam,
        scores: this.scores
      };
    }
    
    return null;
  }
  
  resetPositions(players) {
    // Reset players to team sides
    let teamACount = 0;
    let teamBCount = 0;
    
    Object.values(players).forEach(player => {
      const xOffset = player.team === 'teamA' ? -8 : 8;
      const zOffset = player.team === 'teamA' ? 
        (teamACount++ - 2) * 3 : 
        (teamBCount++ - 2) * 3;
      
      this.physics.resetPlayerPosition(player.id, {
        x: xOffset,
        y: 1,
        z: zOffset
      });
    });
  }
  
  getScores() {
    return this.scores;
  }
  
  checkModeWin() {
    // Check if a team reached the goal limit
    if (this.scores.teamA >= GOAL_TO_WIN_MODE) {
      return 'teamA';
    }
    if (this.scores.teamB >= GOAL_TO_WIN_MODE) {
      return 'teamB';
    }
    return null;
  }
  
  getModeState() {
    return {
      mode: this.name,
      scores: this.scores,
      goalScored: this.goalScored
    };
  }
}
