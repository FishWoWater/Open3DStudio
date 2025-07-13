import React, { useRef, useCallback, useMemo } from 'react';
import { extend, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ViewportTool, TransformMode } from '../../types/state';

extend({ Line_: THREE.Line });

interface TransformGizmoProps {
  position: [number, number, number];
  tool: ViewportTool;
  transformMode: TransformMode;
  visible: boolean;
  onTransform: (transform: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  }) => void;
  onTransformStart: () => void;
  onTransformEnd: () => void;
}

const TransformGizmo: React.FC<TransformGizmoProps> = ({
  position,
  tool,
  transformMode,
  visible,
  onTransform,
  onTransformStart,
  onTransformEnd
}) => {
  const groupRef = useRef<THREE.Group>(null!);
  const { camera, size, raycaster, gl } = useThree();
  
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragAxis, setDragAxis] = React.useState<string | null>(null);
  const [dragStartPoint, setDragStartPoint] = React.useState<THREE.Vector3>(new THREE.Vector3());
  const [lastMousePosition, setLastMousePosition] = React.useState<THREE.Vector2>(new THREE.Vector2());

  // Calculate gizmo scale based on distance to camera
  const gizmoScale = useMemo(() => {
    const distance = camera.position.distanceTo(new THREE.Vector3(...position));
    return Math.max(0.1, distance * 0.15); // Increased base scale for better visibility
  }, [camera.position, position]);

  // Get world space axis vectors
  const getWorldAxisVectors = useCallback(() => {
    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3(0, 0, 1);
    
    return { xAxis, yAxis, zAxis };
  }, []);

  // Calculate drag plane for an axis
  const getDragPlane = useCallback((axis: string, gizmoPosition: THREE.Vector3) => {
    const { xAxis, yAxis, zAxis } = getWorldAxisVectors();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    
    let planeNormal = new THREE.Vector3();
    
    switch (axis) {
      case 'x':
        // For X-axis, create plane perpendicular to camera direction but containing X-axis
        planeNormal.crossVectors(xAxis, cameraDirection).normalize();
        if (planeNormal.length() < 0.1) {
          // Fallback if camera is aligned with X-axis
          planeNormal.copy(yAxis);
        }
        break;
      case 'y':
        // For Y-axis, use XZ plane when possible, otherwise use camera-relative plane
        if (Math.abs(cameraDirection.y) < 0.9) {
          planeNormal.copy(yAxis);
        } else {
          planeNormal.crossVectors(yAxis, cameraDirection).normalize();
        }
        break;
      case 'z':
        // For Z-axis, create plane perpendicular to camera direction but containing Z-axis
        planeNormal.crossVectors(zAxis, cameraDirection).normalize();
        if (planeNormal.length() < 0.1) {
          // Fallback if camera is aligned with Z-axis
          planeNormal.copy(xAxis);
        }
        break;
      default:
        planeNormal.copy(cameraDirection);
    }
    
    return new THREE.Plane(planeNormal, -planeNormal.dot(gizmoPosition));
  }, [camera, getWorldAxisVectors]);

  // Handle mouse events
  const handlePointerDown = useCallback((event: any, axis: string) => {
    event.stopPropagation();
    
    setIsDragging(true);
    setDragAxis(axis);
    
    const mouse = new THREE.Vector2(
      (event.clientX / size.width) * 2 - 1,
      -(event.clientY / size.height) * 2 + 1
    );
    
    setLastMousePosition(mouse.clone());
    
    raycaster.setFromCamera(mouse, camera);
    const gizmoPosition = new THREE.Vector3(...position);
    const plane = getDragPlane(axis, gizmoPosition);
    
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);
    
    if (intersection) {
      setDragStartPoint(intersection);
    }
    
    onTransformStart();
  }, [camera, size, raycaster, position, getDragPlane, onTransformStart]);

  const handlePointerMove = useCallback((event: any) => {
    if (!isDragging || !dragAxis) return;
    
    const mouse = new THREE.Vector2(
      (event.clientX / size.width) * 2 - 1,
      -(event.clientY / size.height) * 2 + 1
    );
    
    if (tool === 'move') {
      // Calculate mouse movement in screen space
      const mouseDelta = mouse.clone().sub(lastMousePosition);
      
      // Convert screen movement to world movement based on camera distance
      const gizmoWorldPos = new THREE.Vector3(...position);
      const distance = camera.position.distanceTo(gizmoWorldPos);
      const movementScale = distance * 0.5; // Adjust sensitivity here
      
      let deltaX = 0, deltaY = 0, deltaZ = 0;
      
      // Calculate movement based on drag axis and camera orientation
      switch (dragAxis) {
        case 'x':
          // Move along world X axis
          deltaX = mouseDelta.x * movementScale;
          break;
        case 'y':
          // Move along world Y axis  
          deltaY = -mouseDelta.y * movementScale;
          break;
        case 'z':
          // Move along world Z axis (use combined mouse movement)
          deltaZ = mouseDelta.x * movementScale;
          break;
      }
      
      // Apply incremental movement
      onTransform({ 
        position: [deltaX, deltaY, deltaZ] 
      });
      
    } else if (tool === 'rotate') {
      // Calculate rotation based on mouse movement
      const mouseDelta = mouse.clone().sub(lastMousePosition);
      const rotationSpeed = 2.0;
      let rotationAmount = mouseDelta.length() * rotationSpeed;
      
      // Determine rotation direction
      if (mouseDelta.x + mouseDelta.y < 0) {
        rotationAmount = -rotationAmount;
      }
      
      const rotation: [number, number, number] = [0, 0, 0];
      switch (dragAxis) {
        case 'x':
          rotation[0] = rotationAmount;
          break;
        case 'y':
          rotation[1] = rotationAmount;
          break;
        case 'z':
          rotation[2] = rotationAmount;
          break;
      }
      
      onTransform({ rotation });
      
    } else if (tool === 'scale') {
      // Calculate scale based on mouse movement
      const mouseDelta = mouse.clone().sub(lastMousePosition);
      const scaleAmount = 1.0 + (mouseDelta.y * 0.01);
      
      if (dragAxis === 'uniform') {
        onTransform({ scale: [scaleAmount, scaleAmount, scaleAmount] });
      } else {
        const scale: [number, number, number] = [1, 1, 1];
        switch (dragAxis) {
          case 'x':
            scale[0] = scaleAmount;
            break;
          case 'y':
            scale[1] = scaleAmount;
            break;
          case 'z':
            scale[2] = scaleAmount;
            break;
        }
        onTransform({ scale });
      }
    }
    
    setLastMousePosition(mouse);
  }, [isDragging, dragAxis, lastMousePosition, tool, camera, size, position, onTransform]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragAxis(null);
    setDragStartPoint(new THREE.Vector3());
    setLastMousePosition(new THREE.Vector2());
    onTransformEnd();
  }, [onTransformEnd]);

  // Add global event listeners
  React.useEffect(() => {
    if (isDragging) {
      const canvas = gl.domElement;
      canvas.addEventListener('pointermove', handlePointerMove);
      canvas.addEventListener('pointerup', handlePointerUp);
      canvas.addEventListener('pointerleave', handlePointerUp);
      
      return () => {
        canvas.removeEventListener('pointermove', handlePointerMove);
        canvas.removeEventListener('pointerup', handlePointerUp);
        canvas.removeEventListener('pointerleave', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp, gl.domElement]);

  // Render different gizmos based on tool
  const renderGizmo = () => {
    if (tool === 'move') {
      return (
        <>
          {/* Center sphere to show connection point */}
          <mesh>
            <sphereGeometry args={[0.08 * gizmoScale, 8, 8]} />
            <meshBasicMaterial color="#cccccc" />
          </mesh>
          
          {/* X Axis - Red */}
          <group>
            <mesh
              onPointerDown={(e: any) => handlePointerDown(e, 'x')}
              position={[0.5 * gizmoScale, 0, 0]}
              rotation={[0, 0, -Math.PI / 2]}
            >
              <cylinderGeometry args={[0.04 * gizmoScale, 0.04 * gizmoScale, gizmoScale, 8]} />
              <meshBasicMaterial color="#ff4444" />
            </mesh>
            <mesh 
              onPointerDown={(e: any) => handlePointerDown(e, 'x')}
              position={[gizmoScale, 0, 0]}
              rotation={[0, 0, -Math.PI / 2]}
            >
              <coneGeometry args={[0.12 * gizmoScale, 0.3 * gizmoScale, 8]} />
              <meshBasicMaterial color="#ff0000" />
            </mesh>
          </group>
          
          {/* Y Axis - Green */}
          <group>
            <mesh
              onPointerDown={(e: any) => handlePointerDown(e, 'y')}
              position={[0, 0.5 * gizmoScale, 0]}
            >
              <cylinderGeometry args={[0.04 * gizmoScale, 0.04 * gizmoScale, gizmoScale, 8]} />
              <meshBasicMaterial color="#44ff44" />
            </mesh>
            <mesh 
              onPointerDown={(e: any) => handlePointerDown(e, 'y')}
              position={[0, gizmoScale, 0]}
            >
              <coneGeometry args={[0.12 * gizmoScale, 0.3 * gizmoScale, 8]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
          </group>
          
          {/* Z Axis - Blue */}
          <group>
            <mesh
              onPointerDown={(e: any) => handlePointerDown(e, 'z')}
              position={[0, 0, 0.5 * gizmoScale]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.04 * gizmoScale, 0.04 * gizmoScale, gizmoScale, 8]} />
              <meshBasicMaterial color="#4444ff" />
            </mesh>
            <mesh 
              onPointerDown={(e: any) => handlePointerDown(e, 'z')}
              position={[0, 0, gizmoScale]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <coneGeometry args={[0.12 * gizmoScale, 0.3 * gizmoScale, 8]} />
              <meshBasicMaterial color="#0000ff" />
            </mesh>
          </group>
        </>
      );
    } else if (tool === 'rotate') {
      return (
        <>
          {/* Center sphere */}
          <mesh>
            <sphereGeometry args={[0.08 * gizmoScale, 8, 8]} />
            <meshBasicMaterial color="#cccccc" />
          </mesh>
          
          {/* X Rotation Ring - Red */}
          <mesh
            onPointerDown={(e: any) => handlePointerDown(e, 'x')}
            rotation={[0, Math.PI / 2, 0]}
          >
            <torusGeometry args={[gizmoScale * 0.8, 0.06 * gizmoScale, 8, 32]} />
            <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
          </mesh>
          
          {/* Y Rotation Ring - Green */}
          <mesh
            onPointerDown={(e: any) => handlePointerDown(e, 'y')}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[gizmoScale * 0.8, 0.06 * gizmoScale, 8, 32]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
          </mesh>
          
          {/* Z Rotation Ring - Blue */}
          <mesh
            onPointerDown={(e: any) => handlePointerDown(e, 'z')}
          >
            <torusGeometry args={[gizmoScale * 0.8, 0.06 * gizmoScale, 8, 32]} />
            <meshBasicMaterial color="#0000ff" transparent opacity={0.8} />
          </mesh>
        </>
      );
    } else if (tool === 'scale') {
      return (
        <>
          {/* X Scale Handle - Red */}
          <mesh
            onPointerDown={(e: any) => handlePointerDown(e, 'x')}
            position={[gizmoScale * 0.8, 0, 0]}
          >
            <boxGeometry args={[0.15 * gizmoScale, 0.15 * gizmoScale, 0.15 * gizmoScale]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh position={[0.4 * gizmoScale, 0, 0]}>
            <cylinderGeometry args={[0.03 * gizmoScale, 0.03 * gizmoScale, gizmoScale * 0.8, 8]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
          
          {/* Y Scale Handle - Green */}
          <mesh
            onPointerDown={(e: any) => handlePointerDown(e, 'y')}
            position={[0, gizmoScale * 0.8, 0]}
          >
            <boxGeometry args={[0.15 * gizmoScale, 0.15 * gizmoScale, 0.15 * gizmoScale]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          <mesh 
            position={[0, 0.4 * gizmoScale, 0]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.03 * gizmoScale, 0.03 * gizmoScale, gizmoScale * 0.8, 8]} />
            <meshBasicMaterial color="#44ff44" />
          </mesh>
          
          {/* Z Scale Handle - Blue */}
          <mesh
            onPointerDown={(e: any) => handlePointerDown(e, 'z')}
            position={[0, 0, gizmoScale * 0.8]}
          >
            <boxGeometry args={[0.15 * gizmoScale, 0.15 * gizmoScale, 0.15 * gizmoScale]} />
            <meshBasicMaterial color="#0000ff" />
          </mesh>
          <mesh 
            position={[0, 0, 0.4 * gizmoScale]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.03 * gizmoScale, 0.03 * gizmoScale, gizmoScale * 0.8, 8]} />
            <meshBasicMaterial color="#4444ff" />
          </mesh>
          
          {/* Center uniform scale handle */}
          <mesh
            onPointerDown={(e: any) => handlePointerDown(e, 'uniform')}
          >
            <sphereGeometry args={[0.12 * gizmoScale, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </>
      );
    }
    return null;
  };

  if (!visible || tool === 'select') return null;

  return (
    <group ref={groupRef} position={position}>
      {renderGizmo()}
    </group>
  );
};

export default TransformGizmo; 