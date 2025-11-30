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
      case 'parts':
        material = this.createPartsMaterial(config);
        break;
      case 'skeleton':
        material = this.createSkeletonMaterial(config);
        break;
      default:
        material = this.createSolidMaterial(config);
    }
    
    this.materials.set(key, material);
    return material;
  }

  /**
   * Ensure all geometries in an object have proper normals for lighting
   */
  static ensureNormals(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry;
        
        // Check if geometry has normals attribute
        if (!geometry.attributes.normal) {
          console.log('Computing missing normals for geometry');
          geometry.computeVertexNormals();
        } else {
          // Check if normals are all zero (invalid)
          const normals = geometry.attributes.normal.array;
          let hasValidNormals = false;
          for (let i = 0; i < normals.length; i += 3) {
            const x = normals[i];
            const y = normals[i + 1];
            const z = normals[i + 2];
            if (x !== 0 || y !== 0 || z !== 0) {
              hasValidNormals = true;
              break;
            }
          }
          
          if (!hasValidNormals) {
            console.log('Recomputing invalid normals for geometry');
            geometry.computeVertexNormals();
          }
        }
      }
    });
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
    isSelected: boolean = false,
    modelData?: { skeleton?: any; parts?: any },
    doubleSided: boolean = false
  ): void {
    if (!object) return;

    // Ensure geometries have proper normals before applying lighting-dependent materials
    if (renderMode === 'solid' || renderMode === 'rendered' || renderMode === 'material') {
      this.ensureNormals(object);
    }

    // If it's a selected object, use selection material regardless of render mode
    if (isSelected) {
      this.applySelectionMaterialToObject(object, renderMode, doubleSided);
      return;
    }

    // Handle special render modes first
    if (renderMode === 'parts' && modelData?.parts?.hasParts) {
      this.applyPartsMaterialToObject(object, modelData.parts, doubleSided);
      return;
    }

    if (renderMode === 'skeleton' && modelData?.skeleton) {
      this.applySkeletonMaterialToObject(object, modelData.skeleton, originalMaterials, config, doubleSided);
      return;
    }

    // For unselected objects, check if we have original materials to restore
    if (originalMaterials && originalMaterials.length > 0) {
      // For 'rendered' mode, always use original materials
      if (renderMode === 'rendered') {
        this.restoreOriginalMaterials(object, originalMaterials, doubleSided);
        return;
      } else {
        // For other render modes, apply mode-specific materials but preserve original colors if possible
        this.applyRenderModeWithOriginalColors(object, renderMode, originalMaterials, config, doubleSided);
        return;
      }
    }

    // Fallback: For objects without original materials, apply override materials
    this.applyOverrideMaterialToObject(object, renderMode, config, doubleSided);
  }

  /**
   * Apply render mode materials while preserving original colors when possible
   */
  private static applyRenderModeWithOriginalColors(
    object: THREE.Object3D,
    renderMode: RenderMode,
    originalMaterials: (THREE.Material | THREE.Material[])[],
    config?: ModelMaterial,
    doubleSided: boolean = false
  ): void {
    let materialIndex = 0;
    
    // Clear any existing helpers first
    this.clearAllHelpers(object);
    
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
              wireframe: false,
              side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
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
              wireframe: false,
              side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
            });
            break;

          case 'parts':
            // Parts mode is handled separately in applyPartsMaterialToObject
            // This won't be called for parts mode
            child.material = new THREE.MeshLambertMaterial({
              color: colorHex,
              wireframe: false,
              side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
            });
            break;

          case 'skeleton':
            // For skeleton mode, make mesh transparent
            child.material = new THREE.MeshBasicMaterial({
              color: colorHex,
              transparent: true,
              opacity: 0.3,
              wireframe: false,
              side: THREE.DoubleSide
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
    originalMaterials: (THREE.Material | THREE.Material[])[],
    doubleSided: boolean = false
  ): void {
    let materialIndex = 0;
    
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material && materialIndex < originalMaterials.length) {
        const originalMaterial = originalMaterials[materialIndex];
        if (Array.isArray(originalMaterial)) {
          child.material = originalMaterial.map(mat => {
            const cloned = mat.clone();
            if (doubleSided) cloned.side = THREE.DoubleSide;
            return cloned;
          });
        } else {
          const cloned = originalMaterial.clone();
          if (doubleSided) cloned.side = THREE.DoubleSide;
          child.material = cloned;
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
    config?: ModelMaterial,
    doubleSided: boolean = false
  ): void {
    const material = this.getMaterial(renderMode, config);
    
    // Clear any existing helpers first
    this.clearAllHelpers(object);
    
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
          const cloned = material.clone();
          if (doubleSided) cloned.side = THREE.DoubleSide;
          child.material = cloned;
        }
      }
    });
  }

  /**
   * Apply selection materials to object hierarchy
   */
  private static applySelectionMaterialToObject(object: THREE.Object3D, renderMode: RenderMode, doubleSided: boolean = false): void {
    const selectionMaterial = this.getSelectionMaterial(renderMode);
    
    // Clear any existing helpers first
    this.clearAllHelpers(object);
    
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
          const cloned = selectionMaterial.clone();
          if (doubleSided) cloned.side = THREE.DoubleSide;
          child.material = cloned;
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

  /**
   * Clear all render mode helpers (wireframe, skeleton) from object
   */
  static clearAllHelpers(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.clearWireframeHelpers(child);
      }
    });
    this.clearSkeletonHelpers(object);
  }

  /**
   * Apply different colors to each mesh group for parts visualization
   */
  private static applyPartsMaterialToObject(object: THREE.Object3D, partsData: any, doubleSided: boolean = false): void {
    // Predefined colors for different parts
    const partColors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#feca57', '#ff9ff3',
      '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#10ac84',
      '#ee5a24', '#0abde3', '#3742fa', '#f368e0', '#feca57'
    ];

    // If we have mesh groups defined
    if (partsData.meshGroups && partsData.meshGroups.length > 0) {
      partsData.meshGroups.forEach((group: any, groupIndex: number) => {
        const color = partColors[groupIndex % partColors.length];
        group.meshes.forEach((mesh: THREE.Mesh) => {
          if (mesh) {
            mesh.material = new THREE.MeshLambertMaterial({
              color: color,
              transparent: false,
              opacity: 1.0,
              wireframe: false,
              side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
            });
          }
        });
      });
    } else {
      // Fallback: assign colors based on mesh hierarchy
      let meshIndex = 0;
      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const color = partColors[meshIndex % partColors.length];
          child.material = new THREE.MeshLambertMaterial({
            color: color,
            transparent: false,
            opacity: 1.0,
            wireframe: false,
            side: doubleSided ? THREE.DoubleSide : THREE.FrontSide
          });
          meshIndex++;
        }
      });
    }
  }

  /**
   * Apply skeleton visualization with transparent mesh and bone helpers
   */
  private static applySkeletonMaterialToObject(
    object: THREE.Object3D, 
    skeletonData: any,
    originalMaterials?: (THREE.Material | THREE.Material[])[],
    config?: ModelMaterial,
    doubleSided: boolean = false
  ): void {
    console.log('[Skeleton Mode] Applying skeleton visualization:', skeletonData);
    
    // First, make all meshes transparent
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.clearWireframeHelpers(child);
        
        // Apply transparent material to show skeleton through mesh
        child.material = new THREE.MeshBasicMaterial({
          color: config?.color || '#888888',
          transparent: true,
          opacity: 0.15,
          wireframe: false,
          side: THREE.DoubleSide
        });
      }
    });

    // Clear any existing skeleton helpers first
    this.clearSkeletonHelpers(object);

    // Add skeleton visualization if bones are available
    if (skeletonData.bones && skeletonData.bones.length > 0) {
      console.log(`[Skeleton Mode] Found ${skeletonData.bones.length} bones:`, 
        skeletonData.bones.map((b: any) => b.name || b.bone?.name || 'unnamed'));
      this.addSkeletonHelpers(object, skeletonData.bones);
    } else {
      console.warn('[Skeleton Mode] No bones found in skeleton data');
    }
  }

  /**
   * Add skeleton helpers to visualize bones and joints
   */
  private static addSkeletonHelpers(object: THREE.Object3D, bones: any[]): void {
    // Remove existing skeleton helpers
    this.clearSkeletonHelpers(object);

    if (!bones || bones.length === 0) return;

    bones.forEach((boneData, index) => {
      // Handle both old format (direct bone objects) and new format (bone data objects)
      const bone = boneData.bone || boneData;
      const worldPosition = boneData.worldPosition || boneData.position;
      const name = boneData.name || bone.name || `Bone_${index}`;
      const parent = boneData.parent || (bone.parent && (bone.parent.type === 'Bone' || bone.parent.isBone) ? bone.parent : null);

      if (!worldPosition) return;

      // Create bone joint sphere
      const jointGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const jointMaterial = new THREE.MeshBasicMaterial({ 
        color: '#ff6600',
        depthTest: false,
        transparent: true,
        opacity: 0.8
      });
      const jointSphere = new THREE.Mesh(jointGeometry, jointMaterial);
      
      // Convert world position to local position relative to the model object
      const localPosition = new THREE.Vector3();
      object.worldToLocal(localPosition.copy(worldPosition));
      jointSphere.position.copy(localPosition);
      jointSphere.userData.isSkeletonHelper = true;
      jointSphere.userData.boneName = name;
      object.add(jointSphere);

      // Create connection line to parent bone
      if (parent) {
        // Find parent bone data
        const parentBoneData = bones.find(b => (b.bone || b) === parent);
        if (parentBoneData) {
          const parentWorldPosition = parentBoneData.worldPosition || parentBoneData.position;
          if (parentWorldPosition) {
            // Convert both positions to local space
            const parentLocalPosition = new THREE.Vector3();
            object.worldToLocal(parentLocalPosition.copy(parentWorldPosition));
            
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
              localPosition,
              parentLocalPosition
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({ 
              color: '#ffaa00',
              depthTest: false,
              transparent: true,
              opacity: 0.7
            });
            const boneLine = new THREE.Line(lineGeometry, lineMaterial);
            boneLine.userData.isSkeletonHelper = true;
            boneLine.userData.connectionFrom = name;
            boneLine.userData.connectionTo = parentBoneData.name || parent.name;
            object.add(boneLine);
          }
        }
      }
    });
  }

  /**
   * Clear skeleton helpers from object
   */
  private static clearSkeletonHelpers(object: THREE.Object3D): void {
    const helpersToRemove: THREE.Object3D[] = [];
    object.children.forEach(child => {
      if (child.userData.isSkeletonHelper) {
        helpersToRemove.push(child);
      }
    });
    
    helpersToRemove.forEach(helper => {
      object.remove(helper);
      if (helper instanceof THREE.Mesh || helper instanceof THREE.Line) {
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

  private static createPartsMaterial(config?: ModelMaterial): THREE.Material {
    return new THREE.MeshLambertMaterial({
      color: config?.color || '#888888',
      transparent: false,
      opacity: 1.0,
      wireframe: false
    });
  }

  private static createSkeletonMaterial(config?: ModelMaterial): THREE.Material {
    return new THREE.MeshBasicMaterial({
      color: config?.color || '#888888',
      transparent: true,
      opacity: 0.3,
      wireframe: false,
      side: THREE.DoubleSide
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