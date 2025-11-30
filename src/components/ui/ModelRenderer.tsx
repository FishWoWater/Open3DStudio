import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LoadedModel, RenderMode } from '../../types/state';
import { MaterialManager } from '../../utils/materials';

interface ModelRendererProps {
  model: LoadedModel;
  renderMode: RenderMode;
  doubleSided?: boolean;
  onRef?: (ref: THREE.Group | null) => void;
  onPointerDown?: (event: any) => void;
}

/**
 * ModelRenderer handles proper material application for both simple and complex 3D models
 * It ensures materials are applied correctly to the entire object hierarchy
 */
const ModelRenderer: React.FC<ModelRendererProps> = ({
  model,
  renderMode,
  doubleSided = false,
  onRef,
  onPointerDown
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const lastRenderMode = useRef<RenderMode>(renderMode);
  const lastSelected = useRef<boolean>(model.selected);
  const lastDoubleSided = useRef<boolean>(doubleSided);

  // Update ref callback when group changes
  useEffect(() => {
    if (onRef) {
      onRef(groupRef.current);
    }
  }, [onRef]);

  // Apply materials when render mode or selection changes
  useEffect(() => {
    if (!groupRef.current || !model.object3D) return;

    const hasChanged = 
      lastRenderMode.current !== renderMode || 
      lastSelected.current !== model.selected ||
      lastDoubleSided.current !== doubleSided;

    if (hasChanged) {
      MaterialManager.applyMaterialToObject(
        model.object3D,
        renderMode,
        model.material,
        model.originalMaterials,
        model.selected,
        { skeleton: model.skeleton, parts: model.parts },
        doubleSided
      );

      lastRenderMode.current = renderMode;
      lastSelected.current = model.selected;
      lastDoubleSided.current = doubleSided;
    }
  }, [renderMode, model.selected, doubleSided, model.object3D, model.material, model.originalMaterials, model.skeleton, model.parts]);

  // Set userData for selection
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData.modelId = model.id;
    }
  }, [model.id]);

  return (
    <group
      ref={groupRef}
      position={model.position}
      rotation={model.rotation}
      scale={model.scale}
      visible={model.visible}
      onPointerDown={onPointerDown}
    >
      {model.object3D ? (
        <primitive object={model.object3D} />
      ) : (
        // Fallback for models without object3D (like test cubes)
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial color={model.material?.color || '#888888'} />
        </mesh>
      )}
    </group>
  );
};

export default ModelRenderer;
