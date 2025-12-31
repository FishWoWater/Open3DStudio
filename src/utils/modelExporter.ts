import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { LoadedModel } from '../types/state';

export interface ExportOptions {
  format: 'glb' | 'gltf';
  binary: boolean;
  includeAnimations: boolean;
}

/**
 * Utility class for exporting 3D models and scenes
 * Supports exporting to game-ready formats like GLB/GLTF
 */
export class ModelExporter {
  private static exporter: GLTFExporter | null = null;

  private static getExporter(): GLTFExporter {
    if (!this.exporter) {
      this.exporter = new GLTFExporter();
    }
    return this.exporter;
  }

  /**
   * Export a single model to GLB/GLTF format
   */
  static async exportModel(
    model: LoadedModel,
    options: Partial<ExportOptions> = {}
  ): Promise<Blob> {
    const { format = 'glb', binary = true, includeAnimations = true } = options;

    if (!model.object3D) {
      throw new Error('Model has no 3D object to export');
    }

    const exporter = this.getExporter();

    return new Promise((resolve, reject) => {
      const exportOptions = {
        binary: format === 'glb' || binary,
        animations: includeAnimations ? model.object3D?.animations || [] : [],
        includeCustomExtensions: false,
      };

      exporter.parse(
        model.object3D,
        (result) => {
          let blob: Blob;
          if (result instanceof ArrayBuffer) {
            blob = new Blob([result], { type: 'model/gltf-binary' });
          } else {
            const jsonString = JSON.stringify(result, null, 2);
            blob = new Blob([jsonString], { type: 'model/gltf+json' });
          }
          resolve(blob);
        },
        (error) => {
          reject(new Error(`Export failed: ${error.message || error}`));
        },
        exportOptions
      );
    });
  }

  /**
   * Export multiple models as a single scene
   */
  static async exportScene(
    models: LoadedModel[],
    options: Partial<ExportOptions> = {}
  ): Promise<Blob> {
    const { format = 'glb', binary = true, includeAnimations = true } = options;

    if (models.length === 0) {
      throw new Error('No models to export');
    }

    // Create a scene containing all models
    const scene = new THREE.Scene();
    const animations: THREE.AnimationClip[] = [];

    models.forEach((model) => {
      if (model.object3D) {
        // Clone the object to avoid modifying the original
        const clone = model.object3D.clone();
        
        // Apply the model's transform
        clone.position.set(...model.position);
        clone.rotation.set(...model.rotation);
        clone.scale.set(...model.scale);
        
        scene.add(clone);

        // Collect animations
        if (includeAnimations && model.object3D.animations) {
          animations.push(...model.object3D.animations);
        }
      }
    });

    const exporter = this.getExporter();

    return new Promise((resolve, reject) => {
      const exportOptions = {
        binary: format === 'glb' || binary,
        animations: animations,
        includeCustomExtensions: false,
      };

      exporter.parse(
        scene,
        (result) => {
          let blob: Blob;
          if (result instanceof ArrayBuffer) {
            blob = new Blob([result], { type: 'model/gltf-binary' });
          } else {
            const jsonString = JSON.stringify(result, null, 2);
            blob = new Blob([jsonString], { type: 'model/gltf+json' });
          }
          resolve(blob);
        },
        (error) => {
          reject(new Error(`Scene export failed: ${error.message || error}`));
        },
        exportOptions
      );
    });
  }

  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export and download a single model
   */
  static async exportAndDownloadModel(
    model: LoadedModel,
    filename?: string,
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const format = options.format || 'glb';
    const blob = await this.exportModel(model, options);
    const name = filename || `${model.name || 'model'}.${format}`;
    this.downloadBlob(blob, name);
  }

  /**
   * Export and download a scene containing multiple models
   */
  static async exportAndDownloadScene(
    models: LoadedModel[],
    filename?: string,
    options: Partial<ExportOptions> = {}
  ): Promise<void> {
    const format = options.format || 'glb';
    const blob = await this.exportScene(models, options);
    const name = filename || `scene.${format}`;
    this.downloadBlob(blob, name);
  }

  /**
   * Get file extension for format
   */
  static getExtension(format: 'glb' | 'gltf'): string {
    return format;
  }

  /**
   * Get MIME type for format
   */
  static getMimeType(format: 'glb' | 'gltf'): string {
    return format === 'glb' ? 'model/gltf-binary' : 'model/gltf+json';
  }
}

export default ModelExporter;
