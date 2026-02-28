/**
 * RuleBreak Arena - Shared Configuration
 * Central config file for game constants
 */

// Server settings
export const SERVER_PORT = 3001;
export const TICK_RATE = 30; // Server updates per second
export const CLIENT_PORT = 3000;

// Game settings
export const MAX_PLAYERS = 8;
export const MATCH_DURATION = 300; // 5 minutes in seconds
export const MODE_DURATION = 60; // 60 seconds per mode
export const MODE_TRANSITION_TIME = 3; // 3 seconds freeze between modes
export const GOAL_TO_WIN_MODE = 5; // Goals needed to win Goal mode early

// Game modes
export const GAME_MODES = [
  'GOAL',
  'HOLD',
  'ELIMINATION',
  'TOWER'
];

// Physics settings
export const PHYSICS = {
  GRAVITY: -30,
  PLAYER_MASS: 5,
  BALL_MASS: 1,
  PLAYER_RADIUS: 0.5,
  BALL_RADIUS: 0.4,
  FRICTION: 0.3,
  RESTITUTION: 0.4,
  PUSH_FORCE: 25,
  DASH_FORCE: 15,
  MOVE_FORCE: 10,
  MAX_VELOCITY: 15
};

// Arena settings
export const ARENA = {
  WIDTH: 30,
  DEPTH: 20,
  WALL_HEIGHT: 2,
  GOAL_WIDTH: 4,
  GOAL_HEIGHT: 2,
  GOAL_DEPTH: 1,
  TOWER_RADIUS: 2,
  TOWER_HEIGHT: 5,
  PLATFORM_SHRINK_RATE: 0.5 // Units per second for elimination mode
};

// Player settings
export const PLAYER = {
  RESPAWN_TIME: 5, // Seconds
  DASH_COOLDOWN: 2, // Seconds
  PUSH_COOLDOWN: 1, // Seconds
  STARTING_HEALTH: 100,
  FALL_DEATH_Y: -10 // Y position to trigger fall death
};

// Scoring
export const SCORING = {
  HOLD_POINTS_PER_SECOND: 1,
  TOWER_POINTS_PER_SECOND: 1,
  ELIMINATION_POINTS_PER_KILL: 1,
  GOAL_POINTS_PER_GOAL: 1
};

// Team colors
export const TEAM_COLORS = {
  TEAM_A: 0x3498db, // Blue
  TEAM_B: 0xe74c3c, // Red
  NEUTRAL: 0xf1c40f  // Yellow
};

// Camera settings
export const CAMERA = {
  FOV: 60,
  NEAR: 0.1,
  FAR: 1000,
  DISTANCE: 10,
  HEIGHT: 5,
  SMOOTHING: 0.1
};
