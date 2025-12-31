/**
 * 3D Platformer Game Template
 * Uses Three.js and the GameEngine core
 * No additional dependencies needed
 */

import * as THREE from 'three';
import { GameEngine, GameObject } from '../core/GameEngine';
import { GameProject } from '../../types/state';

export class Platformer3DTemplate {
  private engine: GameEngine;
  private player: GameObject | null = null;
  private platforms: GameObject[] = [];
  private collectibles: GameObject[] = [];

  // Game state
  private score: number = 0;
  private lives: number = 3;
  private gameOver: boolean = false;

  // Player controls
  private keys: { [key: string]: boolean } = {};
  private readonly PLAYER_SPEED = 5;
  private readonly JUMP_POWER = 10;
  private readonly MOVE_SPEED = 0.1;

  // Camera
  private cameraOffset = new THREE.Vector3(0, 8, 12);

  // UI callbacks
  public onScoreChange?: (score: number) => void;
  public onLivesChange?: (lives: number) => void;
  public onGameOver?: () => void;

  constructor(canvas: HTMLCanvasElement, project: GameProject) {
    // Initialize game engine
    this.engine = new GameEngine({
      canvas,
      width: project.gameConfig.width,
      height: project.gameConfig.height,
      backgroundColor: project.gameConfig.backgroundColor,
      enablePhysics: true,
      gravity: 20
    });

    // Set up input handling
    this.setupInput();

    // Build the game world
    this.buildWorld();

    // Set up update loop
    this.engine.onUpdate = (deltaTime) => this.update(deltaTime);
  }

  /**
   * Set up keyboard input
   */
  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Touch controls for mobile
    let touchStartX = 0;
    this.engine.renderer.domElement.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      // Jump on touch
      if (this.player && this.player.userData.onGround) {
        this.player.velocity!.y = this.JUMP_POWER;
        this.player.userData.onGround = false;
      }
    });

    this.engine.renderer.domElement.addEventListener('touchmove', (e) => {
      const touchX = e.touches[0].clientX;
      const diff = touchX - touchStartX;
      if (this.player) {
        this.player.velocity!.x = diff * 0.01;
      }
    });

    this.engine.renderer.domElement.addEventListener('touchend', () => {
      if (this.player) {
        this.player.velocity!.x = 0;
      }
    });
  }

  /**
   * Build the 3D game world
   */
  private buildWorld(): void {
    // Create ground
    this.createPlatform('ground', 20, 0.5, 20, new THREE.Vector3(0, 0, 0));

    // Create platforms
    this.createPlatform('platform1', 4, 0.5, 4, new THREE.Vector3(6, 2, 0));
    this.createPlatform('platform2', 4, 0.5, 4, new THREE.Vector3(-6, 4, 0));
    this.createPlatform('platform3', 4, 0.5, 4, new THREE.Vector3(0, 6, -5));
    this.createPlatform('platform4', 6, 0.5, 4, new THREE.Vector3(8, 8, -5));

    // Create player
    this.createPlayer();

    // Create collectibles
    this.createCollectible('coin1', new THREE.Vector3(6, 3.5, 0));
    this.createCollectible('coin2', new THREE.Vector3(-6, 5.5, 0));
    this.createCollectible('coin3', new THREE.Vector3(0, 7.5, -5));
    this.createCollectible('coin4', new THREE.Vector3(8, 9.5, -5));
  }

  /**
   * Create a platform
   */
  private createPlatform(
    id: string,
    width: number,
    height: number,
    depth: number,
    position: THREE.Vector3
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color: 0x45b7d1,
      roughness: 0.7,
      metalness: 0.3
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const platform: GameObject = {
      id,
      name: 'Platform',
      mesh,
      position: position.clone(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
      userData: { isPlatform: true, width, height, depth }
    };

    this.platforms.push(platform);
    this.engine.addGameObject(platform);
  }

  /**
   * Create the player character
   */
  private createPlayer(): void {
    const geometry = new THREE.BoxGeometry(1, 1.5, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4ecdc4,
      roughness: 0.5,
      metalness: 0.5
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.25, 0.3, 0.5);
    mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.25, 0.3, 0.5);
    mesh.add(rightEye);

    // Add pupils
    const pupilGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.25, 0.3, 0.55);
    mesh.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.25, 0.3, 0.55);
    mesh.add(rightPupil);

    this.player = {
      id: 'player',
      name: 'Player',
      mesh,
      position: new THREE.Vector3(0, 5, 0),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
      velocity: new THREE.Vector3(0, 0, 0),
      userData: { onGround: false }
    };

    this.engine.addGameObject(this.player);
  }

  /**
   * Create a collectible coin
   */
  private createCollectible(id: string, position: THREE.Vector3): void {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = Math.PI / 2;

    const collectible: GameObject = {
      id,
      name: 'Coin',
      mesh,
      position: position.clone(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1),
      userData: { isCollectible: true, collected: false },
      update: (deltaTime) => {
        // Rotate coin
        mesh.rotation.z += deltaTime * 2;
        // Bob up and down
        mesh.position.y += Math.sin(Date.now() * 0.003) * 0.01;
      }
    };

    this.collectibles.push(collectible);
    this.engine.addGameObject(collectible);
  }

  /**
   * Update game logic
   */
  private update(deltaTime: number): void {
    if (this.gameOver || !this.player) return;

    // Player movement
    const moveVector = new THREE.Vector3();

    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      moveVector.x = -this.MOVE_SPEED;
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      moveVector.x = this.MOVE_SPEED;
    }
    if (this.keys['ArrowUp'] || this.keys['KeyW']) {
      moveVector.z = -this.MOVE_SPEED;
    }
    if (this.keys['ArrowDown'] || this.keys['KeyS']) {
      moveVector.z = this.MOVE_SPEED;
    }

    // Apply movement
    this.player.velocity!.x = moveVector.x * this.PLAYER_SPEED;
    this.player.velocity!.z = moveVector.z * this.PLAYER_SPEED;

    // Jump
    if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) &&
        this.player.userData.onGround) {
      this.player.velocity!.y = this.JUMP_POWER;
      this.player.userData.onGround = false;
    }

    // Platform collision
    this.checkPlatformCollisions();

    // Collectible collision
    this.checkCollectibleCollisions();

    // Fall off check
    if (this.player.position.y < -10) {
      this.lives--;
      this.onLivesChange?.(this.lives);

      if (this.lives <= 0) {
        this.gameOver = true;
        this.onGameOver?.();
      } else {
        // Reset player position
        this.player.position.set(0, 5, 0);
        this.player.velocity!.set(0, 0, 0);
      }
    }

    // Update camera to follow player
    this.updateCamera();
  }

  /**
   * Check collisions with platforms
   */
  private checkPlatformCollisions(): void {
    if (!this.player) return;

    this.player.userData.onGround = false;

    this.platforms.forEach((platform) => {
      const playerBox = new THREE.Box3().setFromObject(this.player!.mesh);
      const platformBox = new THREE.Box3().setFromObject(platform.mesh);

      if (playerBox.intersectsBox(platformBox)) {
        // Landing on top
        if (this.player!.velocity!.y < 0 &&
            this.player!.position.y > platform.position.y) {
          this.player!.position.y = platform.position.y + platform.userData.height + 0.75;
          this.player!.velocity!.y = 0;
          this.player!.userData.onGround = true;
        }
      }
    });
  }

  /**
   * Check collisions with collectibles
   */
  private checkCollectibleCollisions(): void {
    if (!this.player) return;

    const playerBox = new THREE.Box3().setFromObject(this.player.mesh);

    this.collectibles.forEach((collectible) => {
      if (collectible.userData.collected) return;

      const collectibleBox = new THREE.Box3().setFromObject(collectible.mesh);

      if (playerBox.intersectsBox(collectibleBox)) {
        // Collect coin
        collectible.userData.collected = true;
        this.engine.removeGameObject(collectible.id);

        this.score += 100;
        this.onScoreChange?.(this.score);

        // Play sound effect (if available)
        this.playCollectSound();
      }
    });
  }

  /**
   * Update camera to follow player
   */
  private updateCamera(): void {
    if (!this.player) return;

    const targetPosition = new THREE.Vector3()
      .copy(this.player.position)
      .add(this.cameraOffset);

    this.engine.camera.position.lerp(targetPosition, 0.1);
    this.engine.camera.lookAt(this.player.position);
  }

  /**
   * Play collect sound (placeholder - can be enhanced later)
   */
  private playCollectSound(): void {
    // Can integrate Web Audio API here if needed
    console.log('🎵 Coin collected!');
  }

  /**
   * Start the game
   */
  start(): void {
    this.engine.start();
  }

  /**
   * Stop the game
   */
  stop(): void {
    this.engine.stop();
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.engine.pause();
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.engine.resume();
  }

  /**
   * Get current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Get current lives
   */
  getLives(): number {
    return this.lives;
  }

  /**
   * Check if game is over
   */
  isGameOver(): boolean {
    return this.gameOver;
  }

  /**
   * Reset the game
   */
  reset(): void {
    this.gameOver = false;
    this.score = 0;
    this.lives = 3;

    // Reset player
    if (this.player) {
      this.player.position.set(0, 5, 0);
      this.player.velocity!.set(0, 0, 0);
    }

    // Reset collectibles
    this.collectibles.forEach((collectible) => {
      if (collectible.userData.collected) {
        collectible.userData.collected = false;
        this.engine.addGameObject(collectible);
      }
    });

    this.onScoreChange?.(this.score);
    this.onLivesChange?.(this.lives);
  }

  /**
   * Clean up
   */
  dispose(): void {
    this.engine.dispose();
    window.removeEventListener('keydown', this.setupInput);
    window.removeEventListener('keyup', this.setupInput);
  }
}
