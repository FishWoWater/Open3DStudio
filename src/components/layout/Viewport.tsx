import React, { Suspense, useRef, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { EffectComposer, Outline } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useViewport, useStoreActions } from '../../store';
import ViewportPlaceholder from './ViewportPlaceholder';
import TransformGizmo from '../ui/TransformGizmo';
import ModelRenderer from '../ui/ModelRenderer';
import { SelectionManager } from '../../utils/selection';

const ViewportContainer = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.background.primary};
  position: relative;
  overflow: hidden;
`;

const ViewportHeader = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  background: ${props => props.theme.colors.background.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
`;

const ViewportInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};

  .separator {
    color: ${props => props.theme.colors.text.muted};
    margin: 0 ${props => props.theme.spacing.sm};
  }
`;

const TestDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const TestMainButton = styled.button`
  background: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    background: ${props => props.theme.colors.primary[500]};
  }
`;

const TestDropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: 1000;
  min-width: 150px;
  display: ${props => props.isOpen ? 'block' : 'none'};
  margin-top: 4px;
`;

const TestDropdownItem = styled.button`
  width: 100%;
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  text-align: left;
  
  &:hover {
    background: ${props => props.theme.colors.background.tertiary};
  }
  
  &:first-child {
    border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md};
  }
`;

const UploadButton = styled.button`
  background: ${props => props.theme.colors.primary[600]};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-left: ${props => props.theme.spacing.sm};
  
  &:hover {
    background: ${props => props.theme.colors.primary[500]};
  }
  
  &:disabled {
    background: ${props => props.theme.colors.gray[400]};
    cursor: not-allowed;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ViewportContent = styled.div`
  flex: 1;
  position: relative;
  background: ${props => props.theme.colors.background.primary};
  
  canvas {
    outline: none;
  }
`;

// Enhanced 3D Scene Component with Selection and Transform
const Scene: React.FC = () => {
  const viewport = useViewport();
  const { selectModel, setTransforming, transformSelectedModels, clearSelection } = useStoreActions();
  const { camera, gl } = useThree();
  
  const selectionManager = useMemo(() => new SelectionManager(), []);
  const objectRefs = useRef<{ [key: string]: THREE.Object3D }>({});
  
  // Handle click selection
  const handlePointerDown = useCallback((event: any) => {
    event.stopPropagation();
    
    if (viewport.currentTool !== 'select') return;
    
    const modelObjects = Object.values(objectRefs.current);
    const result = selectionManager.getClosestIntersection(
      camera,
      event.clientX,
      event.clientY,
      gl.domElement,
      modelObjects
    );
    
    if (result && result.modelId) {
      const isMultiSelect = event.ctrlKey || event.metaKey;
      selectModel(result.modelId, isMultiSelect);
    } else if (!event.ctrlKey && !event.metaKey) {
      clearSelection();
    }
  }, [viewport.currentTool, camera, gl.domElement, selectionManager, selectModel, clearSelection]);

  // Handle transform gizmo interactions
  const handleTransformStart = useCallback(() => {
    setTransforming(true);
  }, [setTransforming]);

  const handleTransform = useCallback((transform: any) => {
    transformSelectedModels(transform);
  }, [transformSelectedModels]);

  const handleTransformEnd = useCallback(() => {
    setTransforming(false);
  }, [setTransforming]);

  // Get selection center for gizmo positioning - use actual world position
  const selectionCenter = useMemo(() => {
    const selectedModels = viewport.loadedModels.filter(m => m.selected);
    if (selectedModels.length === 0) return [0, 0, 0] as [number, number, number];
    
    // Calculate the world-space bounding box center
    const boundingBox = new THREE.Box3();
    
    selectedModels.forEach(model => {
      if (model.object3D) {
        // Update world matrix to get accurate world positions
        model.object3D.updateMatrixWorld(true);
        
        // Get the bounding box of this object in world space
        const objectBox = new THREE.Box3().setFromObject(model.object3D);
        boundingBox.union(objectBox);
      }
    });
    
    // Get the center of the combined bounding box
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    return [center.x, center.y, center.z] as [number, number, number];
  }, [viewport.loadedModels]);

  // Get average scale of selected objects for gizmo sizing
  const selectionScale = useMemo(() => {
    const selectedModels = viewport.loadedModels.filter(m => m.selected);
    if (selectedModels.length === 0) return [1, 1, 1] as [number, number, number];
    
    let totalScale = [0, 0, 0];
    selectedModels.forEach(model => {
      totalScale[0] += model.scale[0];
      totalScale[1] += model.scale[1];
      totalScale[2] += model.scale[2];
    });
    
    const count = selectedModels.length;
    return [totalScale[0] / count, totalScale[1] / count, totalScale[2] / count] as [number, number, number];
  }, [viewport.loadedModels]);

  // Collect all THREE.Object3D meshes from selected models for outline effect
  const selectedMeshes = useMemo(() => {
    const meshes: THREE.Object3D[] = [];
    viewport.loadedModels.forEach(model => {
      if (model.selected && model.object3D) {
        // Collect all mesh children from the object
        model.object3D.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            meshes.push(child);
          }
        });
      }
    });
    return meshes;
  }, [viewport.loadedModels]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={viewport.lighting.ambientIntensity * 0.6} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={viewport.lighting.directionalIntensity * 1.5}
        castShadow={viewport.lighting.enableShadows}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <hemisphereLight intensity={0.4} groundColor="#404040" />

      {/* Environment */}
      {viewport.background === 'default' && (
        <Environment preset="studio" />
      )}

      {/* Grid */}
      {viewport.snapToGrid && (
        <Grid 
          infiniteGrid
          cellSize={viewport.gridSize}
          cellThickness={0.5}
          cellColor="#404040"
          sectionSize={viewport.gridSize * 10}
          sectionThickness={1}
          sectionColor="#606060"
          fadeDistance={30}
          fadeStrength={1}
        />
      )}

      {/* Models with Enhanced Material Handling */}
      {viewport.loadedModels.map((model) => (
        <ModelRenderer
          key={model.id}
          model={model}
          renderMode={viewport.renderMode}
          doubleSided={viewport.doubleSided}
          onRef={(ref: THREE.Group | null) => {
            if (ref) {
              ref.userData.modelId = model.id;
              objectRefs.current[model.id] = ref;
            }
          }}
          onPointerDown={handlePointerDown}
        />
      ))}

      {/* Transform Gizmo */}
      {viewport.selection.length > 0 && viewport.gizmoVisible && (
        <TransformGizmo
          position={selectionCenter}
          objectScale={selectionScale}
          tool={viewport.currentTool}
          transformMode={viewport.transformMode}
          visible={!viewport.isTransforming}
          onTransform={handleTransform}
          onTransformStart={handleTransformStart}
          onTransformEnd={handleTransformEnd}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        dampingFactor={0.1}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        panSpeed={0.8}
        maxPolarAngle={Math.PI * 0.75}
        minDistance={1}
        maxDistance={100}
        enabled={!viewport.isTransforming} // Disable when transforming
      />

      {/* Post-processing effects for selection outline - always rendered for stable performance */}
      <EffectComposer autoClear={false}>
        <Outline
          selection={selectedMeshes}
          selectionLayer={10}
          edgeStrength={10.0}
          pulseSpeed={0.0}
          visibleEdgeColor={0xffff99}
          hiddenEdgeColor={0x22227f}
          blur={false}
          xRay={true}
        />
      </EffectComposer>
    </>
  );
};

const Viewport: React.FC = () => {
  const viewport = useViewport();
  const { addModel, clearSelection, addNotification } = useStoreActions();
  const [testDropdownOpen, setTestDropdownOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Dynamically import Three.js loaders
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader');
      const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader');
      const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader');

      const url = URL.createObjectURL(file);
      const format = file.name.split('.').pop()?.toLowerCase() || '';

      let loader: any;
      let object: any;
      
      switch (format) {
        case 'glb':
        case 'gltf':
          loader = new GLTFLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(url, (gltf: any) => resolve(gltf.scene), undefined, reject);
          });
          break;
        case 'obj':
          loader = new OBJLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(url, (obj: any) => resolve(obj), undefined, reject);
          });
          break;
        case 'fbx':
          loader = new FBXLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(url, (fbx: any) => resolve(fbx), undefined, reject);
          });
          break;
        case 'ply':
          loader = new PLYLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(url, (geometry: any) => {
              // Ensure geometry has proper normals for lighting
              if (!geometry.attributes.normal) {
                geometry.computeVertexNormals();
              }
              const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
              const mesh = new THREE.Mesh(geometry, material);
              resolve(mesh);
            }, undefined, reject);
          });
          break;
        default:
          throw new Error(`Unsupported format: ${format}. Supported formats: GLB, GLTF, OBJ, FBX, PLY`);
      }

      // Ensure all geometries have proper normals for lighting
      object.traverse((child: any) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }
        }
      });

      // Add to scene via store
      addModel({
        id: `uploaded_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        url: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        selected: false,
        metadata: { source: 'upload', fileName: file.name },
        object3D: object
      });

      addNotification({
        type: 'success',
        title: 'Model Uploaded',
        message: `${file.name} imported to scene successfully.`,
        duration: 3000
      });
      
      // Clean up the object URL
      URL.revokeObjectURL(url);
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Upload Failed',
        message: err instanceof Error ? err.message : 'Failed to upload model',
        duration: 4000
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const addTestModel = () => {
    try {
      // Create a simple cube
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({ color: '#8888ff' });
      const mesh = new THREE.Mesh(geometry, material);
      
      addModel({
        id: `test-${Date.now()}`,
        name: 'Test Cube',
        url: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        selected: false,
        object3D: mesh
      });
    } catch (error) {
      console.error('Error adding test model:', error);
    }
  };

  const addTestGLBModel = () => {
    try {
      // For demo purposes, we'll create a procedural model with multiple materials
      // Create a group with multiple meshes to simulate imported GLB structure
      const group = new THREE.Group();
      
      // Create different parts with different materials
      const parts = [
        { geometry: new THREE.BoxGeometry(1, 0.2, 1), position: [0, 0, 0], material: { color: '#ff6b6b', metalness: 0.8, roughness: 0.2 } },
        { geometry: new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8), position: [0, 0.85, 0], material: { color: '#4ecdc4', metalness: 0.2, roughness: 0.8 } },
        { geometry: new THREE.SphereGeometry(0.3, 8, 6), position: [0, 1.8, 0], material: { color: '#45b7d1', metalness: 0.5, roughness: 0.3 } }
      ];
      
      parts.forEach((part, index) => {
        const material = new THREE.MeshStandardMaterial(part.material);
        const mesh = new THREE.Mesh(part.geometry, material);
        mesh.position.set(part.position[0], part.position[1], part.position[2]);
        mesh.name = `Mesh_${index}`;
        group.add(mesh);
      });
      
      // Position the group
      group.position.set(2, 0, 0);
      
      addModel({
        id: `test-glb-${Date.now()}`,
        name: 'Test Complex Model',
        url: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        selected: false,
        object3D: group
      });
    } catch (error) {
      console.error('Failed to create test GLB model:', error);
    }
  };

  const addTestSkeletonModel = () => {
    try {
      // Create a simple character-like model with skeleton
      const group = new THREE.Group();
      
      // Create body mesh
      const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: '#8B4513' });
      const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
      bodyMesh.position.set(0, 0.6, 0);
      
      // Create head mesh  
      const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
      const headMaterial = new THREE.MeshStandardMaterial({ color: '#FFDBAC' });
      const headMesh = new THREE.Mesh(headGeometry, headMaterial);
      headMesh.position.set(0, 1.5, 0);
      
      group.add(bodyMesh, headMesh);
      
      // Create a simple skeleton structure
      const rootBone = new THREE.Bone();
      rootBone.position.set(0, 0, 0);
      rootBone.name = 'Root';
      
      const spineBone = new THREE.Bone();
      spineBone.position.set(0, 0.6, 0);
      spineBone.name = 'Spine';
      rootBone.add(spineBone);
      
      const neckBone = new THREE.Bone();
      neckBone.position.set(0, 1.2, 0);
      neckBone.name = 'Neck';
      spineBone.add(neckBone);
      
      const headBone = new THREE.Bone();
      headBone.position.set(0, 1.5, 0);
      headBone.name = 'Head';
      neckBone.add(headBone);
      
      // Add arms
      const leftShoulderBone = new THREE.Bone();
      leftShoulderBone.position.set(-0.4, 1.0, 0);
      leftShoulderBone.name = 'LeftShoulder';
      spineBone.add(leftShoulderBone);
      
      const rightShoulderBone = new THREE.Bone();
      rightShoulderBone.position.set(0.4, 1.0, 0);
      rightShoulderBone.name = 'RightShoulder';
      spineBone.add(rightShoulderBone);
      
      group.add(rootBone);
      
      // Position the group
      group.position.set(-2, 0, 0);
      
      addModel({
        id: `test-skeleton-${Date.now()}`,
        name: 'Test Skeleton Model',
        url: '',
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        selected: false,
        object3D: group
      });
    } catch (error) {
      console.error('Failed to create test skeleton model:', error);
    }
  };

  return (
    <ViewportContainer>
      <ViewportHeader>
        <ViewportInfo>
          {/* <span>Scene: Untitled</span> */}
          {/* <span className="separator">•</span> */}
          <span>Objects: {viewport.loadedModels.length}</span>
          <span className="separator">•</span>
          <span>Render: {viewport.renderMode}</span>
        </ViewportInfo>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TestDropdown>
            <TestMainButton onClick={() => setTestDropdownOpen(!testDropdownOpen)}>
              Example Assets
              <i className={`fas fa-chevron-${testDropdownOpen ? 'up' : 'down'}`}></i>
            </TestMainButton>
            <TestDropdownMenu isOpen={testDropdownOpen} onClick={(e) => e.stopPropagation()}>
              <TestDropdownItem onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                addTestModel(); 
                setTestDropdownOpen(false); 
              }}>
                Simple Cube
              </TestDropdownItem>
              <TestDropdownItem onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                addTestGLBModel(); 
                setTestDropdownOpen(false); 
              }}>
                Parts Model
              </TestDropdownItem>
              <TestDropdownItem onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
                addTestSkeletonModel(); 
                setTestDropdownOpen(false); 
              }}>
                Skeleton Model
              </TestDropdownItem>
            </TestDropdownMenu>
          </TestDropdown>
          
          <UploadButton onClick={triggerFileUpload} disabled={isUploading}>
            <i className="fas fa-upload"></i>
            {isUploading ? 'Uploading...' : 'Upload Model'}
          </UploadButton>
          
          <HiddenFileInput
            ref={fileInputRef}
            type="file"
            accept=".glb,.gltf,.obj,.fbx,.ply"
            onChange={handleFileUpload}
          />
        </div>
      </ViewportHeader>
      
      <ViewportContent>
        {viewport.loadedModels.length === 0 ? (
          <ViewportPlaceholder />
        ) : (
          <Canvas
            camera={{
              position: viewport.camera.position,
              fov: viewport.camera.fov,
              near: viewport.camera.near,
              far: viewport.camera.far
            }}
            shadows={viewport.lighting.enableShadows}
            gl={{ 
              antialias: true, 
              alpha: false,
              toneMapping: 1, // ACESFilmicToneMapping
              toneMappingExposure: 1.2
            }}
            onPointerMissed={(event) => {
              // Clear selection when clicking on empty space
              if (viewport.currentTool === 'select' && !event.ctrlKey && !event.metaKey) {
                clearSelection();
              }
            }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
        )}
      </ViewportContent>
    </ViewportContainer>
  );
};

export default Viewport; 