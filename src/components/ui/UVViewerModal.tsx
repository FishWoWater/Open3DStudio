import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as THREE from 'three';
import { LoadedModel } from '../../types/state';

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.xl};
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
`;

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xl};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 28px;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color ${props => props.theme.transitions.fast};

  &:hover {
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ViewerContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  overflow-y: auto;
`;

const CanvasContainer = styled.div`
  width: 100%;
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border.default};
  overflow: hidden;
  position: relative;
  aspect-ratio: 1;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const Controls = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  justify-content: space-between;
`;

const ControlGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
`;

const ControlButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.background.secondary};
    border-color: ${props => props.theme.colors.primary[500]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const InfoText = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.sm};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
`;

const NoUVMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
  gap: ${props => props.theme.spacing.sm};
  min-height: 400px;
  
  i {
    font-size: 48px;
    opacity: 0.5;
  }
`;

interface UVViewerModalProps {
  isOpen: boolean;
  model: LoadedModel | null;
  onClose: () => void;
}

const UVViewerModal: React.FC<UVViewerModalProps> = ({ isOpen, model, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasUVs, setHasUVs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [uvStats, setUvStats] = useState({ faces: 0, vertices: 0 });

  useEffect(() => {
    if (!isOpen || !model || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to get canvas context');
        return;
      }

      // Set canvas size
      const size = 800;
      canvas.width = size;
      canvas.height = size;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, size, size);

      // Draw grid
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      const gridSize = 10;
      for (let i = 0; i <= gridSize; i++) {
        const pos = (i / gridSize) * size;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(size, pos);
        ctx.stroke();
      }

      // Draw border
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, size, size);

      // Extract UV coordinates from the model
      let foundUVs = false;
      let totalFaces = 0;
      let totalVertices = 0;

      if (model.object3D) {
        model.object3D.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.geometry) {
            const geometry = child.geometry;
            const uvAttribute = geometry.attributes.uv;

            if (uvAttribute) {
              foundUVs = true;
              const uvs = uvAttribute.array;
              totalVertices += uvs.length / 2;

              // Get index or create sequential indices
              const indices = geometry.index 
                ? geometry.index.array 
                : Array.from({ length: uvs.length / 2 }, (_, i) => i);

              // Draw UV wireframe
              ctx.strokeStyle = '#4ecdc4';
              ctx.lineWidth = 1.5;

              // Draw triangles
              for (let i = 0; i < indices.length; i += 3) {
                const i0 = indices[i] * 2;
                const i1 = indices[i + 1] * 2;
                const i2 = indices[i + 2] * 2;

                const u0 = uvs[i0];
                const v0 = 1 - uvs[i0 + 1]; // Flip V coordinate
                const u1 = uvs[i1];
                const v1 = 1 - uvs[i1 + 1];
                const u2 = uvs[i2];
                const v2 = 1 - uvs[i2 + 1];

                // Draw triangle
                ctx.beginPath();
                ctx.moveTo(u0 * size, v0 * size);
                ctx.lineTo(u1 * size, v1 * size);
                ctx.lineTo(u2 * size, v2 * size);
                ctx.closePath();
                ctx.stroke();

                totalFaces++;
              }

              // Draw UV points
              ctx.fillStyle = '#ff6b6b';
              for (let i = 0; i < uvs.length; i += 2) {
                const u = uvs[i];
                const v = 1 - uvs[i + 1]; // Flip V coordinate
                ctx.beginPath();
                ctx.arc(u * size, v * size, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        });
      }

      setHasUVs(foundUVs);
      setUvStats({ faces: totalFaces, vertices: totalVertices });

      if (!foundUVs) {
        setError('This model does not have UV coordinates');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error('Error rendering UV layout:', err);
      setError(err instanceof Error ? err.message : 'Failed to render UV layout');
      setHasUVs(false);
    }
  }, [isOpen, model, zoom]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${model?.name || 'model'}_uv_layout.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoom(1);

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>UV Layout Viewer - {model?.name || 'Unknown Model'}</ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <ViewerContainer>
          {error && !hasUVs ? (
            <NoUVMessage>
              <i className="fas fa-map"></i>
              <div>{error}</div>
              <div style={{ fontSize: '12px', opacity: 0.7 }}>
                The selected model needs UV unwrapping before viewing
              </div>
            </NoUVMessage>
          ) : (
            <>
              <CanvasContainer>
                <Canvas ref={canvasRef} style={{ transform: `scale(${zoom})` }} />
              </CanvasContainer>

              <Controls>
                <ControlGroup>
                  <ControlButton onClick={handleZoomOut} disabled={zoom <= 0.5}>
                    <i className="fas fa-search-minus"></i>
                  </ControlButton>
                  <ControlButton onClick={handleZoomReset}>
                    {Math.round(zoom * 100)}%
                  </ControlButton>
                  <ControlButton onClick={handleZoomIn} disabled={zoom >= 3}>
                    <i className="fas fa-search-plus"></i>
                  </ControlButton>
                </ControlGroup>

                <InfoText>
                  {uvStats.vertices} UV vertices • {uvStats.faces} faces
                </InfoText>

                <ControlButton onClick={handleDownload} disabled={!hasUVs}>
                  <i className="fas fa-download"></i> Download
                </ControlButton>
              </Controls>
            </>
          )}
        </ViewerContainer>
      </ModalContent>
    </ModalOverlay>
  );
};

export default UVViewerModal;

