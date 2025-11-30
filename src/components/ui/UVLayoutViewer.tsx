import React, { useState } from 'react';
import styled from 'styled-components';

const ViewerContainer = styled.div`
  width: 100%;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border.default};
  overflow: hidden;
`;

const ViewerHeader = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.primary};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ViewerTitle = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const ViewerControls = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
`;

const ControlButton = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.background.tertiary};
    border-color: ${props => props.theme.colors.primary[500]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImageContainer = styled.div<{ zoom: number }>`
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  background: ${props => props.theme.colors.background.primary};
  position: relative;
`;

const UVImage = styled.img<{ zoom: number }>`
  max-width: none;
  width: ${props => props.zoom * 100}%;
  height: auto;
  display: block;
  image-rendering: ${props => props.zoom > 2 ? 'pixelated' : 'auto'};
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.sm};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
`;

const PlaceholderContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  gap: ${props => props.theme.spacing.sm};
`;

const PlaceholderIcon = styled.div`
  font-size: 48px;
  opacity: 0.5;
`;

const ZoomIndicator = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  background: ${props => `${props.theme.colors.background.secondary}CC`};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
  backdrop-filter: blur(4px);
`;

interface UVLayoutViewerProps {
  imageUrl?: string;
  title?: string;
  loading?: boolean;
  error?: string;
  onDownload?: () => void;
}

const UVLayoutViewer: React.FC<UVLayoutViewerProps> = ({
  imageUrl,
  title = 'UV Layout',
  loading = false,
  error,
  onDownload
}) => {
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(null);
  };

  const handleImageError = () => {
    setImageError('Failed to load UV layout image');
    setImageLoaded(false);
  };

  const handleDownload = () => {
    if (imageUrl && onDownload) {
      onDownload();
    } else if (imageUrl) {
      // Default download behavior
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = 'uv_layout.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <ViewerContainer>
      <ViewerHeader>
        <ViewerTitle>{title}</ViewerTitle>
        <ViewerControls>
          <ControlButton onClick={handleZoomOut} disabled={zoom <= 0.25 || !imageUrl}>
            -
          </ControlButton>
          <ControlButton onClick={handleZoomReset} disabled={!imageUrl}>
            {Math.round(zoom * 100)}%
          </ControlButton>
          <ControlButton onClick={handleZoomIn} disabled={zoom >= 4 || !imageUrl}>
            +
          </ControlButton>
          {(onDownload || imageUrl) && (
            <ControlButton onClick={handleDownload} disabled={!imageUrl}>
              Download
            </ControlButton>
          )}
        </ViewerControls>
      </ViewerHeader>

      <ImageContainer zoom={zoom}>
        {loading ? (
          <LoadingContainer>
            Loading UV layout...
          </LoadingContainer>
        ) : error || imageError ? (
          <ErrorContainer>
            {error || imageError}
          </ErrorContainer>
        ) : imageUrl ? (
          <>
            <UVImage
              src={imageUrl}
              alt="UV Layout"
              zoom={zoom}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            <ZoomIndicator>{Math.round(zoom * 100)}%</ZoomIndicator>
          </>
        ) : (
          <PlaceholderContainer>
            <PlaceholderIcon>🗺️</PlaceholderIcon>
            <div>No UV layout available</div>
            <div style={{ fontSize: '11px', opacity: 0.7 }}>
              UV layout will appear here after unwrapping is complete
            </div>
          </PlaceholderContainer>
        )}
      </ImageContainer>
    </ViewerContainer>
  );
};

export default UVLayoutViewer;

