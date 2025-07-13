import * as THREE from 'three';
import { RenderMode, ModelMaterial } from '../types/state';

export class MaterialManager {
  private static materials = new Map<string, THREE.Material>();
  
  static getMaterial(renderMode: RenderMode, config?: ModelMaterial): THREE.Material {
    const key = `${renderMode}_${JSON.stringify(config)}`;
    
    if (this.materials.has(key)) {
      return this.materials.get(key)!;
    }
    
    let material: THREE.Material;
    
    switch (renderMode) {
      case 'solid':
        material = this.createSolidMaterial(config);
        break;
      case 'wireframe':
        material = this.createWireframeMaterial(config);
        break;
      case 'rendered':
        material = this.createRenderedMaterial(config);
        break;
      case 'material':
        material = this.createMaterialPreviewMaterial(config);
        break;
      default:
        material = this.createSolidMaterial(config);
    }
    
    this.materials.set(key, material);
    return material;
  }

  /**
   * Apply materials to a complex 3D object hierarchy (for imported models)
   * This method traverses the object tree and applies materials correctly
   */
  static applyMaterialToObject(
    object: THREE.Object3D, 
    renderMode: RenderMode, 
    config?: ModelMaterial,
    originalMaterials?: (THREE.Material | THREE.Material[])[],
    isSelected: boolean = false
  ): void {
    if (!object) return;

    // If it's a selected object, use selection material regardless of render mode
    if (isSelected) {
      this.applySelectionMaterialToObject(object, renderMode);
      return;
    }

    // For unselected objects, check if we have original materials to restore
    if (originalMaterials && originalMaterials.length > 0) {
      // For 'rendered' mode, always use original materials
      if (renderMode === 'rendered') {
        this.restoreOriginalMaterials(object, originalMaterials);
        return;
      } else {
        // For other render modes, apply mode-specific materials but preserve original colors if possible
        this.applyRenderModeWithOriginalColors(object, renderMode, originalMaterials, config);
        return;
      }
    }

    // Fallback: For objects without original materials, apply override materials
    this.applyOverrideMaterialToObject(object, renderMode, config);
  }

  /**
   * Apply render mode materials while preserving original colors when possible
   */
  private static applyRenderModeWithOriginalColors(
    object: THREE.Object3D,
    renderMode: RenderMode,
    originalMaterials: (THREE.Material | THREE.Material[])[],
    config?: ModelMaterial
  ): void {
    let materialIndex = 0;
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && materialIndex < originalMaterials.length) {
        this.clearWireframeHelpers(child);
        
        const originalMaterial = originalMaterials[materialIndex];
        const firstOriginal = Array.isArray(originalMaterial) ? originalMaterial[0] : originalMaterial;
        
        // Extract color from original material
        const originalColor = (firstOriginal as any).color?.getHex() || 0x888888;
        const colorHex = '#' + originalColor.toString(16).padStart(6, '0');
        
        // Apply render mode with original color
        switch (renderMode) {
          case 'solid':
            child.material = new THREE.MeshLambertMaterial({
              color: colorHex,
              transparent: config?.transparent || false,
              opacity: config?.opacity || 1.0,
              wireframe: false
            });
            break;
            
          case 'wireframe':
            // For wireframe mode, apply base material with original color and add wireframe overlay
            child.material = new THREE.MeshBasicMaterial({
              color: colorHex,
              transparent: true,
              opacity: 0.1,
              side: THREE.DoubleSide
            });
            this.addWireframeHelper(child);
            break;
            
          case 'material':
            // Extract additional properties if available
            const originalRoughness = (firstOriginal as any).roughness || 0.3;
            const originalMetalness = (firstOriginal as any).metalness || 0.5;
            
            child.material = new THREE.MeshPhysicalMaterial({
              color: colorHex,
              roughness: originalRoughness,
              metalness: originalMetalness,
              clearcoat: 0.1,
              clearcoatRoughness: 0.1,
              transparent: config?.transparent || false,
              opacity: config?.opacity || 1.0,
              wireframe: false
            });
            break;
            
          default:
            // Fallback to solid
            child.material = new THREE.MeshLambertMaterial({
              color: colorHex,
              wireframe: false
            });
            break;
        }
        
        materialIndex++;
      }
    });
  }

  /**
   * Store original materials from an imported object for later restoration
   */
  static storeOriginalMaterials(object: THREE.Object3D): (THREE.Material | THREE.Material[])[] {
    const materials: (THREE.Material | THREE.Material[])[] = [];
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          materials.push(child.material.map(mat => mat.clone()));
        } else {
          materials.push(child.material.clone());
        }
      }
    });
    
    return materials;
  }

  /**
   * Restore original materials to an object hierarchy
   */
  private static restoreOriginalMaterials(
    object: THREE.Object3D, 
    originalMaterials: (THREE.Material | THREE.Material[])[]
  ): void {
    let materialIndex = 0;
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && materialIndex < originalMaterials.length) {
        const originalMaterial = originalMaterials[materialIndex];
        if (Array.isArray(originalMaterial)) {
          child.material = originalMaterial.map(mat => mat.clone());
        } else {
          child.material = originalMaterial.clone();
        }
        materialIndex++;
      }
    });
  }

  /**
   * Apply override materials to object hierarchy (solid, wireframe, material modes)
   */
  private static applyOverrideMaterialToObject(
    object: THREE.Object3D, 
    renderMode: RenderMode, 
    config?: ModelMaterial
  ): void {
    const material = this.getMaterial(renderMode, config);
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Clear any existing wireframe helpers
        this.clearWireframeHelpers(child);
        
        if (renderMode === 'wireframe') {
          // For wireframe mode, apply base material and add wireframe overlay
          child.material = new THREE.MeshBasicMaterial({
            color: config?.color || '#888888',
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
          });
          
          // Add wireframe overlay
          this.addWireframeHelper(child);
        } else {
          // For solid and material modes, apply material directly
          child.material = material.clone();
        }
      }
    });
  }

  /**
   * Apply selection materials to object hierarchy
   */
  private static applySelectionMaterialToObject(object: THREE.Object3D, renderMode: RenderMode): void {
    const selectionMaterial = this.getSelectionMaterial(renderMode);
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.clearWireframeHelpers(child);
        
        if (renderMode === 'wireframe') {
          child.material = new THREE.MeshBasicMaterial({
            color: '#6366f1',
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
          });
          
          // Add selection wireframe
          const wireframeGeometry = new THREE.WireframeGeometry(child.geometry);
          const wireframeMaterial = new THREE.LineBasicMaterial({ color: '#6366f1' });
          const wireframeHelper = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
          wireframeHelper.userData.isWireframeHelper = true;
          child.add(wireframeHelper);
        } else {
          child.material = selectionMaterial.clone();
        }
      }
    });
  }

  /**
   * Add wireframe helper to a mesh
   */
  private static addWireframeHelper(mesh: THREE.Mesh): void {
    const wireframeGeometry = new THREE.WireframeGeometry(mesh.geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: '#ffffff' });
    const wireframeHelper = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframeHelper.userData.isWireframeHelper = true;
    mesh.add(wireframeHelper);
  }

  /**
   * Clear wireframe helpers from a mesh
   */
  private static clearWireframeHelpers(mesh: THREE.Mesh): void {
    const helpersToRemove: THREE.Object3D[] = [];
    mesh.children.forEach(child => {
      if (child.userData.isWireframeHelper) {
        helpersToRemove.push(child);
      }
    });
    
    helpersToRemove.forEach(helper => {
      mesh.remove(helper);
      if (helper instanceof THREE.LineSegments) {
        helper.geometry.dispose();
        (helper.material as THREE.Material).dispose();
      }
    });
  }
  
  private static createSolidMaterial(config?: ModelMaterial): THREE.Material {
    return new THREE.MeshLambertMaterial({
      color: config?.color || '#888888',
      transparent: config?.transparent || false,
      opacity: config?.opacity || 1.0,
      wireframe: false
    });
  }
  
  private static createWireframeMaterial(config?: ModelMaterial): THREE.Material {
    return new THREE.MeshBasicMaterial({
      color: config?.color || '#ffffff',
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
  }
  
  private static createRenderedMaterial(config?: ModelMaterial): THREE.Material {
    return new THREE.MeshStandardMaterial({
      color: config?.color || '#888888',
      roughness: config?.roughness || 0.7,
      metalness: config?.metalness || 0.1,
      transparent: config?.transparent || false,
      opacity: config?.opacity || 1.0,
      wireframe: false
    });
  }
  
  private static createMaterialPreviewMaterial(config?: ModelMaterial): THREE.Material {
    return new THREE.MeshPhysicalMaterial({
      color: config?.color || '#888888',
      roughness: config?.roughness || 0.3,
      metalness: config?.metalness || 0.5,
      clearcoat: 0.1,
      clearcoatRoughness: 0.1,
      transparent: config?.transparent || false,
      opacity: config?.opacity || 1.0,
      wireframe: false
    });
  }
  
  static getSelectionMaterial(renderMode: RenderMode): THREE.Material {
    if (renderMode === 'wireframe') {
      return new THREE.MeshBasicMaterial({
        color: '#6366f1',
        wireframe: true,
        transparent: true,
        opacity: 1.0
      });
    }
    
    return new THREE.MeshStandardMaterial({
      color: '#6366f1',
      roughness: 0.4,
      metalness: 0.2,
      emissive: '#1e40af',
      emissiveIntensity: 0.2,
      wireframe: false
    });
  }
  
  static getHoverMaterial(renderMode: RenderMode): THREE.Material {
    if (renderMode === 'wireframe') {
      return new THREE.MeshBasicMaterial({
        color: '#f59e0b',
        wireframe: true,
        transparent: true,
        opacity: 0.9
      });
    }
    
    return new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      roughness: 0.4,
      metalness: 0.2,
      emissive: '#d97706',
      emissiveIntensity: 0.15,
      wireframe: false
    });
  }
  
  static clearCache(): void {
    this.materials.forEach(material => material.dispose());
    this.materials.clear();
  }
  
  static disposeMaterial(renderMode: RenderMode, config?: ModelMaterial): void {
    const key = `${renderMode}_${JSON.stringify(config)}`;
    const material = this.materials.get(key);
    if (material) {
      material.dispose();
      this.materials.delete(key);
    }
  }
}

export default MaterialManager;