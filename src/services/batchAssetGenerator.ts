/**
 * Batch Asset Generation Service
 * Automatically generates all required 3D assets for a game
 * Uses existing API client - no additional dependencies
 */

import { getApiClient } from '../api/client';
import { GameGenre, GameProject } from '../types/state';
import { indexedDBStorage, StoredAsset } from './indexedDBStorage';

export interface AssetRequirement {
  name: string;
  prompt: string;
  type: 'character' | 'environment' | 'prop' | 'collectible';
  priority: 'critical' | 'high' | 'medium' | 'low';
  needsRig?: boolean;
  needsOptimization?: boolean;
}

export interface GeneratedAsset {
  id: string;
  name: string;
  type: AssetRequirement['type'];
  meshId: string;
  glbUrl: string;
  thumbnailUrl?: string;
  metadata: {
    vertices: number;
    triangles: number;
    hasRig: boolean;
    hasTextures: boolean;
  };
}

export interface GenerationProgress {
  stage: string;
  current: number;
  total: number;
  assetName?: string;
}

/**
 * Asset templates for each game genre
 */
const ASSET_TEMPLATES: Record<GameGenre, AssetRequirement[]> = {
  platformer: [
    {
      name: 'Player Character',
      prompt: 'cute cube character with big eyes, low-poly game character, friendly appearance, colorful',
      type: 'character',
      priority: 'critical',
      needsRig: true,
      needsOptimization: true
    },
    {
      name: 'Main Platform',
      prompt: 'simple geometric platform, low-poly, game-ready, clean edges, flat top surface',
      type: 'environment',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Collectible Coin',
      prompt: 'shiny gold coin, low-poly, game collectible, simple geometry',
      type: 'collectible',
      priority: 'high',
      needsOptimization: true
    },
    {
      name: 'Background Tree',
      prompt: 'stylized low-poly tree, simple geometric shapes, colorful',
      type: 'environment',
      priority: 'medium',
      needsOptimization: true
    }
  ],
  shooter: [
    {
      name: 'Player Spaceship',
      prompt: 'futuristic player spaceship, sleek design, low-poly, game-ready',
      type: 'character',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Enemy Ship',
      prompt: 'alien enemy spacecraft, menacing design, low-poly',
      type: 'character',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Energy Bullet',
      prompt: 'energy bullet projectile, glowing, simple geometry',
      type: 'prop',
      priority: 'high',
      needsOptimization: true
    }
  ],
  puzzle: [
    {
      name: 'Puzzle Piece',
      prompt: 'geometric puzzle piece, colorful, low-poly',
      type: 'prop',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Puzzle Board',
      prompt: 'puzzle game board, grid pattern, clean design',
      type: 'environment',
      priority: 'critical',
      needsOptimization: true
    }
  ],
  arcade: [
    {
      name: 'Snake Head',
      prompt: 'snake head, cute design, low-poly, game character',
      type: 'character',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Food Pellet',
      prompt: 'glowing food pellet, simple sphere, colorful',
      type: 'collectible',
      priority: 'high',
      needsOptimization: true
    }
  ],
  racing: [
    {
      name: 'Race Car',
      prompt: 'futuristic race car, sleek design, low-poly',
      type: 'character',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Race Track',
      prompt: 'race track section, road with barriers, low-poly',
      type: 'environment',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Obstacle Cone',
      prompt: 'traffic cone obstacle, simple geometry',
      type: 'prop',
      priority: 'high',
      needsOptimization: true
    }
  ],
  adventure: [
    {
      name: 'Hero Character',
      prompt: 'adventure hero character, low-poly, game-ready',
      type: 'character',
      priority: 'critical',
      needsRig: true,
      needsOptimization: true
    },
    {
      name: 'Treasure Chest',
      prompt: 'treasure chest, medieval style, low-poly',
      type: 'prop',
      priority: 'high',
      needsOptimization: true
    },
    {
      name: 'Key Item',
      prompt: 'golden key, simple design, game collectible',
      type: 'collectible',
      priority: 'high',
      needsOptimization: true
    },
    {
      name: 'Dungeon Wall',
      prompt: 'dungeon wall section, stone texture, low-poly',
      type: 'environment',
      priority: 'medium',
      needsOptimization: true
    }
  ]
};

export class BatchAssetGenerator {
  private apiClient = getApiClient();
  private onProgress?: (progress: GenerationProgress) => void;

  constructor(progressCallback?: (progress: GenerationProgress) => void) {
    this.onProgress = progressCallback;
  }

  /**
   * Generate all assets for a game project
   */
  async generateGameAssets(
    project: GameProject,
    customRequirements?: AssetRequirement[]
  ): Promise<GeneratedAsset[]> {
    const requirements = customRequirements || ASSET_TEMPLATES[project.genre] || [];

    console.log(`Starting batch generation for ${requirements.length} assets`);

    const generatedAssets: GeneratedAsset[] = [];

    // Sort by priority
    const sortedRequirements = this.sortByPriority(requirements);

    for (let i = 0; i < sortedRequirements.length; i++) {
      const requirement = sortedRequirements[i];

      this.reportProgress('Generating assets', i + 1, sortedRequirements.length, requirement.name);

      try {
        const asset = await this.generateSingleAsset(requirement, project.id);
        generatedAssets.push(asset);

        // Save to IndexedDB
        await this.saveAssetToStorage(asset, project.id);

        console.log(`✓ Generated ${requirement.name}`);
      } catch (error) {
        console.error(`✗ Failed to generate ${requirement.name}:`, error);
        // Continue with other assets
      }
    }

    return generatedAssets;
  }

  /**
   * Generate a single asset with all optimizations
   */
  private async generateSingleAsset(
    requirement: AssetRequirement,
    projectId: string
  ): Promise<GeneratedAsset> {
    // Step 1: Generate base mesh
    this.reportProgress('Generating mesh', 1, 4, requirement.name);
    const meshResult = await this.apiClient.generateMesh({
      prompt: requirement.prompt,
      target: 'game-asset'
    });

    let currentMeshId = meshResult.id;

    // Step 2: Auto-rig if needed
    if (requirement.needsRig) {
      this.reportProgress('Rigging character', 2, 4, requirement.name);
      const rigResult = await this.apiClient.autoRig({
        meshId: currentMeshId
      });
      currentMeshId = rigResult.id;
    }

    // Step 3: Optimize if needed
    if (requirement.needsOptimization) {
      this.reportProgress('Optimizing for game', 3, 4, requirement.name);

      // Retopology to reduce poly count
      const retopoResult = await this.apiClient.retopologyMesh({
        meshId: currentMeshId,
        targetFaceCount: this.getTargetPolyCount(requirement.type)
      });
      currentMeshId = retopoResult.id;

      // UV unwrap for textures
      const unwrapResult = await this.apiClient.unwrapMesh({
        meshId: currentMeshId
      });
      currentMeshId = unwrapResult.id;
    }

    // Step 4: Get final mesh data
    this.reportProgress('Finalizing', 4, 4, requirement.name);
    const finalMesh = await this.apiClient.getMesh(currentMeshId);

    return {
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: requirement.name,
      type: requirement.type,
      meshId: currentMeshId,
      glbUrl: finalMesh.glbUrl,
      thumbnailUrl: finalMesh.thumbnailUrl,
      metadata: {
        vertices: finalMesh.vertexCount || 0,
        triangles: finalMesh.triangleCount || 0,
        hasRig: requirement.needsRig || false,
        hasTextures: true
      }
    };
  }

  /**
   * Save asset to IndexedDB
   */
  private async saveAssetToStorage(asset: GeneratedAsset, projectId: string): Promise<void> {
    try {
      // Fetch GLB data
      const response = await fetch(asset.glbUrl);
      const arrayBuffer = await response.arrayBuffer();

      const storedAsset: StoredAsset = {
        id: asset.id,
        name: asset.name,
        type: 'glb',
        data: arrayBuffer,
        metadata: {
          size: arrayBuffer.byteLength,
          createdAt: new Date(),
          projectId,
          tags: [asset.type, 'generated']
        }
      };

      await indexedDBStorage.saveAsset(storedAsset);
      console.log(`Saved ${asset.name} to IndexedDB (${this.formatBytes(arrayBuffer.byteLength)})`);
    } catch (error) {
      console.error(`Failed to save asset to storage:`, error);
    }
  }

  /**
   * Get target poly count based on asset type
   */
  private getTargetPolyCount(type: AssetRequirement['type']): number {
    switch (type) {
      case 'character':
        return 5000; // Higher detail for characters
      case 'environment':
        return 3000;
      case 'prop':
        return 1000;
      case 'collectible':
        return 500; // Very simple
      default:
        return 2000;
    }
  }

  /**
   * Sort requirements by priority
   */
  private sortByPriority(requirements: AssetRequirement[]): AssetRequirement[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...requirements].sort((a, b) =>
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }

  /**
   * Report progress
   */
  private reportProgress(stage: string, current: number, total: number, assetName?: string): void {
    this.onProgress?.({ stage, current, total, assetName });
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get asset requirements for a genre
   */
  static getRequirementsForGenre(genre: GameGenre): AssetRequirement[] {
    return ASSET_TEMPLATES[genre] || [];
  }

  /**
   * Estimate generation time
   */
  static estimateGenerationTime(requirements: AssetRequirement[]): number {
    // Rough estimate: 30s per asset + 20s extra for rigging + 15s for optimization
    let totalSeconds = 0;

    requirements.forEach(req => {
      totalSeconds += 30; // Base generation
      if (req.needsRig) totalSeconds += 20;
      if (req.needsOptimization) totalSeconds += 15;
    });

    return totalSeconds;
  }
}
