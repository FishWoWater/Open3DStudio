/**
 * Core Three.js Game Engine
 * Provides game loop, scene management, and entity system
 * Uses existing Three.js dependencies - no additional packages needed
 */

import * as THREE from 'three';
import { GameConfig } from '../../types/state';

export interface GameObject {
  id: string;
  name: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  velocity?: THREE.Vector3;
  userData?: any;
  update?: (deltaTime: number) => void;
  onCollision?: (other: GameObject) => void;
}

export interface GameEngineConfig {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  backgroundColor?: string;
  enablePhysics?: boolean;
  gravity?: number;
}

export class GameEngine {
  // Three.js core
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Game objects
  private gameObjects: Map<string, GameObject> = new Map();
  private animationFrameId: number | null = null;

  // Timing
  private clock: THREE.Clock;
  private lastTime: number = 0;

  // Physics (simple)
  public gravity: number;
  public enablePhysics: boolean;

  // State
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // Event callbacks
  public onUpdate?: (deltaTime: number) => void;
  public onRender?: () => void;

  constructor(config: GameEngineConfig) {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.backgroundColor || '#1a1a2e');

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      config.width / config.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvas,
      antialias: true
    });
    this.renderer.setSize(config.width, config.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize lighting
    this.setupLighting();

    // Initialize clock
    this.clock = new THREE.Clock();

    // Physics config
    this.gravity = config.gravity || 9.8;
    this.enablePhysics = config.enablePhysics || false;
  }

  /**
   * Set up basic lighting
   */
  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Hemisphere light for sky/ground
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.3);
    this.scene.add(hemisphereLight);
  }

  /**
   * Add a game object to the scene
   */
  addGameObject(gameObject: GameObject): void {
    this.gameObjects.set(gameObject.id, gameObject);
    this.scene.add(gameObject.mesh);

    // Sync transform
    gameObject.mesh.position.copy(gameObject.position);
    gameObject.mesh.rotation.copy(gameObject.rotation);
    gameObject.mesh.scale.copy(gameObject.scale);
  }

  /**
   * Remove a game object from the scene
   */
  removeGameObject(id: string): void {
    const gameObject = this.gameObjects.get(id);
    if (gameObject) {
      this.scene.remove(gameObject.mesh);
      this.gameObjects.delete(id);
    }
  }

  /**
   * Get a game object by ID
   */
  getGameObject(id: string): GameObject | undefined {
    return this.gameObjects.get(id);
  }

  /**
   * Get all game objects
   */
  getAllGameObjects(): GameObject[] {
    return Array.from(this.gameObjects.values());
  }

  /**
   * Load a 3D model and create a game object
   */
  async loadModel(
    id: string,
    name: string,
    modelUrl: string,
    position?: THREE.Vector3
  ): Promise<GameObject> {
    return new Promise((resolve, reject) => {
      const loader = new THREE.ObjectLoader();

      loader.load(
        modelUrl,
        (object) => {
          const gameObject: GameObject = {
            id,
            name,
            mesh: object,
            position: position || new THREE.Vector3(),
            rotation: new THREE.Euler(),
            scale: new THREE.Vector3(1, 1, 1)
          };

          this.addGameObject(gameObject);
          resolve(gameObject);
        },
        undefined,
        (error) => {
          console.error('Failed to load model:', error);
          reject(error);
        }
      );
    });
  }

  /**
   * Simple AABB collision detection
   */
  checkCollision(obj1: GameObject, obj2: GameObject): boolean {
    const box1 = new THREE.Box3().setFromObject(obj1.mesh);
    const box2 = new THREE.Box3().setFromObject(obj2.mesh);
    return box1.intersectsBox(box2);
  }

  /**
   * Update physics for all objects
   */
  private updatePhysics(deltaTime: number): void {
    if (!this.enablePhysics) return;

    this.gameObjects.forEach((obj) => {
      if (obj.velocity) {
        // Apply gravity
        obj.velocity.y -= this.gravity * deltaTime;

        // Update position
        obj.position.x += obj.velocity.x * deltaTime;
        obj.position.y += obj.velocity.y * deltaTime;
        obj.position.z += obj.velocity.z * deltaTime;

        // Sync with mesh
        obj.mesh.position.copy(obj.position);
      }
    });
  }

  /**
   * Check collisions between all objects
   */
  private checkCollisions(): void {
    const objects = this.getAllGameObjects();

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        if (this.checkCollision(objects[i], objects[j])) {
          // Call collision handlers
          objects[i].onCollision?.(objects[j]);
          objects[j].onCollision?.(objects[i]);
        }
      }
    }
  }

  /**
   * Game loop update
   */
  private update(): void {
    if (this.isPaused) return;

    const currentTime = this.clock.getElapsedTime();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update physics
    this.updatePhysics(deltaTime);

    // Update all game objects
    this.gameObjects.forEach((obj) => {
      obj.update?.(deltaTime);

      // Sync transform
      obj.mesh.position.copy(obj.position);
      obj.mesh.rotation.copy(obj.rotation);
      obj.mesh.scale.copy(obj.scale);
    });

    // Check collisions
    this.checkCollisions();

    // Custom update callback
    this.onUpdate?.(deltaTime);
  }

  /**
   * Render the scene
   */
  private render(): void {
    this.renderer.render(this.scene, this.camera);
    this.onRender?.();
  }

  /**
   * Main game loop
   */
  private gameLoop = (): void => {
    if (!this.isRunning) return;

    this.update();
    this.render();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  /**
   * Start the game engine
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    this.lastTime = 0;
    this.gameLoop();

    console.log('Game engine started');
  }

  /**
   * Stop the game engine
   */
  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('Game engine stopped');
  }

  /**
   * Pause the game
   */
  pause(): void {
    this.isPaused = true;
    this.clock.stop();
  }

  /**
   * Resume the game
   */
  resume(): void {
    this.isPaused = false;
    this.clock.start();
  }

  /**
   * Resize the renderer
   */
  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();

    // Dispose all game objects
    this.gameObjects.forEach((obj) => {
      this.scene.remove(obj.mesh);
    });
    this.gameObjects.clear();

    // Dispose renderer
    this.renderer.dispose();
  }
}
