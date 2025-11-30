import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

const PreviewContainer = styled.div`
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  position: relative;
  margin-bottom: ${props => props.theme.spacing.sm};
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
  background: rgba(0, 0, 0, 0.5);
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
  z-index: 1;
`;

const ErrorOverlay = styled(LoadingOverlay)`
  background: rgba(139, 0, 0, 0.2);
  color: ${props => props.theme.colors.error};
`;

interface MeshPreviewProps {
  meshObject: THREE.Object3D;
}

const MeshPreview: React.FC<MeshPreviewProps> = ({ meshObject }) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <Center>
        <primitive object={meshObject} />
      </Center>
      <OrbitControls 
        enablePan={false} 
        enableZoom={true}
        minDistance={1}
        maxDistance={10}
        autoRotate
        autoRotateSpeed={2}
      />
    </>
  );
};

export interface TaskModelPreviewProps {
  downloadUrl: string;
  format?: string;
}

const TaskModelPreview: React.FC<TaskModelPreviewProps> = ({ downloadUrl, format }) => {
  const [meshObject, setMeshObject] = useState<THREE.Object3D | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent double loading
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadMesh = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine format
        let fileFormat = format?.toLowerCase() || 'glb';
        if (!format) {
          const urlPath = downloadUrl.split('?')[0];
          const extension = urlPath.split('.').pop()?.toLowerCase();
          if (extension && ['glb', 'gltf', 'obj', 'fbx', 'ply'].includes(extension)) {
            fileFormat = extension;
          }
        }

        let loader: any;
        let object: THREE.Object3D;

        switch (fileFormat) {
          case 'glb':
          case 'gltf':
            loader = new GLTFLoader();
            object = await new Promise<THREE.Object3D>((resolve, reject) => {
              loader.load(
                downloadUrl,
                (gltf: any) => resolve(gltf.scene),
                undefined,
                reject
              );
            });
            break;
          case 'obj':
            loader = new OBJLoader();
            object = await new Promise<THREE.Object3D>((resolve, reject) => {
              loader.load(downloadUrl, resolve, undefined, reject);
            });
            break;
          case 'fbx':
            loader = new FBXLoader();
            object = await new Promise<THREE.Object3D>((resolve, reject) => {
              loader.load(downloadUrl, resolve, undefined, reject);
            });
            break;
          case 'ply':
            loader = new PLYLoader();
            object = await new Promise<THREE.Object3D>((resolve, reject) => {
              loader.load(
                downloadUrl,
                (geometry: THREE.BufferGeometry) => {
                  if (!geometry.attributes.normal) {
                    geometry.computeVertexNormals();
                  }
                  const material = new THREE.MeshStandardMaterial({ 
                    color: 0x888888,
                    metalness: 0.3,
                    roughness: 0.7
                  });
                  const mesh = new THREE.Mesh(geometry, material);
                  resolve(mesh);
                },
                undefined,
                reject
              );
            });
            break;
          default:
            throw new Error(`Unsupported format: ${fileFormat}`);
        }

        // Apply default materials where needed
        object.traverse((child: any) => {
          if (child.isMesh) {
            if (!child.material) {
              child.material = new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                metalness: 0.3,
                roughness: 0.7
              });
            }
            if (child.geometry && !child.geometry.attributes.normal) {
              child.geometry.computeVertexNormals();
            }
          }
        });

        setMeshObject(object);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load preview:', err);
        setError('Preview unavailable');
        setIsLoading(false);
      }
    };

    loadMesh();
  }, [downloadUrl, format]);

  if (error) {
    return (
      <PreviewContainer>
        <ErrorOverlay>{error}</ErrorOverlay>
      </PreviewContainer>
    );
  }

  if (isLoading || !meshObject) {
    return (
      <PreviewContainer>
        <LoadingOverlay>Loading preview...</LoadingOverlay>
      </PreviewContainer>
    );
  }

  return (
    <PreviewContainer>
      <Canvas camera={{ position: [2, 2, 2], fov: 45 }}>
        <MeshPreview meshObject={meshObject} />
      </Canvas>
    </PreviewContainer>
  );
};

export default TaskModelPreview;

