import React, { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import * as THREE from 'three';
import { useThree, ThreeEvent } from '@react-three/fiber';

interface BBoxControlProps {
  center: [number, number, number];
  dimensions: [number, number, number];
  onChange: (center: [number, number, number], dimensions: [number, number, number]) => void;
}

/**
 * BBoxControl - Optimized for smooth dragging
 * 
 * Key optimization: Uses local state during drag, only calls onChange on drag END.
 * This prevents parent component re-renders during dragging.
 */
const BBoxControl = memo<BBoxControlProps>(({ center, dimensions, onChange }) => {
  const { gl, controls } = useThree();
  
  // Local state for visual updates during drag - this is the KEY optimization
  // During drag, we update localCenter/localDimensions instead of calling onChange
  const [localCenter, setLocalCenter] = useState<[number, number, number]>(center);
  const [localDimensions, setLocalDimensions] = useState<[number, number, number]>(dimensions);
  const [isDragging, setIsDragging] = useState(false);
  const [dragFace, setDragFace] = useState<string | null>(null);
  
  const groupRef = useRef<THREE.Group>(null);
  const startCenter = useRef<[number, number, number]>([0, 0, 0]);
  const startDimensions = useRef<[number, number, number]>([1, 1, 1]);
  const pointerRef = useRef(new THREE.Vector2());
  const onChangeRef = useRef(onChange);

  // Sync local state with props when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalCenter(center);
      setLocalDimensions(dimensions);
    }
  }, [center, dimensions, isDragging]);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Memoize materials
  const materials = useMemo(() => ({
    normal: new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthTest: false
    }),
    hover: new THREE.MeshBasicMaterial({
      color: 0x4a9eff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthTest: false
    })
  }), []);

  // Helper functions
  const getFaceAxis = useCallback((faceName: string): 'x' | 'y' | 'z' => {
    if (faceName === 'left' || faceName === 'right') return 'x';
    if (faceName === 'top' || faceName === 'bottom') return 'y';
    return 'z';
  }, []);

  const getFaceDirection = useCallback((faceName: string): number => {
    if (faceName === 'right' || faceName === 'top' || faceName === 'front') return 1;
    return -1;
  }, []);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>, faceName: string) => {
    e.stopPropagation();
    
    // Disable OrbitControls
    if (controls) {
      (controls as any).enabled = false;
    }
    
    setIsDragging(true);
    setDragFace(faceName);
    
    // Store starting values from LOCAL state (which is synced with props when not dragging)
    startCenter.current = [...localCenter];
    startDimensions.current = [...localDimensions];
    pointerRef.current.set(e.pointer.x, e.pointer.y);
  }, [controls, localCenter, localDimensions]);

  // Handle drag with local state updates only - NO onChange calls during drag
  useEffect(() => {
    if (!isDragging || !dragFace) return;

    const startPointer = new THREE.Vector2(pointerRef.current.x, pointerRef.current.y);
    let latestCenter: [number, number, number] = [...startCenter.current];
    let latestDimensions: [number, number, number] = [...startDimensions.current];
    
    const handleMove = (event: PointerEvent) => {
      // Convert mouse position to normalized device coordinates
      const rect = gl.domElement.getBoundingClientRect();
      const currentX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const currentY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Calculate screen-space delta
      const deltaX = currentX - startPointer.x;
      const deltaY = currentY - startPointer.y;
      
      // Get face axis and direction
      const axis = getFaceAxis(dragFace);
      const direction = getFaceDirection(dragFace);
      
      // Map screen movement to world space
      let movement = 0;
      if (axis === 'x') {
        movement = deltaX * 1.0;
      } else if (axis === 'y') {
        movement = deltaY * 1.0;
      } else {
        movement = deltaX * -1.0;
      }
      movement *= direction;
      
      // Calculate new dimensions and center
      const newDimensions: [number, number, number] = [...startDimensions.current];
      const newCenter: [number, number, number] = [...startCenter.current];
      const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
      
      newDimensions[axisIndex] = Math.max(0.1, startDimensions.current[axisIndex] + movement * 2);
      newCenter[axisIndex] = startCenter.current[axisIndex] + movement * direction;
      
      latestCenter = newCenter;
      latestDimensions = newDimensions;
      
      // Update LOCAL state only - this doesn't trigger parent re-render
      setLocalCenter(newCenter);
      setLocalDimensions(newDimensions);
    };

    const handleUp = () => {
      // Re-enable OrbitControls
      if (controls) {
        (controls as any).enabled = true;
      }
      
      // Call onChange ONLY ONCE at drag end
      onChangeRef.current(latestCenter, latestDimensions);
      
      setIsDragging(false);
      setDragFace(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isDragging, dragFace, gl, controls, getFaceAxis, getFaceDirection]);

  // Update cursor
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.cursor = isDragging ? 'grabbing' : 'grab';
    return () => { canvas.style.cursor = 'default'; };
  }, [isDragging, gl]);

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach(mat => mat.dispose());
    };
  }, [materials]);

  // Use LOCAL state for rendering - this is what makes dragging smooth
  const [width, height, depth] = localDimensions;

  // Memoized face component
  const renderFace = useCallback((
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number],
    faceName: string
  ) => (
    <mesh
      key={faceName}
      material={dragFace === faceName ? materials.hover : materials.normal}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => handlePointerDown(e, faceName)}
    >
      <planeGeometry />
    </mesh>
  ), [materials, dragFace, handlePointerDown]);

  return (
    <group ref={groupRef} position={localCenter}>
      {/* Wireframe box */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color={0xffffff} linewidth={2} />
      </lineSegments>
      
      {/* Draggable faces */}
      {renderFace([0, 0, depth / 2], [0, 0, 0], [width, height, 1], 'front')}
      {renderFace([0, 0, -depth / 2], [0, Math.PI, 0], [width, height, 1], 'back')}
      {renderFace([-width / 2, 0, 0], [0, -Math.PI / 2, 0], [depth, height, 1], 'left')}
      {renderFace([width / 2, 0, 0], [0, Math.PI / 2, 0], [depth, height, 1], 'right')}
      {renderFace([0, height / 2, 0], [-Math.PI / 2, 0, 0], [width, depth, 1], 'top')}
      {renderFace([0, -height / 2, 0], [Math.PI / 2, 0, 0], [width, depth, 1], 'bottom')}
      
      {/* Corner spheres */}
      {[
        [-width/2, -height/2, -depth/2],
        [width/2, -height/2, -depth/2],
        [-width/2, height/2, -depth/2],
        [width/2, height/2, -depth/2],
        [-width/2, -height/2, depth/2],
        [width/2, -height/2, depth/2],
        [-width/2, height/2, depth/2],
        [width/2, height/2, depth/2]
      ].map((pos, i) => (
        <mesh key={`corner-${i}`} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={0xffffff} />
        </mesh>
      ))}
    </group>
  );
}, (prevProps, nextProps) => {
  // Only re-render if props actually changed
  return (
    prevProps.center[0] === nextProps.center[0] &&
    prevProps.center[1] === nextProps.center[1] &&
    prevProps.center[2] === nextProps.center[2] &&
    prevProps.dimensions[0] === nextProps.dimensions[0] &&
    prevProps.dimensions[1] === nextProps.dimensions[1] &&
    prevProps.dimensions[2] === nextProps.dimensions[2]
  );
});

export default BBoxControl;
