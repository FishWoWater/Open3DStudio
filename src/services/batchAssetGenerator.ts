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
  ],
  rpg: [
    {
      name: 'RPG Hero',
      prompt: 'fantasy hero character, low-poly, game-ready, medieval armor',
      type: 'character',
      priority: 'critical',
      needsRig: true,
      needsOptimization: true
    },
    {
      name: 'Enemy Monster',
      prompt: 'fantasy monster enemy, low-poly, menacing appearance',
      type: 'character',
      priority: 'high',
      needsOptimization: true
    },
    {
      name: 'Health Potion',
      prompt: 'health potion bottle, glowing red, low-poly',
      type: 'collectible',
      priority: 'high',
      needsOptimization: true
    }
  ],
  simulation: [
    {
      name: 'Building Block',
      prompt: 'simple building block, modular, low-poly',
      type: 'environment',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Resource Item',
      prompt: 'generic resource item, low-poly, game collectible',
      type: 'collectible',
      priority: 'high',
      needsOptimization: true
    }
  ],
  educational: [
    {
      name: 'Interactive Object',
      prompt: 'colorful educational object, low-poly, friendly design',
      type: 'prop',
      priority: 'critical',
      needsOptimization: true
    },
    {
      name: 'Character Guide',
      prompt: 'friendly cartoon character, low-poly, educational mascot',
      type: 'character',
      priority: 'high',
      needsRig: true,
      needsOptimization: true
    }
  ],
  other: [
    {
      name: 'Generic Character',
      prompt: 'simple character, low-poly, game-ready',
      type: 'character',
      priority: 'critical',
      needsRig: true,
      needsOptimization: true
    },
    {
      name: 'Generic Object',
      prompt: 'simple geometric object, low-poly',
      type: 'prop',
      priority: 'high',
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
    // Step 1: Generate base mesh using text-to-textured-mesh
    this.reportProgress('Generating mesh', 1, 4, requirement.name);
    const meshResult = await this.apiClient.textToTexturedMesh({
      text_prompt: requirement.prompt,
      output_format: 'glb'
    });

    // Get job ID to poll for completion
    const currentJobId = meshResult.job_id;
    
    if (!currentJobId) {
      throw new Error(`Failed to start mesh generation for ${requirement.name}`);
    }

    // Poll for job completion
    let jobInfo = await this.apiClient.getJobStatus(currentJobId);
    while (jobInfo.status !== 'completed' && jobInfo.status !== 'failed') {
      await this.delay(2000);
      jobInfo = await this.apiClient.getJobStatus(currentJobId);
    }

    if (jobInfo.status === 'failed') {
      throw new Error(`Mesh generation failed for ${requirement.name}`);
    }

    let currentMeshFileId = (jobInfo as any).result_file_id;

    // Step 2: Auto-rig if needed
    if (requirement.needsRig && currentMeshFileId) {
      this.reportProgress('Rigging character', 2, 4, requirement.name);
      const rigResult = await this.apiClient.generateRig({
        mesh_file_id: currentMeshFileId,
        rig_mode: 'full',
        output_format: 'glb'
      });
      
      if (rigResult.job_id) {
        // Poll for rig completion
        let rigJob = await this.apiClient.getJobStatus(rigResult.job_id);
        while (rigJob.status !== 'completed' && rigJob.status !== 'failed') {
          await this.delay(2000);
          rigJob = await this.apiClient.getJobStatus(rigResult.job_id);
        }
        
        if (rigJob.status === 'completed' && (rigJob as any).result_file_id) {
          currentMeshFileId = (rigJob as any).result_file_id;
        }
      }
    }

    // Step 3: Optimize if needed
    if (requirement.needsOptimization && currentMeshFileId) {
      this.reportProgress('Optimizing for game', 3, 4, requirement.name);

      // Retopology to reduce poly count
      const retopoResult = await this.apiClient.retopologizeMesh({
        mesh_file_id: currentMeshFileId,
        target_vertex_count: this.getTargetPolyCount(requirement.type),
        poly_type: 'tri',
        output_format: 'glb'
      });
      
      if (retopoResult.job_id) {
        // Poll for retopology completion
        let retopoJob = await this.apiClient.getJobStatus(retopoResult.job_id);
        while (retopoJob.status !== 'completed' && retopoJob.status !== 'failed') {
          await this.delay(2000);
          retopoJob = await this.apiClient.getJobStatus(retopoResult.job_id);
        }
        
        if (retopoJob.status === 'completed' && (retopoJob as any).result_file_id) {
          currentMeshFileId = (retopoJob as any).result_file_id;
        }
      }

      // UV unwrap for textures
      const unwrapResult = await this.apiClient.unwrapMeshUV({
        mesh_file_id: currentMeshFileId,
        output_format: 'glb'
      });
      
      if (unwrapResult.job_id) {
        // Poll for UV unwrap completion
        let unwrapJob = await this.apiClient.getJobStatus(unwrapResult.job_id);
        while (unwrapJob.status !== 'completed' && unwrapJob.status !== 'failed') {
          await this.delay(2000);
          unwrapJob = await this.apiClient.getJobStatus(unwrapResult.job_id);
        }
        
        if (unwrapJob.status === 'completed' && (unwrapJob as any).result_file_id) {
          currentMeshFileId = (unwrapJob as any).result_file_id;
        }
      }
    }

    // Step 4: Get final mesh data
    this.reportProgress('Finalizing', 4, 4, requirement.name);
    const finalMeshInfo = currentMeshFileId 
      ? await this.apiClient.getJobResultInfo(currentJobId)
      : null;

    return {
      id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: requirement.name,
      type: requirement.type,
      meshId: currentMeshFileId || currentJobId,
      glbUrl: currentMeshFileId ? `/api/v1/system/jobs/${currentJobId}/download` : '',
      thumbnailUrl: (finalMeshInfo as any)?.thumbnail_url,
      metadata: {
        vertices: (finalMeshInfo as any)?.vertex_count || 0,
        triangles: (finalMeshInfo as any)?.triangle_count || 0,
        hasRig: requirement.needsRig || false,
        hasTextures: true
      }
    };
  }

  /**
   * Delay helper for polling
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
