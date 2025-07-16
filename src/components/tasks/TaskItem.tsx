import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Task } from '../../types/state';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from '../../store';
import { getFullApiUrl } from '../../utils/url';

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const TaskCard = styled.div<{ status: string }>`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => {
    switch (props.status) {
      case 'completed': return props.theme.colors.success;
      case 'failed': return props.theme.colors.error;
      case 'processing': return props.theme.colors.primary[500];
      case 'queued': return props.theme.colors.warning;
      default: return props.theme.colors.border.default;
    }
  }};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  transition: all ${props => props.theme.transitions.normal};
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.colors.primary[400]};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  ${props => props.status === 'processing' && css`
    animation: ${pulse} 2s ease-in-out infinite;
  `}
`;

const TaskHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const TaskTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0;
  flex: 1;
  margin-right: ${props => props.theme.spacing.sm};
`;

const StatusBadge = styled.span<{ status: string }>`
  background: ${props => {
    switch (props.status) {
      case 'completed': return props.theme.colors.success;
      case 'failed': return props.theme.colors.error;
      case 'processing': return props.theme.colors.primary[500];
      case 'queued': return props.theme.colors.warning;
      default: return props.theme.colors.gray[600];
    }
  }};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TaskMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
`;

const TaskType = styled.span`
  background: ${props => props.theme.colors.primary[500]}20;
  color: ${props => props.theme.colors.primary[400]};
  padding: 2px ${props => props.theme.spacing.xs};
  margin-right: 10px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.xs};
`;

const TimeInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

const PromptContainer = styled.div<{ expanded: boolean }>`
  margin-bottom: ${props => props.theme.spacing.sm};
  overflow: hidden;
`;

const PromptText = styled.p<{ expanded: boolean }>`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin: 0;
  line-height: 1.4;
  max-height: ${props => props.expanded ? 'none' : '2.8em'};
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: ${props => props.expanded ? 'none' : '2'};
  -webkit-box-orient: vertical;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary[400]};
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSize.xs};
  padding: 0;
  margin-top: ${props => props.theme.spacing.xs};

  &:hover {
    color: ${props => props.theme.colors.primary[300]};
  }
`;

const ImageGallery = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const ImageThumbnail = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: ${props => props.theme.borderRadius.md};
  overflow: hidden;
  border: 2px solid ${props => props.theme.colors.border.default};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    border-color: ${props => props.theme.colors.primary[400]};
    transform: scale(1.05);
  }
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ThumbnailPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.theme.colors.gray[700]};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.muted};
  font-size: 24px;
`;

const ThumbnailLabel = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.xs};
  text-align: center;
`;

const ProgressContainer = styled.div<{ visible: boolean }>`
  margin-bottom: ${props => props.theme.spacing.sm};
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity ${props => props.theme.transitions.normal};
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 6px;
  background: ${props => props.theme.colors.gray[700]};
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.xs};

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.progress}%;
    background: linear-gradient(90deg, 
      ${props => props.theme.colors.primary[500]}, 
      ${props => props.theme.colors.primary[400]}
    );
    transition: width ${props => props.theme.transitions.normal};
  }
`;

const ProgressText = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.sm};
  opacity: 1;
  transition: opacity ${props => props.theme.transitions.fast};

  // ${TaskCard}:hover & {
  //   opacity: 1;
  // }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'danger' }>`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  
  background: ${props => {
    switch (props.variant) {
      case 'primary': return props.theme.colors.primary[500];
      case 'danger': return props.theme.colors.error;
      default: return props.theme.colors.gray[600];
    }
  }};
  
  color: white;

  &:hover {
    transform: translateY(-1px);
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.error}20;
  color: ${props => props.theme.colors.error};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

interface TaskItemProps {
  task: Task;
  onClick: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onRetry: (taskId: string) => void;
  onDownload?: (taskId: string) => void;
  onViewInViewport?: (taskId: string) => void;
  onImportToScene?: (taskId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onClick,
  onDelete,
  onRetry,
  onDownload,
  onViewInViewport,
  onImportToScene
}) => {
  const [promptExpanded, setPromptExpanded] = useState(false);
  const settings = useSettings();

  const getFullPreviewImageUrl = (url?: string) => {
    return getFullApiUrl(url, settings.apiEndpoint);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick(task);
  };

  const formatTaskType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'failed': return '✗';
      case 'processing': return '⟲';
      case 'queued': return '⏳';
      default: return '◯';
    }
  };

  const shouldShowProgress = task.status === 'processing' || task.status === 'queued';
  const progress = task.progress || (task.status === 'queued' ? 0 : task.status === 'processing' ? 50 : 100);

  // Create thumbnail URL from file if available
  const getImageThumbnail = (file: any) => {
    if (file.url) return file.url;
    if (file.base64) return `data:${file.type};base64,${file.base64}`;
    return null;
  };

  const inputImages = task.inputData.files?.filter(file => file.type.startsWith('image/')) || [];
  const hasPreviewImage = task.result?.previewImageUrl;
  
  // Don't show input images for text-to-mesh tasks since they're text-based
  const shouldShowInputImages = !task.type.includes('text-to-mesh') && inputImages.length > 0;

  return (
    <TaskCard status={task.status} onClick={handleCardClick}>
      <TaskHeader>
        <TaskTitle title={task.name.length > 30 ? task.name : undefined}>
          {task.name.length > 30 ? task.name.substring(0, 27) + '...' : task.name}
        </TaskTitle>
        <StatusBadge status={task.status}>
          {getStatusIcon(task.status)} {task.status}
        </StatusBadge>
      </TaskHeader>

      <TaskMeta>
        <TaskType>{formatTaskType(task.type)}</TaskType>
        <TimeInfo>
          <div>Created {formatDistanceToNow(task.createdAt, { addSuffix: true })}</div>
          {task.completedAt && (
            <div>Completed {formatDistanceToNow(task.completedAt, { addSuffix: true })}</div>
          )}
          {task.processingTime && (
            <div>Processing time: {task.processingTime.toFixed(1)}s</div>
          )}
        </TimeInfo>
      </TaskMeta>

      {/* Prompt Display - Only show for text-based tasks */}
      {task.inputData.textPrompt && (task.type.includes('text-to-') || task.type.includes('text-mesh-painting')) && (
        <PromptContainer expanded={promptExpanded}>
          <PromptText expanded={promptExpanded}>
            <strong>Prompt:</strong> {task.inputData.textPrompt}
          </PromptText>
          {task.inputData.textPrompt.length > 100 && (
            <ExpandButton onClick={(e) => {
              e.stopPropagation();
              setPromptExpanded(!promptExpanded);
            }}>
              {promptExpanded ? 'Show less' : 'Show more'}
            </ExpandButton>
          )}
        </PromptContainer>
      )}

      {/* Texture Prompt */}
      {task.inputData.texturePrompt && (
        <PromptContainer expanded={false}>
          <PromptText expanded={false}>
            <strong>Texture:</strong> {task.inputData.texturePrompt}
          </PromptText>
        </PromptContainer>
      )}

      {/* Image Gallery */}
      {(shouldShowInputImages || hasPreviewImage) && (
        <ImageGallery>
          {/* Input Images - Only show for non-text-to-mesh tasks */}
          {shouldShowInputImages && inputImages.map((file, index) => {
            const thumbnailUrl = getImageThumbnail(file);
            return (
              <ImageThumbnail key={`input-${index}`}>
                {thumbnailUrl ? (
                  <ThumbnailImage src={thumbnailUrl} alt={file.name} />
                ) : (
                  <ThumbnailPlaceholder>🖼️</ThumbnailPlaceholder>
                )}
                <ThumbnailLabel>Input</ThumbnailLabel>
              </ImageThumbnail>
            );
          })}

          {/* Preview Image (when completed) */}
          {hasPreviewImage && (
            <ImageThumbnail>
              <ThumbnailImage src={getFullPreviewImageUrl(task.result!.previewImageUrl)} alt="Preview" />
              <ThumbnailLabel>Preview</ThumbnailLabel>
            </ImageThumbnail>
          )}
        </ImageGallery>
      )}

      {/* Progress Bar */}
      <ProgressContainer visible={shouldShowProgress}>
        <ProgressBar progress={progress} />
        <ProgressText>
          {task.status === 'queued' ? 'Queued...' : 
           task.status === 'processing' ? `Processing... ${progress}%` : 
           ''}
        </ProgressText>
      </ProgressContainer>

      {/* Error Message */}
      {task.error && (
        <ErrorMessage>
          <strong>Error:</strong> {task.error}
        </ErrorMessage>
      )}

      {/* Action Buttons */}
      <ActionButtons>
        {task.status === 'completed' && onImportToScene && (
          <ActionButton 
            variant="primary" 
            onClick={(e) => {
              e.stopPropagation();
              onImportToScene(task.id);
            }}
          >
            Import to Scene
          </ActionButton>
        )}
        
        {task.status === 'completed' && onDownload && task.result?.downloadUrl && (
          <ActionButton 
            onClick={(e) => {
              e.stopPropagation();
              onDownload(task.id);
            }}
          >
            Download
          </ActionButton>
        )}
        
        {/* {task.status === 'failed' && (
          <ActionButton 
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onRetry(task.id);
            }}
          >
            Retry
          </ActionButton>
        )} */}
        
        <ActionButton 
          variant="danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          Delete
        </ActionButton>
      </ActionButtons>
    </TaskCard>
  );
};

export default TaskItem; 