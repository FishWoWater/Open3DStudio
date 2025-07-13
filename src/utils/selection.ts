import * as THREE from 'three';
import { LoadedModel } from '../types/state';

export interface RaycastResult {
  object: THREE.Object3D;
  point: THREE.Vector3;
  distance: number;
  face?: any;
  faceIndex?: number;
  modelId?: string;
}

export class SelectionManager {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  
  // Convert screen coordinates to normalized device coordinates
  private screenToNDC(
    clientX: number, 
    clientY: number, 
    element: HTMLElement
  ): THREE.Vector2 {
    const rect = element.getBoundingClientRect();
    
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    
    return this.mouse;
  }
  
  // Perform raycast from camera through mouse position
  raycastFromCamera(
    camera: THREE.Camera,
    mouseX: number,
    mouseY: number,
    canvasElement: HTMLElement,
    objects: THREE.Object3D[]
  ): RaycastResult[] {
    const ndc = this.screenToNDC(mouseX, mouseY, canvasElement);
    
    this.raycaster.setFromCamera(ndc, camera);
    const intersects = this.raycaster.intersectObjects(objects, true);
    
    return intersects.map(intersect => ({
      object: intersect.object,
      point: intersect.point,
      distance: intersect.distance,
      face: intersect.face,
      faceIndex: intersect.faceIndex,
      modelId: this.findModelId(intersect.object)
    }));
  }
  
  // Find the model ID by traversing up the object hierarchy
  private findModelId(object: THREE.Object3D): string | undefined {
    let current = object;
    while (current) {
      if (current.userData && current.userData.modelId) {
        return current.userData.modelId;
      }
      current = current.parent!;
    }
    return undefined;
  }
  
  // Get the closest intersection result
  getClosestIntersection(
    camera: THREE.Camera,
    mouseX: number,
    mouseY: number,
    canvasElement: HTMLElement,
    objects: THREE.Object3D[]
  ): RaycastResult | null {
    const results = this.raycastFromCamera(camera, mouseX, mouseY, canvasElement, objects);
    return results.length > 0 ? results[0] : null;
  }
  
  // Check if a point is within a bounding box (for selection area)
  isPointInBoundingBox(
    point: THREE.Vector3,
    box: THREE.Box3
  ): boolean {
    return box.containsPoint(point);
  }
  
  // Get objects within a selection rectangle
  getObjectsInSelectionBox(
    camera: THREE.Camera,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    canvasElement: HTMLElement,
    objects: THREE.Object3D[]
  ): RaycastResult[] {
    const selectedObjects: RaycastResult[] = [];
    
    // Create multiple rays across the selection area
    const steps = 10;
    for (let x = 0; x <= steps; x++) {
      for (let y = 0; y <= steps; y++) {
        const mouseX = startX + (endX - startX) * (x / steps);
        const mouseY = startY + (endY - startY) * (y / steps);
        
        const results = this.raycastFromCamera(camera, mouseX, mouseY, canvasElement, objects);
        results.forEach(result => {
          // Avoid duplicates
          if (!selectedObjects.find(obj => obj.object === result.object)) {
            selectedObjects.push(result);
          }
        });
      }
    }
    
    return selectedObjects;
  }
  
  // Calculate selection bounds in world space
  getWorldSpaceBounds(models: LoadedModel[]): THREE.Box3 {
    const box = new THREE.Box3();
    
    models.forEach(model => {
      if (model.object3D && model.visible) {
        const modelBox = new THREE.Box3().setFromObject(model.object3D);
        box.union(modelBox);
      }
    });
    
    return box;
  }
  
  // Get center point of selected objects
  getSelectionCenter(models: LoadedModel[]): THREE.Vector3 {
    const selectedModels = models.filter(m => m.selected);
    if (selectedModels.length === 0) return new THREE.Vector3();
    
    const center = new THREE.Vector3();
    selectedModels.forEach(model => {
      center.add(new THREE.Vector3(...model.position));
    });
    
    center.divideScalar(selectedModels.length);
    return center;
  }
  
  // Check if ray intersects with a bounding box
  rayIntersectsBox(
    camera: THREE.Camera,
    mouseX: number,
    mouseY: number,
    canvasElement: HTMLElement,
    box: THREE.Box3
  ): boolean {
    const ndc = this.screenToNDC(mouseX, mouseY, canvasElement);
    this.raycaster.setFromCamera(ndc, camera);
    
    return this.raycaster.ray.intersectsBox(box);
  }
}

export default SelectionManager; 