/**
 * RuleBreak Arena - Physics System
 * Server-side physics using Cannon-es
 */

import * as CANNON from 'cannon-es';
import { PHYSICS, ARENA, PLAYER } from '../shared/config.js';

export class PhysicsWorld {
  constructor() {
    // Create physics world
    this.world = new CANNON.World();
    this.world.gravity.set(0, PHYSICS.GRAVITY, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    
    // Store physics bodies
    this.playerBodies = new Map();
    this.ballBody = null;
    this.arenaBodies = [];
    this.towerBody = null;
    this.goalBodies = { teamA: null, teamB: null };
    
    // Contact materials
    this.setupMaterials();
    
    // Create arena
    this.createArena();
    this.createBall();
  }
  
  setupMaterials() {
    // Default material for all objects
    this.defaultMaterial = new CANNON.Material('default');
    this.defaultContact = new CANNON.ContactMaterial(
      this.defaultMaterial,
      this.defaultMaterial,
      {
        friction: PHYSICS.FRICTION,
        restitution: PHYSICS.RESTITUTION
      }
    );
    this.world.addContactMaterial(this.defaultContact);
  }
  
  createArena() {
    // Floor
    const floorShape = new CANNON.Box(
      new CANNON.Vec3(ARENA.WIDTH / 2, 0.5, ARENA.DEPTH / 2)
    );
    const floorBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.5, 0),
      shape: floorShape,
      material: this.defaultMaterial
    });
    this.world.addBody(floorBody);
    this.arenaBodies.push(floorBody);
    this.floorBody = floorBody;
    
    // Walls
    this.createWalls();
    
    // Goals (for Goal mode)
    this.createGoals();
  }
  
  createWalls() {
    const wallThickness = 0.5;
    const wallPositions = [
      // North wall
      { pos: [0, ARENA.WALL_HEIGHT / 2, -ARENA.DEPTH / 2], size: [ARENA.WIDTH / 2, ARENA.WALL_HEIGHT / 2, wallThickness] },
      // South wall
      { pos: [0, ARENA.WALL_HEIGHT / 2, ARENA.DEPTH / 2], size: [ARENA.WIDTH / 2, ARENA.WALL_HEIGHT / 2, wallThickness] },
      // West wall (with gap for goal)
      { pos: [-ARENA.WIDTH / 2, ARENA.WALL_HEIGHT / 2, -ARENA.DEPTH / 4 - ARENA.GOAL_WIDTH / 2], size: [wallThickness, ARENA.WALL_HEIGHT / 2, ARENA.DEPTH / 4 - ARENA.GOAL_WIDTH / 2] },
      { pos: [-ARENA.WIDTH / 2, ARENA.WALL_HEIGHT / 2, ARENA.DEPTH / 4 + ARENA.GOAL_WIDTH / 2], size: [wallThickness, ARENA.WALL_HEIGHT / 2, ARENA.DEPTH / 4 - ARENA.GOAL_WIDTH / 2] },
      // East wall (with gap for goal)
      { pos: [ARENA.WIDTH / 2, ARENA.WALL_HEIGHT / 2, -ARENA.DEPTH / 4 - ARENA.GOAL_WIDTH / 2], size: [wallThickness, ARENA.WALL_HEIGHT / 2, ARENA.DEPTH / 4 - ARENA.GOAL_WIDTH / 2] },
      { pos: [ARENA.WIDTH / 2, ARENA.WALL_HEIGHT / 2, ARENA.DEPTH / 4 + ARENA.GOAL_WIDTH / 2], size: [wallThickness, ARENA.WALL_HEIGHT / 2, ARENA.DEPTH / 4 - ARENA.GOAL_WIDTH / 2] }
    ];
    
    wallPositions.forEach(wall => {
      const shape = new CANNON.Box(new CANNON.Vec3(...wall.size));
      const body = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(...wall.pos),
        shape: shape,
        material: this.defaultMaterial
      });
      this.world.addBody(body);
      this.arenaBodies.push(body);
    });
  }
  
  createGoals() {
    // Goal sensors (triggers, not solid)
    const goalShape = new CANNON.Box(
      new CANNON.Vec3(ARENA.GOAL_DEPTH / 2, ARENA.GOAL_HEIGHT / 2, ARENA.GOAL_WIDTH / 2)
    );
    
    // Team A goal (West)
    this.goalBodies.teamA = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(-ARENA.WIDTH / 2 - ARENA.GOAL_DEPTH / 2, ARENA.GOAL_HEIGHT / 2, 0),
      shape: goalShape,
      isTrigger: true
    });
    this.world.addBody(this.goalBodies.teamA);
    
    // Team B goal (East)
    this.goalBodies.teamB = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(ARENA.WIDTH / 2 + ARENA.GOAL_DEPTH / 2, ARENA.GOAL_HEIGHT / 2, 0),
      shape: goalShape,
      isTrigger: true
    });
    this.world.addBody(this.goalBodies.teamB);
  }
  
  createBall() {
    const shape = new CANNON.Sphere(PHYSICS.BALL_RADIUS);
    this.ballBody = new CANNON.Body({
      mass: PHYSICS.BALL_MASS,
      position: new CANNON.Vec3(0, 2, 0),
      shape: shape,
      material: this.defaultMaterial,
      linearDamping: 0.3,
      angularDamping: 0.3
    });
    this.world.addBody(this.ballBody);
  }
  
  createTower() {
    // Remove existing tower if any
    if (this.towerBody) {
      this.world.removeBody(this.towerBody);
    }
    
    // Create tower for King of the Tower mode
    const shape = new CANNON.Cylinder(
      ARENA.TOWER_RADIUS,
      ARENA.TOWER_RADIUS * 1.5,
      ARENA.TOWER_HEIGHT,
      12
    );
    this.towerBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, ARENA.TOWER_HEIGHT / 2, 0),
      shape: shape,
      material: this.defaultMaterial
    });
    this.world.addBody(this.towerBody);
  }
  
  removeTower() {
    if (this.towerBody) {
      this.world.removeBody(this.towerBody);
      this.towerBody = null;
    }
  }
  
  addPlayer(playerId) {
    const shape = new CANNON.Sphere(PHYSICS.PLAYER_RADIUS);
    const body = new CANNON.Body({
      mass: PHYSICS.PLAYER_MASS,
      position: new CANNON.Vec3(
        (Math.random() - 0.5) * 10,
        2,
        (Math.random() - 0.5) * 10
      ),
      shape: shape,
      material: this.defaultMaterial,
      linearDamping: 0.5,
      angularDamping: 0.5
    });
    
    // Prevent player from tipping over
    body.fixedRotation = true;
    body.updateMassProperties();
    
    this.world.addBody(body);
    this.playerBodies.set(playerId, body);
    return body;
  }
  
  removePlayer(playerId) {
    const body = this.playerBodies.get(playerId);
    if (body) {
      this.world.removeBody(body);
      this.playerBodies.delete(playerId);
    }
  }
  
  applyMovement(playerId, direction) {
    const body = this.playerBodies.get(playerId);
    if (!body) return;
    
    const force = new CANNON.Vec3(
      direction.x * PHYSICS.MOVE_FORCE,
      0,
      direction.z * PHYSICS.MOVE_FORCE
    );
    body.applyForce(force, body.position);
    
    // Clamp velocity
    this.clampVelocity(body);
  }
  
  applyDash(playerId, direction) {
    const body = this.playerBodies.get(playerId);
    if (!body) return;
    
    const impulse = new CANNON.Vec3(
      direction.x * PHYSICS.DASH_FORCE,
      0,
      direction.z * PHYSICS.DASH_FORCE
    );
    body.applyImpulse(impulse, body.position);
  }
  
  applyPush(pusherId, targetId) {
    const pusher = this.playerBodies.get(pusherId);
    const target = this.playerBodies.get(targetId);
    if (!pusher || !target) return false;
    
    // Check distance
    const distance = pusher.position.distanceTo(target.position);
    if (distance > PHYSICS.PLAYER_RADIUS * 4) return false;
    
    // Calculate push direction
    const direction = new CANNON.Vec3();
    target.position.vsub(pusher.position, direction);
    direction.normalize();
    
    // Apply push impulse
    const impulse = direction.scale(PHYSICS.PUSH_FORCE);
    target.applyImpulse(impulse, target.position);
    
    return true;
  }
  
  clampVelocity(body) {
    const speed = body.velocity.length();
    if (speed > PHYSICS.MAX_VELOCITY) {
      body.velocity.scale(PHYSICS.MAX_VELOCITY / speed, body.velocity);
    }
  }
  
  resetBall() {
    this.ballBody.position.set(0, 2, 0);
    this.ballBody.velocity.set(0, 0, 0);
    this.ballBody.angularVelocity.set(0, 0, 0);
  }
  
  resetPlayerPosition(playerId, position) {
    const body = this.playerBodies.get(playerId);
    if (body) {
      body.position.copy(position);
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
    }
  }
  
  getPlayerPosition(playerId) {
    const body = this.playerBodies.get(playerId);
    if (!body) return null;
    return {
      x: body.position.x,
      y: body.position.y,
      z: body.position.z
    };
  }
  
  getBallPosition() {
    return {
      x: this.ballBody.position.x,
      y: this.ballBody.position.y,
      z: this.ballBody.position.z
    };
  }
  
  getBallVelocity() {
    return {
      x: this.ballBody.velocity.x,
      y: this.ballBody.velocity.y,
      z: this.ballBody.velocity.z
    };
  }
  
  checkBallInGoal() {
    const ballPos = this.ballBody.position;
    
    // Check Team A goal (West)
    if (ballPos.x < -ARENA.WIDTH / 2 && 
        Math.abs(ballPos.z) < ARENA.GOAL_WIDTH / 2 &&
        ballPos.y < ARENA.GOAL_HEIGHT) {
      return 'teamB'; // Team B scored in Team A's goal
    }
    
    // Check Team B goal (East)
    if (ballPos.x > ARENA.WIDTH / 2 && 
        Math.abs(ballPos.z) < ARENA.GOAL_WIDTH / 2 &&
        ballPos.y < ARENA.GOAL_HEIGHT) {
      return 'teamA'; // Team A scored in Team B's goal
    }
    
    return null;
  }
  
  checkPlayerFallen(playerId) {
    const body = this.playerBodies.get(playerId);
    if (!body) return false;
    return body.position.y < PLAYER.FALL_DEATH_Y;
  }
  
  getClosestPlayerToBall() {
    let closestId = null;
    let closestDist = Infinity;
    const ballPos = this.ballBody.position;
    
    this.playerBodies.forEach((body, playerId) => {
      const dist = body.position.distanceTo(ballPos);
      if (dist < closestDist) {
        closestDist = dist;
        closestId = playerId;
      }
    });
    
    return { playerId: closestId, distance: closestDist };
  }
  
  isPlayerOnTower(playerId) {
    if (!this.towerBody) return false;
    
    const body = this.playerBodies.get(playerId);
    if (!body) return false;
    
    // Check if player is on top of the tower
    const towerTop = ARENA.TOWER_HEIGHT;
    const distFromCenter = Math.sqrt(
      Math.pow(body.position.x, 2) + 
      Math.pow(body.position.z, 2)
    );
    
    return body.position.y > towerTop - 1 && 
           body.position.y < towerTop + 2 &&
           distFromCenter < ARENA.TOWER_RADIUS * 1.5;
  }
  
  update(deltaTime) {
    this.world.step(1 / 60, deltaTime, 3);
  }
  
  getAllPlayerPositions() {
    const positions = {};
    this.playerBodies.forEach((body, playerId) => {
      positions[playerId] = {
        x: body.position.x,
        y: body.position.y,
        z: body.position.z,
        vx: body.velocity.x,
        vy: body.velocity.y,
        vz: body.velocity.z
      };
    });
    return positions;
  }
}
