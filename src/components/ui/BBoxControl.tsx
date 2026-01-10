import React, { useRef, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, ThreeEvent } from '@react-three/fiber';

interface BBoxControlProps {
  center: [number, number, number];
  dimensions: [number, number, number];
  onChange: (center: [number, number, number], dimensions: [number, number, number]) => void;
}

const BBoxControl: React.FC<BBoxControlProps> = ({ center, dimensions, onChange }) => {
  const { camera, gl, raycaster, pointer } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [dragFace, setDragFace] = useState<string | null>(null);
  const [hoverFace, setHoverFace] = useState<string | null>(null);
  
  const groupRef = useRef<THREE.Group>(null);
  const planeRef = useRef(new THREE.Plane());
  const intersectionPoint = useRef(new THREE.Vector3());
  const startPoint = useRef(new THREE.Vector3());
  const startCenter = useRef<[number, number, number]>([0, 0, 0]);
  const startDimensions = useRef<[number, number, number]>([1, 1, 1]);

  // Face meshes refs
  const faceMeshes = useRef<{ [key: string]: THREE.Mesh }>({});

  // Create face geometries and materials
  const createFace = (
    position: THREE.Vector3,
    rotation: THREE.Euler,
    size: [number, number],
    faceName: string,
    isHovered: boolean
  ) => {
    const geometry = new THREE.PlaneGeometry(size[0], size[1]);
    const material = new THREE.MeshBasicMaterial({
      color: isHovered ? 0x4a9eff : 0x888888,
      transparent: true,
      opacity: isHovered ? 0.5 : 0.2,
      side: THREE.DoubleSide,
      depthTest: false
    });
    
    return (
      <mesh
        key={faceName}
        geometry={geometry}
        material={material}
        position={position}
        rotation={rotation}
        userData={{ faceName }}
        ref={(ref: THREE.Mesh | null) => {
          if (ref) faceMeshes.current[faceName] = ref;
        }}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => handlePointerDown(e, faceName)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerEnter={() => setHoverFace(faceName)}
        onPointerLeave={() => setHoverFace(null)}
      />
    );
  };

  const handlePointerDown = (e: ThreeEvent<PointerEvent>, faceName: string) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragFace(faceName);
    
    // Store starting values
    startCenter.current = [...center];
    startDimensions.current = [...dimensions];
    
    // Calculate the drag plane based on face normal
    const normal = getFaceNormal(faceName);
    const facePosition = new THREE.Vector3(...center);
    
    // Offset face position based on which face
    const offset = getFaceOffset(faceName, dimensions);
    facePosition.add(offset);
    
    planeRef.current.setFromNormalAndCoplanarPoint(normal, facePosition);
    
    // Get starting intersection point
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(planeRef.current, startPoint.current);
  };

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !dragFace) return;
    
    e.stopPropagation();
    
    // Calculate intersection with drag plane
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(planeRef.current, intersectionPoint.current)) {
      // Calculate movement delta
      const delta = new THREE.Vector3().subVectors(intersectionPoint.current, startPoint.current);
      
      // Apply delta based on face axis
      const axis = getFaceAxis(dragFace);
      const direction = getFaceDirection(dragFace);
      
      // Project delta onto axis
      const axisVector = new THREE.Vector3();
      axisVector[axis] = 1;
      const movement = delta.dot(axisVector) * direction;
      
      // Calculate new dimensions and center
      const newDimensions: [number, number, number] = [...startDimensions.current];
      const newCenter: [number, number, number] = [...startCenter.current];
      
      // Update dimension and center for the dragged face
      newDimensions[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] = Math.max(
        0.1,
        startDimensions.current[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] + movement * 2
      );
      
      // Move center by half the dimension change
      newCenter[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] = 
        startCenter.current[axis === 'x' ? 0 : axis === 'y' ? 1 : 2] + (movement * direction);
      
      onChange(newCenter, newDimensions);
    }
  }, [isDragging, dragFace, camera, raycaster, pointer, onChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragFace(null);
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;
    
    if (isDragging) {
      canvas.style.cursor = 'grabbing';
    } else if (hoverFace) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
    
    return () => {
      canvas.style.cursor = 'default';
    };
  }, [isDragging, hoverFace, gl]);

  // Helper functions
  const getFaceNormal = (faceName: string): THREE.Vector3 => {
    const normals: { [key: string]: THREE.Vector3 } = {
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1),
      left: new THREE.Vector3(-1, 0, 0),
      right: new THREE.Vector3(1, 0, 0),
      top: new THREE.Vector3(0, 1, 0),
      bottom: new THREE.Vector3(0, -1, 0)
    };
    return normals[faceName];
  };

  const getFaceOffset = (faceName: string, dims: [number, number, number]): THREE.Vector3 => {
    const [width, height, depth] = dims;
    const offsets: { [key: string]: THREE.Vector3 } = {
      front: new THREE.Vector3(0, 0, depth / 2),
      back: new THREE.Vector3(0, 0, -depth / 2),
      left: new THREE.Vector3(-width / 2, 0, 0),
      right: new THREE.Vector3(width / 2, 0, 0),
      top: new THREE.Vector3(0, height / 2, 0),
      bottom: new THREE.Vector3(0, -height / 2, 0)
    };
    return offsets[faceName];
  };

  const getFaceAxis = (faceName: string): 'x' | 'y' | 'z' => {
    if (faceName === 'left' || faceName === 'right') return 'x';
    if (faceName === 'top' || faceName === 'bottom') return 'y';
    return 'z';
  };

  const getFaceDirection = (faceName: string): number => {
    if (faceName === 'right' || faceName === 'top' || faceName === 'front') return 1;
    return -1;
  };

  const [width, height, depth] = dimensions;

  return (
    <group ref={groupRef} position={center}>
      {/* Wireframe box */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width, height, depth)]} />
        <lineBasicMaterial color={0xffffff} linewidth={2} />
      </lineSegments>
      
      {/* Draggable faces */}
      {createFace(
        new THREE.Vector3(0, 0, depth / 2),
        new THREE.Euler(0, 0, 0),
        [width, height],
        'front',
        hoverFace === 'front' || dragFace === 'front'
      )}
      {createFace(
        new THREE.Vector3(0, 0, -depth / 2),
        new THREE.Euler(0, Math.PI, 0),
        [width, height],
        'back',
        hoverFace === 'back' || dragFace === 'back'
      )}
      {createFace(
        new THREE.Vector3(-width / 2, 0, 0),
        new THREE.Euler(0, -Math.PI / 2, 0),
        [depth, height],
        'left',
        hoverFace === 'left' || dragFace === 'left'
      )}
      {createFace(
        new THREE.Vector3(width / 2, 0, 0),
        new THREE.Euler(0, Math.PI / 2, 0),
        [depth, height],
        'right',
        hoverFace === 'right' || dragFace === 'right'
      )}
      {createFace(
        new THREE.Vector3(0, height / 2, 0),
        new THREE.Euler(-Math.PI / 2, 0, 0),
        [width, depth],
        'top',
        hoverFace === 'top' || dragFace === 'top'
      )}
      {createFace(
        new THREE.Vector3(0, -height / 2, 0),
        new THREE.Euler(Math.PI / 2, 0, 0),
        [width, depth],
        'bottom',
        hoverFace === 'bottom' || dragFace === 'bottom'
      )}
      
      {/* Corner spheres for visual feedback */}
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
};

export default BBoxControl;
