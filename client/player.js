/**
 * RuleBreak Arena - Player Module
 * Player-specific rendering and state (client-side)
 */

import * as THREE from 'three';
import { PHYSICS, TEAM_COLORS } from '../shared/config.js';

export class PlayerRenderer {
  constructor(id, team, isLocal) {
    this.id = id;
    this.team = team;
    this.isLocal = isLocal;
    this.mesh = null;
    this.targetPosition = new THREE.Vector3();
    this.targetVelocity = new THREE.Vector3();
    
    this.createMesh();
  }
  
  createMesh() {
    // Player body (sphere)
    const geometry = new THREE.SphereGeometry(PHYSICS.PLAYER_RADIUS, 16, 16);
    const color = this.team === 'teamA' ? TEAM_COLORS.TEAM_A : TEAM_COLORS.TEAM_B;
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.3,
      emissive: this.isLocal ? color : 0x000000,
      emissiveIntensity: this.isLocal ? 0.3 : 0
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    
    // Add indicator for local player
    if (this.isLocal) {
      const ringGeom = new THREE.TorusGeometry(PHYSICS.PLAYER_RADIUS + 0.2, 0.05, 8, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -PHYSICS.PLAYER_RADIUS + 0.1;
      this.mesh.add(ring);
    }
    
    // Player direction indicator (nose)
    const noseGeom = new THREE.ConeGeometry(0.15, 0.3, 8);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.z = PHYSICS.PLAYER_RADIUS;
    this.mesh.add(nose);
  }
  
  updateFromServer(position, velocity) {
    this.targetPosition.set(position.x, position.y, position.z);
    this.targetVelocity.set(velocity.x, velocity.y, velocity.z);
  }
  
  update() {
    // Interpolate position
    this.mesh.position.lerp(this.targetPosition, 0.3);
    
    // Face direction of movement
    if (this.targetVelocity.length() > 0.5) {
      const angle = Math.atan2(this.targetVelocity.x, this.targetVelocity.z);
      this.mesh.rotation.y = angle;
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  setVisible(visible) {
    this.mesh.visible = visible;
  }
  
  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}
