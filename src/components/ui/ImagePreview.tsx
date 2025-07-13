import React, { useState, useCallback } from 'react';
import styled from 'styled-components';

const PreviewContainer = styled.div`
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.primary};
  margin-top: ${props => props.theme.spacing.sm};
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const FileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const FileName = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const FileSize = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.error};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => `${props.theme.colors.error}15`};
  }
`;

const ImageContainer = styled.div`
  position: relative;
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  background: ${props => props.theme.colors.gray[800]};
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  display: block;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.sm};
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
`;

const LoadingMessage = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
`;

export interface ImagePreviewProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ file, onRemove, className }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  React.useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setIsLoading(false);

      // Cleanup URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  }, [file]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <PreviewContainer className={className}>
      <PreviewHeader>
        <FileInfo>
          <FileName>{file.name}</FileName>
          <FileSize>{formatFileSize(file.size)}</FileSize>
        </FileInfo>
        <RemoveButton onClick={onRemove} title="Remove image">
          ✕
        </RemoveButton>
      </PreviewHeader>
      
      <ImageContainer>
        {isLoading && (
          <LoadingMessage>Loading image...</LoadingMessage>
        )}
        
        {hasError && (
          <ErrorMessage>
            Failed to load image preview
          </ErrorMessage>
        )}
        
        {imageUrl && !hasError && (
          <PreviewImage
            src={imageUrl}
            alt={file.name}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
      </ImageContainer>
    </PreviewContainer>
  );
};

export default ImagePreview; 