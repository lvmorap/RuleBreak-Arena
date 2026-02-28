/**
 * RuleBreak Arena - UI Management
 * Handles all UI overlays and updates
 */

export class UI {
  constructor() {
    // Cache DOM elements
    this.elements = {
      modeDisplay: document.getElementById('mode-display'),
      modeTimer: document.querySelector('#timer-display .mode-timer'),
      matchTimer: document.querySelector('#timer-display .match-timer'),
      scoreList: document.getElementById('score-list'),
      modeAnnouncement: document.getElementById('mode-announcement'),
      newModeName: document.getElementById('new-mode-name'),
      modeDescription: document.getElementById('mode-description'),
      matchEndScreen: document.getElementById('match-end-screen'),
      finalScoreList: document.getElementById('final-score-list'),
      connectionStatus: document.getElementById('connection-status')
    };
    
    this.announcementTimeout = null;
  }
  
  updateState(state, localPlayerId) {
    if (!state) return;
    
    // Update mode display
    this.updateModeDisplay(state.currentMode);
    
    // Update timers
    this.updateTimers(state.modeTimer, state.matchTimer);
    
    // Update scoreboard
    this.updateScoreboard(state, localPlayerId);
  }
  
  updateModeDisplay(mode) {
    const modeNames = {
      GOAL: '⚽ GOAL MODE',
      HOLD: '🏐 HOLD MODE',
      ELIMINATION: '💥 ELIMINATION',
      TOWER: '👑 TOWER MODE'
    };
    
    this.elements.modeDisplay.textContent = modeNames[mode] || mode;
  }
  
  updateTimers(modeTimer, matchTimer) {
    // Mode timer
    this.elements.modeTimer.textContent = modeTimer;
    
    // Match timer (format as M:SS)
    const minutes = Math.floor(matchTimer / 60);
    const seconds = matchTimer % 60;
    this.elements.matchTimer.textContent = `Match: ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  updateScoreboard(state, localPlayerId) {
    if (!state.players) return;
    
    // Get scores based on mode
    let scores = [];
    
    if (state.modeState) {
      const mode = state.modeState.mode;
      
      if (mode === 'GOAL') {
        // Team scores for Goal mode
        scores = [
          { name: 'Team Blue', score: state.modeState.scores?.teamA || 0, team: 'teamA' },
          { name: 'Team Red', score: state.modeState.scores?.teamB || 0, team: 'teamB' }
        ];
      } else if (mode === 'HOLD' || mode === 'TOWER') {
        // Individual scores
        const modeScores = state.modeState.holdTimes || state.modeState.scores || {};
        scores = Object.entries(state.players).map(([id, player]) => ({
          id: id,
          name: this.getPlayerName(id, localPlayerId),
          score: modeScores[id] || 0,
          team: player.team,
          isLocal: id === localPlayerId
        }));
      } else if (mode === 'ELIMINATION') {
        // Kill scores
        const kills = state.modeState.kills || {};
        scores = Object.entries(state.players).map(([id, player]) => ({
          id: id,
          name: this.getPlayerName(id, localPlayerId),
          score: kills[id] || 0,
          team: player.team,
          isLocal: id === localPlayerId
        }));
      }
    }
    
    // Sort by score (descending)
    scores.sort((a, b) => b.score - a.score);
    
    // Render scoreboard
    this.elements.scoreList.innerHTML = scores.map(entry => {
      const teamClass = entry.team === 'teamA' ? 'team-a' : 'team-b';
      const selfClass = entry.isLocal ? 'self' : '';
      return `<div class="score-entry ${teamClass} ${selfClass}">
        <span>${entry.name}</span>
        <span>${entry.score}</span>
      </div>`;
    }).join('');
  }
  
  getPlayerName(playerId, localPlayerId) {
    if (playerId === localPlayerId) {
      return 'You';
    }
    // Shorten player ID for display
    return 'Player ' + playerId.substring(0, 4);
  }
  
  showModeAnnouncement(mode, message) {
    const modeNames = {
      GOAL: '⚽ GOAL MODE',
      HOLD: '🏐 HOLD THE BALL',
      ELIMINATION: '💥 ELIMINATION',
      TOWER: '👑 KING OF THE TOWER'
    };
    
    this.elements.newModeName.textContent = modeNames[mode] || mode;
    this.elements.modeDescription.textContent = message;
    this.elements.modeAnnouncement.classList.add('visible');
    
    // Clear previous timeout
    if (this.announcementTimeout) {
      clearTimeout(this.announcementTimeout);
    }
    
    // Hide after 3 seconds
    this.announcementTimeout = setTimeout(() => {
      this.elements.modeAnnouncement.classList.remove('visible');
    }, 3000);
  }
  
  showMatchEnd(scores, winnerId, localPlayerId) {
    // Build final scores list
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([id, score]) => ({
        id,
        name: this.getPlayerName(id, localPlayerId),
        score,
        isWinner: id === winnerId
      }));
    
    this.elements.finalScoreList.innerHTML = sortedScores.map(entry => {
      const winnerClass = entry.isWinner ? 'winner' : '';
      const winnerIcon = entry.isWinner ? '👑 ' : '';
      return `<div class="score-row ${winnerClass}">
        <span>${winnerIcon}${entry.name}</span>
        <span>${entry.score} pts</span>
      </div>`;
    }).join('');
    
    this.elements.matchEndScreen.classList.add('visible');
  }
  
  hideMatchEnd() {
    this.elements.matchEndScreen.classList.remove('visible');
  }
  
  setConnectionStatus(connected) {
    if (connected) {
      this.elements.connectionStatus.textContent = '🟢 Connected';
      this.elements.connectionStatus.classList.remove('disconnected');
      this.elements.connectionStatus.classList.add('connected');
    } else {
      this.elements.connectionStatus.textContent = '🔴 Disconnected';
      this.elements.connectionStatus.classList.remove('connected');
      this.elements.connectionStatus.classList.add('disconnected');
    }
  }
}
