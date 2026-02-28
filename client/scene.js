/**
 * RuleBreak Arena - 3D Scene Management
 * Three.js scene setup and rendering
 */

import * as THREE from 'three';
import { CAMERA, ARENA, TEAM_COLORS, PHYSICS } from '../shared/config.js';

export class GameScene {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.players = new Map();
    this.ball = null;
    this.tower = null;
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.currentMode = 'GOAL';
  }
  
  async init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 30, 80);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      CAMERA.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA.NEAR,
      CAMERA.FAR
    );
    this.camera.position.set(0, CAMERA.HEIGHT, CAMERA.DISTANCE);
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game-container').appendChild(this.renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
    
    // Setup lights
    this.setupLights();
    
    // Create arena
    this.createArena();
    
    // Create ball
    this.createBall();
  }
  
  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);
    
    // Main directional light (sun)
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(20, 30, 20);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 1;
    directional.shadow.camera.far = 100;
    directional.shadow.camera.left = -30;
    directional.shadow.camera.right = 30;
    directional.shadow.camera.top = 30;
    directional.shadow.camera.bottom = -30;
    this.scene.add(directional);
    
    // Colored accent lights
    const blueLight = new THREE.PointLight(0x3498db, 0.5, 30);
    blueLight.position.set(-ARENA.WIDTH / 2, 5, 0);
    this.scene.add(blueLight);
    
    const redLight = new THREE.PointLight(0xe74c3c, 0.5, 30);
    redLight.position.set(ARENA.WIDTH / 2, 5, 0);
    this.scene.add(redLight);
  }
  
  createArena() {
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(ARENA.WIDTH, ARENA.DEPTH);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Floor lines (field markings)
    this.createFieldMarkings();
    
    // Walls
    this.createWalls();
    
    // Goals
    this.createGoals();
  }
  
  createFieldMarkings() {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x4ecdc4, linewidth: 2 });
    
    // Center line
    const centerLineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.01, -ARENA.DEPTH / 2),
      new THREE.Vector3(0, 0.01, ARENA.DEPTH / 2)
    ]);
    const centerLine = new THREE.Line(centerLineGeom, lineMaterial);
    this.scene.add(centerLine);
    
    // Center circle
    const circleGeom = new THREE.RingGeometry(3.9, 4, 32);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(circleGeom, circleMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.01;
    this.scene.add(circle);
  }
  
  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x34495e,
      roughness: 0.5,
      metalness: 0.3,
      transparent: true,
      opacity: 0.7
    });
    
    const wallHeight = ARENA.WALL_HEIGHT;
    const wallThickness = 0.5;
    
    // North wall
    this.createWall(
      0, wallHeight / 2, -ARENA.DEPTH / 2,
      ARENA.WIDTH, wallHeight, wallThickness,
      wallMaterial
    );
    
    // South wall
    this.createWall(
      0, wallHeight / 2, ARENA.DEPTH / 2,
      ARENA.WIDTH, wallHeight, wallThickness,
      wallMaterial
    );
    
    // West walls (with gap for goal)
    const sideWallLength = (ARENA.DEPTH - ARENA.GOAL_WIDTH) / 2;
    this.createWall(
      -ARENA.WIDTH / 2, wallHeight / 2, -ARENA.DEPTH / 4 - ARENA.GOAL_WIDTH / 4,
      wallThickness, wallHeight, sideWallLength,
      wallMaterial
    );
    this.createWall(
      -ARENA.WIDTH / 2, wallHeight / 2, ARENA.DEPTH / 4 + ARENA.GOAL_WIDTH / 4,
      wallThickness, wallHeight, sideWallLength,
      wallMaterial
    );
    
    // East walls (with gap for goal)
    this.createWall(
      ARENA.WIDTH / 2, wallHeight / 2, -ARENA.DEPTH / 4 - ARENA.GOAL_WIDTH / 4,
      wallThickness, wallHeight, sideWallLength,
      wallMaterial
    );
    this.createWall(
      ARENA.WIDTH / 2, wallHeight / 2, ARENA.DEPTH / 4 + ARENA.GOAL_WIDTH / 4,
      wallThickness, wallHeight, sideWallLength,
      wallMaterial
    );
  }
  
  createWall(x, y, z, width, height, depth, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }
  
  createGoals() {
    // Goal frame material
    const goalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.7
    });
    
    // Team A goal (West - Blue team defends)
    this.createGoalFrame(-ARENA.WIDTH / 2 - ARENA.GOAL_DEPTH / 2, 0, goalMaterial, 0x3498db);
    
    // Team B goal (East - Red team defends)
    this.createGoalFrame(ARENA.WIDTH / 2 + ARENA.GOAL_DEPTH / 2, Math.PI, goalMaterial, 0xe74c3c);
  }
  
  createGoalFrame(x, rotation, material, teamColor) {
    const group = new THREE.Group();
    group.position.set(x, 0, 0);
    group.rotation.y = rotation;
    
    const postRadius = 0.1;
    const postGeom = new THREE.CylinderGeometry(postRadius, postRadius, ARENA.GOAL_HEIGHT, 8);
    const crossbarGeom = new THREE.CylinderGeometry(postRadius, postRadius, ARENA.GOAL_WIDTH, 8);
    
    // Left post
    const leftPost = new THREE.Mesh(postGeom, material);
    leftPost.position.set(0, ARENA.GOAL_HEIGHT / 2, -ARENA.GOAL_WIDTH / 2);
    group.add(leftPost);
    
    // Right post
    const rightPost = new THREE.Mesh(postGeom, material);
    rightPost.position.set(0, ARENA.GOAL_HEIGHT / 2, ARENA.GOAL_WIDTH / 2);
    group.add(rightPost);
    
    // Crossbar
    const crossbar = new THREE.Mesh(crossbarGeom, material);
    crossbar.rotation.x = Math.PI / 2;
    crossbar.position.set(0, ARENA.GOAL_HEIGHT, 0);
    group.add(crossbar);
    
    // Goal back net (visual only)
    const netGeom = new THREE.PlaneGeometry(ARENA.GOAL_DEPTH, ARENA.GOAL_WIDTH);
    const netMat = new THREE.MeshBasicMaterial({
      color: teamColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3
    });
    const net = new THREE.Mesh(netGeom, netMat);
    net.rotation.y = Math.PI / 2;
    net.rotation.z = Math.PI / 2;
    net.position.set(-ARENA.GOAL_DEPTH / 2, ARENA.GOAL_HEIGHT / 2, 0);
    group.add(net);
    
    this.scene.add(group);
  }
  
  createBall() {
    const geometry = new THREE.SphereGeometry(PHYSICS.BALL_RADIUS, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      roughness: 0.3,
      metalness: 0.5,
      emissive: 0xf1c40f,
      emissiveIntensity: 0.2
    });
    
    this.ball = new THREE.Mesh(geometry, material);
    this.ball.castShadow = true;
    this.ball.position.set(0, PHYSICS.BALL_RADIUS, 0);
    this.scene.add(this.ball);
  }
  
  createTower() {
    if (this.tower) return;
    
    // Tower base
    const geometry = new THREE.CylinderGeometry(
      ARENA.TOWER_RADIUS,
      ARENA.TOWER_RADIUS * 1.5,
      ARENA.TOWER_HEIGHT,
      12
    );
    const material = new THREE.MeshStandardMaterial({
      color: 0xf39c12,
      roughness: 0.5,
      metalness: 0.3
    });
    
    this.tower = new THREE.Mesh(geometry, material);
    this.tower.position.set(0, ARENA.TOWER_HEIGHT / 2, 0);
    this.tower.castShadow = true;
    this.tower.receiveShadow = true;
    this.scene.add(this.tower);
    
    // Crown indicator on top
    const crownGeom = new THREE.TorusGeometry(ARENA.TOWER_RADIUS * 0.8, 0.2, 8, 16);
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      emissive: 0xf1c40f,
      emissiveIntensity: 0.5
    });
    const crown = new THREE.Mesh(crownGeom, crownMat);
    crown.rotation.x = Math.PI / 2;
    crown.position.set(0, ARENA.TOWER_HEIGHT + 0.3, 0);
    this.tower.add(crown);
  }
  
  removeTower() {
    if (this.tower) {
      this.scene.remove(this.tower);
      this.tower = null;
    }
  }
  
  addPlayer(id, team, isLocal) {
    // Player body (sphere)
    const geometry = new THREE.SphereGeometry(PHYSICS.PLAYER_RADIUS, 16, 16);
    const color = team === 'teamA' ? TEAM_COLORS.TEAM_A : TEAM_COLORS.TEAM_B;
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3,
      emissive: isLocal ? color : 0x000000,
      emissiveIntensity: isLocal ? 0.3 : 0
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    
    // Add indicator for local player
    if (isLocal) {
      const ringGeom = new THREE.TorusGeometry(PHYSICS.PLAYER_RADIUS + 0.2, 0.05, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -PHYSICS.PLAYER_RADIUS + 0.1;
      mesh.add(ring);
    }
    
    // Player direction indicator (nose)
    const noseGeom = new THREE.ConeGeometry(0.15, 0.3, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = PHYSICS.PLAYER_RADIUS;
    mesh.add(nose);
    
    this.players.set(id, {
      mesh: mesh,
      team: team,
      isLocal: isLocal,
      targetPosition: new THREE.Vector3(),
      targetVelocity: new THREE.Vector3()
    });
    
    this.scene.add(mesh);
  }
  
  removePlayer(id) {
    const player = this.players.get(id);
    if (player) {
      this.scene.remove(player.mesh);
      this.players.delete(id);
    }
  }
  
  updatePlayer(id, position, velocity) {
    const player = this.players.get(id);
    if (!player) return;
    
    // Set target for interpolation
    player.targetPosition.set(position.x, position.y, position.z);
    player.targetVelocity.set(velocity.x, velocity.y, velocity.z);
  }
  
  updateBall(position, velocity) {
    if (!this.ball) return;
    
    // Direct position update (could interpolate for smoother rendering)
    this.ball.position.set(position.x, position.y, position.z);
    
    // Rotate ball based on velocity
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    if (speed > 0.1) {
      this.ball.rotation.x += velocity.z * 0.1;
      this.ball.rotation.z -= velocity.x * 0.1;
    }
  }
  
  setCameraTarget(position) {
    this.cameraTarget.set(position.x, position.y, position.z);
  }
  
  handleModeChange(newMode) {
    this.currentMode = newMode;
    
    // Handle mode-specific scene changes
    if (newMode === 'TOWER') {
      this.createTower();
      this.ball.visible = false;
    } else if (newMode === 'ELIMINATION') {
      this.removeTower();
      this.ball.visible = false;
    } else {
      this.removeTower();
      this.ball.visible = true;
    }
  }
  
  updateModeState(modeState) {
    if (!modeState) return;
    
    // Update mode-specific visuals
    if (modeState.mode === 'TOWER' && this.tower) {
      // Highlight current king
      // Could add visual effect here
    }
    
    if (modeState.mode === 'HOLD') {
      // Highlight player holding ball
      if (modeState.holdingPlayer) {
        // Could add visual effect here
      }
    }
  }
  
  update() {
    // Interpolate player positions
    this.players.forEach(player => {
      player.mesh.position.lerp(player.targetPosition, 0.3);
      
      // Face direction of movement
      if (player.targetVelocity.length() > 0.5) {
        const angle = Math.atan2(player.targetVelocity.x, player.targetVelocity.z);
        player.mesh.rotation.y = angle;
      }
    });
    
    // Update camera position
    const cameraOffset = new THREE.Vector3(0, CAMERA.HEIGHT, CAMERA.DISTANCE);
    const targetCameraPos = this.cameraTarget.clone().add(cameraOffset);
    this.camera.position.lerp(targetCameraPos, CAMERA.SMOOTHING);
    this.camera.lookAt(this.cameraTarget);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
