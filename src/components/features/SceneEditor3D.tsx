/**
 * 3D Scene Editor Component
 * Visual editor for placing and arranging 3D assets in the game
 * Uses @react-three/fiber and @react-three/drei (already installed)
 */

import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, TransformControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface SceneObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'platform' | 'custom';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  modelUrl?: string;
}

interface SceneEditor3DProps {
  onSceneChange?: (objects: SceneObject[]) => void;
}

const EditorObject: React.FC<{
  object: SceneObject;
  isSelected: boolean;
  onSelect: () => void;
  onTransform: (position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void;
}> = ({ object, isSelected, onSelect, onTransform }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const handleTransform = () => {
    if (meshRef.current) {
      onTransform(
        meshRef.current.position.toArray() as [number, number, number],
        meshRef.current.rotation.toArray().slice(0, 3) as [number, number, number],
        meshRef.current.scale.toArray() as [number, number, number]
      );
    }
  };

  const renderGeometry = () => {
    switch (object.type) {
      case 'cube':
      case 'platform':
        return <boxGeometry args={object.scale} />;
      case 'sphere':
        return <sphereGeometry args={[object.scale[0], 32, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[object.scale[0], object.scale[0], object.scale[1], 32]} />;
      default:
        return <boxGeometry args={object.scale} />;
    }
  };

  return (
    <group>
      <mesh
        ref={meshRef}
        position={object.position}
        rotation={object.rotation}
        scale={object.scale}
        onClick={onSelect}
        castShadow
        receiveShadow
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={object.color}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {isSelected && (
        <TransformControls
          object={meshRef.current!}
          mode="translate"
          onMouseUp={handleTransform}
        />
      )}
    </group>
  );
};

export const SceneEditor3D: React.FC<SceneEditor3DProps> = ({ onSceneChange }) => {
  const [objects, setObjects] = useState<SceneObject[]>([
    {
      id: 'ground',
      name: 'Ground',
      type: 'platform',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [20, 0.5, 20],
      color: '#45b7d1'
    }
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');

  const addObject = (type: SceneObject['type']) => {
    const newObject: SceneObject = {
      id: `object_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${objects.length}`,
      type,
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      scale: type === 'platform' ? [4, 0.5, 4] : [1, 1, 1],
      color: type === 'platform' ? '#45b7d1' : '#4ecdc4'
    };

    const newObjects = [...objects, newObject];
    setObjects(newObjects);
    setSelectedId(newObject.id);
    onSceneChange?.(newObjects);
  };

  const deleteSelected = () => {
    if (!selectedId) return;

    const newObjects = objects.filter(obj => obj.id !== selectedId);
    setObjects(newObjects);
    setSelectedId(null);
    onSceneChange?.(newObjects);
  };

  const updateObject = (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => {
    const newObjects = objects.map(obj =>
      obj.id === id ? { ...obj, position, rotation, scale } : obj
    );
    setObjects(newObjects);
    onSceneChange?.(newObjects);
  };

  const selectedObject = objects.find(obj => obj.id === selectedId);

  return (
    <Container>
      <EditorCanvas>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[15, 15, 15]} />
          <OrbitControls makeDefault />

          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <hemisphereLight args={['#87ceeb', '#8b7355', 0.3]} />

          {/* Grid */}
          <Grid
            args={[50, 50]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#6e6e6e"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#9d4b4b"
            fadeDistance={50}
            fadeStrength={1}
            followCamera={false}
          />

          {/* Scene Objects */}
          {objects.map((obj) => (
            <EditorObject
              key={obj.id}
              object={obj}
              isSelected={obj.id === selectedId}
              onSelect={() => setSelectedId(obj.id)}
              onTransform={(pos, rot, scale) => updateObject(obj.id, pos, rot, scale)}
            />
          ))}
        </Canvas>
      </EditorCanvas>

      <Toolbar>
        <ToolbarSection>
          <SectionTitle>Add Objects</SectionTitle>
          <ButtonGroup>
            <ToolButton onClick={() => addObject('cube')}>
              <ButtonIcon>🟦</ButtonIcon>
              Cube
            </ToolButton>
            <ToolButton onClick={() => addObject('sphere')}>
              <ButtonIcon>⚪</ButtonIcon>
              Sphere
            </ToolButton>
            <ToolButton onClick={() => addObject('cylinder')}>
              <ButtonIcon>🛢️</ButtonIcon>
              Cylinder
            </ToolButton>
            <ToolButton onClick={() => addObject('platform')}>
              <ButtonIcon>▭</ButtonIcon>
              Platform
            </ToolButton>
          </ButtonGroup>
        </ToolbarSection>

        {selectedObject && (
          <ToolbarSection>
            <SectionTitle>Selected: {selectedObject.name}</SectionTitle>
            <PropertyGrid>
              <PropertyLabel>Position</PropertyLabel>
              <PropertyValue>
                X: {selectedObject.position[0].toFixed(1)},
                Y: {selectedObject.position[1].toFixed(1)},
                Z: {selectedObject.position[2].toFixed(1)}
              </PropertyValue>

              <PropertyLabel>Scale</PropertyLabel>
              <PropertyValue>
                X: {selectedObject.scale[0].toFixed(1)},
                Y: {selectedObject.scale[1].toFixed(1)},
                Z: {selectedObject.scale[2].toFixed(1)}
              </PropertyValue>
            </PropertyGrid>
            <DangerButton onClick={deleteSelected}>
              🗑️ Delete
            </DangerButton>
          </ToolbarSection>
        )}

        <ToolbarSection>
          <SectionTitle>Tools</SectionTitle>
          <ButtonGroup>
            <ToolButton
              $active={transformMode === 'translate'}
              onClick={() => setTransformMode('translate')}
            >
              ⬌ Move
            </ToolButton>
            <ToolButton
              $active={transformMode === 'rotate'}
              onClick={() => setTransformMode('rotate')}
            >
              🔄 Rotate
            </ToolButton>
            <ToolButton
              $active={transformMode === 'scale'}
              onClick={() => setTransformMode('scale')}
            >
              ⤢ Scale
            </ToolButton>
          </ButtonGroup>
        </ToolbarSection>

        <InfoPanel>
          <InfoText>
            💡 Click objects to select, drag with gizmo to move
          </InfoText>
        </InfoPanel>
      </Toolbar>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
`;

const EditorCanvas = styled.div`
  flex: 1;
  height: 600px;
  background: #0f0f23;
  border-radius: 8px;
  overflow: hidden;
`;

const Toolbar = styled.div`
  width: 300px;
  background: #16213e;
  padding: 20px;
  overflow-y: auto;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
`;

const ToolbarSection = styled.div`
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h3`
  color: white;
  font-size: 14px;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const ToolButton = styled.button<{ $active?: boolean }>`
  background: ${props => props.$active ? '#4ecdc4' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  border: 1px solid ${props => props.$active ? '#4ecdc4' : 'rgba(255, 255, 255, 0.2)'};
  padding: 12px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &:hover {
    background: ${props => props.$active ? '#4ecdc4' : 'rgba(255, 255, 255, 0.15)'};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ButtonIcon = styled.span`
  font-size: 20px;
`;

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
`;

const PropertyLabel = styled.div`
  color: #aaa;
  font-weight: 500;
`;

const PropertyValue = styled.div`
  color: white;
  font-family: monospace;
`;

const DangerButton = styled.button`
  width: 100%;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 107, 107, 0.3);
  }
`;

const InfoPanel = styled.div`
  background: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.3);
  padding: 12px;
  border-radius: 6px;
  margin-top: 16px;
`;

const InfoText = styled.p`
  color: #4ecdc4;
  font-size: 12px;
  margin: 0;
  line-height: 1.5;
`;
