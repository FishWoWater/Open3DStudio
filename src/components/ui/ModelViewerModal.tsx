import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Task } from '../../types/state';

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.default};
  width: 90vw;
  height: 90vh;
  max-width: 1200px;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 24px;
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  
  &:hover {
    background: ${props => props.theme.colors.background.tertiary};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ViewerContainer = styled.div`
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
`;

const LoadingOverlay = styled.div<{ visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${props => props.visible ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: ${props => props.theme.colors.text.primary};
  z-index: 10;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
`;

const ControlsBar = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
`;

const ControlButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active 
    ? props.theme.colors.primary[500] 
    : props.theme.colors.background.tertiary};
  color: ${props => props.active 
    ? 'white' 
    : props.theme.colors.text.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.sm};
  
  &:hover {
    background: ${props => props.active 
      ? props.theme.colors.primary[600] 
      : props.theme.colors.background.primary};
  }
`;

const ModelInfo = styled.div`
  margin-left: auto;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

interface ModelViewerModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
}

const ModelViewerModal: React.FC<ModelViewerModalProps> = ({
  isOpen,
  task,
  onClose
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const frameRef = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [modelInfo, setModelInfo] = useState<{ vertices: number; faces: number } | null>(null);

  // Initialize Three.js scene
  const initializeScene = () => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // Use outputColorSpace for Three.js r152+
    (renderer as any).outputColorSpace = 'srgb';
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Additional lighting for better model visibility
    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(-10, 5, 5);
    scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff, 0.3);
    light3.position.set(0, -10, 5);
    scene.add(light3);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
    scene.add(gridHelper);
  };

  // Cleanup Three.js scene
  const cleanupScene = () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      // Dispose of geometries and materials
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      modelRef.current = null;
    }

    if (rendererRef.current && mountRef.current) {
      rendererRef.current.dispose();
      if (mountRef.current.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current = null;
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
      controlsRef.current = null;
    }

    sceneRef.current = null;
    cameraRef.current = null;
  };

  // Animation loop
  const animate = () => {
    frameRef.current = requestAnimationFrame(animate);
    
    if (controlsRef.current) {
      controlsRef.current.update();
    }
    
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  // Load model
  const loadModel = async (url: string, format: string) => {
    if (!sceneRef.current) return;

    setLoading(true);
    setError(null);
    setModelInfo(null);

    try {
      let loader: GLTFLoader | OBJLoader | FBXLoader | PLYLoader;
      
      switch (format.toLowerCase()) {
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
          throw new Error(`Unsupported format: ${format}`);
      }

      const loadPromise = new Promise((resolve, reject) => {
        loader.load(
          url,
          (result) => resolve(result),
          (progress) => console.log('Loading progress:', progress),
          (error) => reject(error)
        );
      });

      const result = await loadPromise;
      let model: THREE.Object3D;

      if (format.toLowerCase() === 'glb' || format.toLowerCase() === 'gltf') {
        model = (result as any).scene;
      } else if (format.toLowerCase() === 'ply') {
        const geometry = result as THREE.BufferGeometry;
        // Ensure geometry has proper normals for lighting
        if (!geometry.attributes.normal) {
          geometry.computeVertexNormals();
        }
        const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
        model = new THREE.Mesh(geometry, material);
      } else {
        model = result as THREE.Object3D;
      }

      // Remove previous model
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
      }

      // Ensure all geometries have proper normals for lighting
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }
        }
      });

      // Add new model
      sceneRef.current.add(model);
      modelRef.current = model;

      // Center and scale model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim; // Scale to fit in 5 unit cube

      model.position.sub(center);
      model.scale.setScalar(scale);

      // Update camera position
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(7, 7, 7);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      // Calculate model info
      let vertices = 0;
      let faces = 0;
      model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          if (child.geometry.attributes.position) {
            vertices += child.geometry.attributes.position.count;
          }
          if (child.geometry.index) {
            faces += child.geometry.index.count / 3;
          }
        }
      });

      setModelInfo({ vertices, faces });
      setLoading(false);

    } catch (err) {
      console.error('Failed to load model:', err);
      setError(err instanceof Error ? err.message : 'Failed to load model');
      setLoading(false);
    }
  };

  // Toggle wireframe mode
  const toggleWireframe = () => {
    if (!modelRef.current) return;

    const newWireframe = !wireframe;
    setWireframe(newWireframe);

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            material.wireframe = newWireframe;
          });
        } else {
          child.material.wireframe = newWireframe;
        }
      }
    });
  };

  // Reset camera
  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(7, 7, 7);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Handle window resize
  const handleResize = () => {
    if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  };

  // Initialize scene when modal opens
  useEffect(() => {
    if (isOpen && mountRef.current) {
      initializeScene();
      animate();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cleanupScene();
      };
    } else {
      cleanupScene();
    }
  }, [isOpen]);

  // Load model when task changes
  useEffect(() => {
    if (isOpen && task?.result?.downloadUrl) {
      const format = task.result.format || 'glb';
      loadModel(task.result.downloadUrl, format);
    }
  }, [isOpen, task]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            3D Model Viewer - {task?.name || 'Unknown Model'}
          </ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <ViewerContainer ref={mountRef}>
          <LoadingOverlay visible={loading}>
            <div>Loading 3D model...</div>
          </LoadingOverlay>
          
          {error && (
            <LoadingOverlay visible={true}>
              <ErrorMessage>
                <div>Failed to load 3D model</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>{error}</div>
              </ErrorMessage>
            </LoadingOverlay>
          )}
        </ViewerContainer>

        <ControlsBar>
          <ControlButton onClick={toggleWireframe} active={wireframe}>
            Wireframe
          </ControlButton>
          <ControlButton onClick={resetCamera}>
            Reset View
          </ControlButton>
          
          {modelInfo && (
            <ModelInfo>
              {modelInfo.vertices.toLocaleString()} vertices • {Math.round(modelInfo.faces).toLocaleString()} faces
            </ModelInfo>
          )}
        </ControlsBar>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ModelViewerModal; 