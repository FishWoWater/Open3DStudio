import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import BBoxControl from './BBoxControl';

const ViewportContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.base};
  z-index: 10;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid ${props => props.theme.colors.border.default};
  border-top: 4px solid ${props => props.theme.colors.primary[500]};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: ${props => props.theme.spacing.md};

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const InfoOverlay = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  left: ${props => props.theme.spacing.md};
  background: rgba(0, 0, 0, 0.7);
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  z-index: 5;
`;

interface MeshEditingViewportProps {
  meshUrl: string;
  format?: string;
  bboxCenter: [number, number, number];
  bboxDimensions: [number, number, number];
  onBBoxChange: (center: [number, number, number], dimensions: [number, number, number]) => void;
  onBBoxInitialized?: (center: [number, number, number], dimensions: [number, number, number]) => void;
}

// Component to load and display the mesh
const MeshLoader: React.FC<{ url: string; format?: string; onLoaded: (bbox: THREE.Box3) => void }> = ({ url, format, onLoaded }) => {
  const [mesh, setMesh] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    const loadMesh = async () => {
      try {
        // Import loaders
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
        const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader');
        const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader');
        
        // Determine format - prefer passed format prop over URL extraction
        let fileFormat = format?.toLowerCase() || 'glb';
        if (!format) {
          const urlPath = url.split('?')[0];
          const extension = urlPath.split('.').pop()?.toLowerCase();
          if (extension && ['glb', 'gltf', 'obj', 'fbx', 'ply'].includes(extension)) {
            fileFormat = extension;
          }
        }

        let loadedMesh: THREE.Object3D;

        switch (fileFormat) {
          case 'glb':
          case 'gltf':
            const gltfLoader = new GLTFLoader();
            const gltf = await new Promise<any>((resolve, reject) => {
              gltfLoader.load(url, resolve, undefined, reject);
            });
            loadedMesh = gltf.scene;
            break;
          case 'fbx':
            const fbxLoader = new FBXLoader();
            const fbx = await new Promise<THREE.Group>((resolve, reject) => {
              fbxLoader.load(url, resolve, undefined, reject);
            });
            loadedMesh = fbx;
            break;
          case 'obj':
            const objLoader = new OBJLoader();
            const obj = await new Promise<THREE.Group>((resolve, reject) => {
              objLoader.load(url, resolve, undefined, reject);
            });
            loadedMesh = obj;
            break;
          case 'ply':
            const plyLoader = new PLYLoader();
            const geometry = await new Promise<THREE.BufferGeometry>((resolve, reject) => {
              plyLoader.load(url, resolve, undefined, reject);
            });
            if (!geometry.attributes.normal) {
              geometry.computeVertexNormals();
            }
            const material = new THREE.MeshStandardMaterial({ 
              color: 0x888888,
              metalness: 0.3,
              roughness: 0.7
            });
            loadedMesh = new THREE.Mesh(geometry, material);
            break;
          default:
            throw new Error(`Unsupported file format: ${fileFormat}`);
        }

        // Calculate bounding box
        const bbox = new THREE.Box3().setFromObject(loadedMesh);
        onLoaded(bbox);
        setMesh(loadedMesh);
      } catch (error) {
        console.error('Error loading mesh:', error);
      }
    };

    loadMesh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, format]);

  if (!mesh) return null;

  return <primitive object={mesh} />;
};

const MeshEditingViewport: React.FC<MeshEditingViewportProps> = ({
  meshUrl,
  format,
  bboxCenter,
  bboxDimensions,
  onBBoxChange,
  onBBoxInitialized
}) => {
  const [loading, setLoading] = useState(true);
  const [meshLoaded, setMeshLoaded] = useState(false);
  const onBBoxInitializedRef = useRef(onBBoxInitialized);
  
  // Keep ref up to date
  useEffect(() => {
    onBBoxInitializedRef.current = onBBoxInitialized;
  }, [onBBoxInitialized]);

  const handleMeshLoaded = useCallback((bbox: THREE.Box3) => {
    setMeshLoaded(true);
    setLoading(false);
    
    // Calculate center and dimensions from bounding box
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    // Initialize bbox if callback is provided
    if (onBBoxInitializedRef.current) {
      onBBoxInitializedRef.current(
        [center.x, center.y, center.z],
        [size.x, size.y, size.z]
      );
    }
  }, []);

  // Reset loading state when mesh URL changes
  useEffect(() => {
    setLoading(true);
    setMeshLoaded(false);
  }, [meshUrl]);

  return (
    <ViewportContainer>
      {loading && (
        <LoadingOverlay>
          <Spinner />
          Loading mesh...
        </LoadingOverlay>
      )}
      
      <InfoOverlay>
        <div>Drag bbox faces to adjust editing region</div>
        <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
          Dimensions: {bboxDimensions[0].toFixed(2)} × {bboxDimensions[1].toFixed(2)} × {bboxDimensions[2].toFixed(2)}
        </div>
      </InfoOverlay>

      <Canvas
        camera={{ position: [3, 3, 3], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0a0a1e']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={0.8} castShadow />
        <directionalLight position={[-10, 10, -10]} intensity={0.4} />
        <hemisphereLight args={['#87ceeb', '#545454', 0.6]} />
        
        {/* Grid */}
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />
        
        {/* Mesh */}
        <Suspense fallback={null}>
          <MeshLoader url={meshUrl} format={format} onLoaded={handleMeshLoaded} />
        </Suspense>
        
        {/* BBox Control */}
        {meshLoaded && (
          <BBoxControl
            center={bboxCenter}
            dimensions={bboxDimensions}
            onChange={onBBoxChange}
          />
        )}
        
        {/* Camera controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.05}
          minDistance={1}
          maxDistance={50}
          enabled={true}
        />
      </Canvas>
    </ViewportContainer>
  );
};

export default MeshEditingViewport;
