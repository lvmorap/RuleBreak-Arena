/**
 * RuleBreak Arena - Ball Module
 * Ball rendering and visual effects (client-side)
 */

import * as THREE from 'three';
import { PHYSICS } from '../shared/config.js';

export class BallRenderer {
  constructor() {
    this.mesh = null;
    this.targetPosition = new THREE.Vector3();
    this.targetVelocity = new THREE.Vector3();
    this.glow = null;
    
    this.createMesh();
  }
  
  createMesh() {
    // Main ball mesh
    const geometry = new THREE.SphereGeometry(PHYSICS.BALL_RADIUS, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf1c40f,
      roughness: 0.3,
      metalness: 0.5,
      emissive: 0xf1c40f,
      emissiveIntensity: 0.2
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    
    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(PHYSICS.BALL_RADIUS * 1.2, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xf1c40f,
      transparent: true,
      opacity: 0.2
    });
    this.glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(this.glow);
  }
  
  updateFromServer(position, velocity) {
    this.targetPosition.set(position.x, position.y, position.z);
    this.targetVelocity.set(velocity.x, velocity.y, velocity.z);
  }
  
  update() {
    // Direct position update (less latency sensitive than players)
    this.mesh.position.copy(this.targetPosition);
    
    // Rotate ball based on velocity
    const speed = Math.sqrt(
      this.targetVelocity.x * this.targetVelocity.x + 
      this.targetVelocity.z * this.targetVelocity.z
    );
    
    if (speed > 0.1) {
      this.mesh.rotation.x += this.targetVelocity.z * 0.1;
      this.mesh.rotation.z -= this.targetVelocity.x * 0.1;
    }
    
    // Pulse glow based on speed
    if (this.glow) {
      const intensity = Math.min(speed / 10, 1);
      this.glow.material.opacity = 0.1 + intensity * 0.3;
      this.glow.scale.setScalar(1 + intensity * 0.2);
    }
  }
  
  getPosition() {
    return this.mesh.position.clone();
  }
  
  setVisible(visible) {
    this.mesh.visible = visible;
  }
  
  highlight(active) {
    // Highlight ball when held
    const emissiveIntensity = active ? 0.5 : 0.2;
    this.mesh.material.emissiveIntensity = emissiveIntensity;
  }
  
  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    if (this.glow) {
      this.glow.geometry.dispose();
      this.glow.material.dispose();
    }
  }
}
