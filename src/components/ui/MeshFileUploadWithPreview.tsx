import React, { useState, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const DropZone = styled.div<{ isDragOver: boolean; hasFile: boolean }>`
  border: 2px dashed ${props => 
    props.isDragOver ? props.theme.colors.primary[500] : 
    props.hasFile ? props.theme.colors.success : 
    props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  background: ${props => props.isDragOver ? `${props.theme.colors.primary[500]}10` : 'transparent'};

  &:hover {
    border-color: ${props => props.theme.colors.primary[400]};
    background: ${props => `${props.theme.colors.primary[500]}05`};
  }
`;

const DropZoneText = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const DropZoneHint = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
`;

const PreviewContainer = styled.div`
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  background: ${props => props.theme.colors.background.primary};
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0; /* Allow truncation to work in flex container */
  overflow: hidden;
`;

const FileName = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: 2px;
  min-width: 0; /* Allow flex items to shrink below content size */
`;

const FileNameText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
`;

const FileDetails = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
`;

const RemoveButton = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.error};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  flex-shrink: 0; /* Prevent button from shrinking */
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }
`;

const CanvasContainer = styled.div`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  position: relative;
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
  color: white;
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const SourceBadge = styled.div<{ source: 'upload' | 'task' }>`
  display: inline-block;
  padding: 2px ${props => props.theme.spacing.xs};
  background: ${props => props.source === 'task' 
    ? props.theme.colors.primary[500] 
    : props.theme.colors.success};
  color: white;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  flex-shrink: 0; /* Prevent badge from shrinking */
  white-space: nowrap;
`;

interface MeshPreviewProps {
  meshObject: THREE.Object3D;
}

const MeshPreview: React.FC<MeshPreviewProps> = ({ meshObject }) => {
  return (
    <>
      <Environment preset="studio" background={false} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.6} penumbra={0.5} />
      <Center>
        <primitive object={meshObject} />
      </Center>
      <OrbitControls enablePan={false} />
    </>
  );
};

export interface MeshFileUploadWithPreviewProps {
  value: File | null;
  uploadedMeshId: string | null;
  onChange: (file: File | null, uploadedMeshId: string | null) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  label?: string;
  hint?: string;
  sourceUrl?: string; // URL from task result
  sourceTaskName?: string; // Name of source task
}

const MeshFileUploadWithPreview: React.FC<MeshFileUploadWithPreviewProps> = ({
  value,
  uploadedMeshId,
  onChange,
  acceptedFormats = ['.glb', '.obj', '.fbx', '.ply', '.stl', '.dae'],
  maxSizeMB = 200,
  label = '3D Mesh Upload',
  hint,
  sourceUrl,
  sourceTaskName
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [meshObject, setMeshObject] = useState<THREE.Object3D | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meshSource = useRef<'upload' | 'task'>('upload');

  // Load mesh for preview
  useEffect(() => {
    // Check if we have a file or valid source URL
    if (!value && (!sourceUrl || sourceUrl === 'undefined' || sourceUrl.includes('undefined'))) {
      setMeshObject(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    const loadMesh = async () => {
      try {
        let objectUrl: string;
        let fileName: string;

        if (value) {
          // Load from File
          objectUrl = URL.createObjectURL(value);
          fileName = value.name;
          meshSource.current = 'upload';
        } else if (sourceUrl && sourceUrl !== 'undefined' && !sourceUrl.includes('undefined')) {
          // Load from URL (task result)
          objectUrl = sourceUrl;
          fileName = sourceTaskName || 'Task Result';
          meshSource.current = 'task';
        } else {
          setIsLoading(false);
          return;
        }

        const extension = fileName.split('.').pop()?.toLowerCase();
        let loader: any;
        
        switch (extension) {
          case 'glb':
          case 'gltf':
            loader = new GLTFLoader();
            break;
          case 'obj':
            loader = new OBJLoader();
            break;
          case 'fbx':
            loader = new FBXLoader();
            break;
          case 'ply':
            loader = new PLYLoader();
            break;
          default:
            throw new Error(`Unsupported file format: ${extension}`);
        }

        loader.load(
          objectUrl,
          (result: any) => {
            let object3D: THREE.Object3D;

            // Handle different loader return types
            if (result.scene) {
              // GLTF
              object3D = result.scene;
            } else if (result.isBufferGeometry || result.isGeometry) {
              // PLY returns geometry
              const material = new THREE.MeshStandardMaterial({ 
                color: 0x888888,
                metalness: 0.3,
                roughness: 0.7
              });
              object3D = new THREE.Mesh(result, material);
            } else {
              // OBJ, FBX return Object3D
              object3D = result;
            }

            // Apply default material to meshes without materials
            object3D.traverse((child: any) => {
              if (child.isMesh && !child.material) {
                child.material = new THREE.MeshStandardMaterial({ 
                  color: 0x888888,
                  metalness: 0.3,
                  roughness: 0.7
                });
              }
            });

            setMeshObject(object3D);
            setIsLoading(false);

            // Clean up object URL if created
            if (value) {
              URL.revokeObjectURL(objectUrl);
            }
          },
          undefined,
          (error: any) => {
            console.error('Error loading mesh:', error);
            setLoadError('Failed to load mesh preview');
            setIsLoading(false);
            
            // Clean up object URL if created
            if (value) {
              URL.revokeObjectURL(objectUrl);
            }
          }
        );
      } catch (error) {
        console.error('Error loading mesh:', error);
        setLoadError(error instanceof Error ? error.message : 'Failed to load mesh');
        setIsLoading(false);
      }
    };

    loadMesh();
  }, [value, sourceUrl, sourceTaskName]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const meshFile = files.find(file => 
      acceptedFormats.some(format => file.name.toLowerCase().endsWith(format.replace('.', '')))
    );
    
    if (meshFile) {
      onChange(meshFile, null);
    }
  }, [acceptedFormats, onChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file, null);
    }
  }, [onChange]);

  const handleRemove = useCallback(() => {
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displayHint = hint || `Supported: ${acceptedFormats.join(', ').toUpperCase()} (max ${maxSizeMB}MB)`;
  const hasFile = value !== null || (sourceUrl !== null && sourceUrl !== undefined && sourceUrl !== 'undefined' && !sourceUrl.includes('undefined'));

  return (
    <Container>
      {!hasFile ? (
        <DropZone
          isDragOver={isDragOver}
          hasFile={hasFile}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <DropZoneText>
            {label}
          </DropZoneText>
          <DropZoneText>
            Drag & drop a mesh file here, or click to select
          </DropZoneText>
          <DropZoneHint>{displayHint}</DropZoneHint>
        </DropZone>
      ) : (
        <PreviewContainer>
          <PreviewHeader>
            <FileInfo>
              <FileName>
                <FileNameText title={value ? value.name : sourceTaskName || 'Task Result'}>
                  {value ? value.name : sourceTaskName || 'Task Result'}
                </FileNameText>
                <SourceBadge source={meshSource.current}>
                  {meshSource.current === 'task' ? 'From Task' : 'Uploaded'}
                </SourceBadge>
              </FileName>
              <FileDetails>
                {value && `Size: ${formatFileSize(value.size)}`}
                {uploadedMeshId && ` • ID: ${uploadedMeshId.substring(0, 8)}...`}
              </FileDetails>
            </FileInfo>
            <RemoveButton onClick={handleRemove}>Remove</RemoveButton>
          </PreviewHeader>
          <CanvasContainer>
            {isLoading && <LoadingOverlay>Loading preview...</LoadingOverlay>}
            {loadError && <LoadingOverlay>{loadError}</LoadingOverlay>}
            {meshObject && !isLoading && !loadError && (
              <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
                <MeshPreview meshObject={meshObject} />
              </Canvas>
            )}
          </CanvasContainer>
        </PreviewContainer>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </Container>
  );
};

export default MeshFileUploadWithPreview;

