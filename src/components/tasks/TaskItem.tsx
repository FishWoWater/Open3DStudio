import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Task } from '../../types/state';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from '../../store';
import { getFullApiUrl } from '../../utils/url';
import { cleanModelName } from '../../utils/modelNames';
import TaskModelPreview from './TaskModelPreview';

// Helper function to abbreviate time units
const abbreviateTime = (timeString: string): string => {
  return timeString
    .replace(/\bseconds?\b/g, 'sec')
    .replace(/\bminutes?\b/g, 'mins')
    .replace(/\bhours?\b/g, 'hrs')
    .replace(/\bdays?\b/g, 'd')
    .replace(/\bmonths?\b/g, 'mo')
    .replace(/\byears?\b/g, 'y')
    .replace(/\bless than?\b/g, '<');
};

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

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: 1000;
  min-width: 140px;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const DropdownItem = styled.button`
  width: 100%;
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xs};
  cursor: pointer;
  text-align: left;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.theme.colors.background.tertiary};
  }
  
  &:first-child {
    border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
  }
  
  &:last-child {
    border-radius: 0 0 ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const ImportProgressContainer = styled.div`
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const ProgressBarWrapper = styled.div`
  width: 100%;
  height: 4px;
  background: ${props => props.theme.colors.background.tertiary};
  border-radius: ${props => props.theme.borderRadius.sm};
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const ProgressBarFill = styled.div<{ progress: number }>`
  height: 100%;
  width: ${props => props.progress}%;
  background: linear-gradient(90deg, 
    ${props => props.theme.colors.primary[500]}, 
    ${props => props.theme.colors.primary[400]}
  );
  transition: width 0.3s ease;
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const ImportProgressText = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  i {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const PreviewPlaceholder = styled.div`
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.text.muted};
  font-size: ${props => props.theme.typography.fontSize.xs};
`;

interface TaskItemProps {
  task: Task;
  onClick: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onRetry: (taskId: string) => void;
  onDownload?: (taskId: string) => void;
  onViewInViewport?: (taskId: string) => void;
  onImportToScene?: (taskId: string) => void;
  onUseAsInput?: (taskId: string) => void;
  onMeshEditing?: (taskId: string) => void;
  isImporting?: boolean;
  importProgress?: number;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onClick,
  onDelete,
  onRetry,
  onDownload,
  onViewInViewport,
  onImportToScene,
  onUseAsInput,
  onMeshEditing,
  isImporting = false,
  importProgress = 0
}) => {
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const settings = useSettings();

  // Intersection Observer to detect visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, we can stop observing (model stays loaded)
            // Comment out the next line if you want to unload when out of view
            // observer.unobserve(entry.target);
          }
        });
      },
      {
        // Start loading when the item is 100px away from viewport
        rootMargin: '100px',
        threshold: 0.01
      }
    );

    const currentCard = cardRef.current;
    if (currentCard) {
      observer.observe(currentCard);
    }

    return () => {
      if (currentCard) {
        observer.unobserve(currentCard);
      }
    };
  }, []);

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

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
  
  // If we have a persistent inputImageUrl from the API, prefer it over blob URLs
  // This ensures images persist across page refreshes
  const hasInputImageUrl = !!task.inputImageUrl;
  
  // Don't show input images for text-to-mesh tasks since they're text-based
  const shouldShowInputImages = !task.type.includes('text-to-mesh') && (hasInputImageUrl || inputImages.length > 0);

  return (
    <TaskCard ref={cardRef} status={task.status} onClick={handleCardClick}>
      <TaskHeader>
        <TaskTitle title={task.name.length > 30 ? task.name : undefined}>
          {task.name.length > 30 ? task.name.substring(0, 27) + '...' : task.name}
        </TaskTitle>
        <StatusBadge status={task.status}>
          {getStatusIcon(task.status)} {task.status}
        </StatusBadge>
      </TaskHeader>

      <TaskMeta>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <TaskType>{formatTaskType(task.type)}</TaskType>
          {task.modelPreference && (
            <TaskType style={{ background: `${task.status === 'completed' ? '#10b981' : '#6b7280'}20`, color: task.status === 'completed' ? '#10b981' : '#9ca3af' }}>
              {cleanModelName(task.modelPreference).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </TaskType>
          )}
        </div>
        <TimeInfo>
          <div>Begin: {abbreviateTime(formatDistanceToNow(task.createdAt, { addSuffix: true }))}</div>
          {task.completedAt && (
            <div>Done: {abbreviateTime(formatDistanceToNow(task.completedAt, { addSuffix: true }))}</div>
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
          {shouldShowInputImages && (
            <>
              {/* Prefer persistent inputImageUrl from API over ephemeral blob URLs */}
              {hasInputImageUrl ? (
                <ImageThumbnail key="input-api">
                  <ThumbnailImage 
                    src={getFullPreviewImageUrl(task.inputImageUrl)} 
                    alt="Input image"
                    loading="lazy"
                  />
                  <ThumbnailLabel>Input</ThumbnailLabel>
                </ImageThumbnail>
              ) : (
                /* Fallback to blob URLs from files (only available before refresh) */
                inputImages.map((file, index) => {
                  const thumbnailUrl = getImageThumbnail(file);
                  return (
                    <ImageThumbnail key={`input-${index}`}>
                      {thumbnailUrl ? (
                        <ThumbnailImage src={thumbnailUrl} alt={file.name} loading="lazy" />
                      ) : (
                        <ThumbnailPlaceholder>🖼️</ThumbnailPlaceholder>
                      )}
                      <ThumbnailLabel>Input</ThumbnailLabel>
                    </ImageThumbnail>
                  );
                })
              )}
            </>
          )}

          {/* Preview Image (when completed) */}
          {hasPreviewImage && (
            <ImageThumbnail>
              <ThumbnailImage 
                src={getFullPreviewImageUrl(task.result!.previewImageUrl)} 
                alt="Preview"
                loading="lazy"
              />
              <ThumbnailLabel>Preview</ThumbnailLabel>
            </ImageThumbnail>
          )}
        </ImageGallery>
      )}

      {/* 3D Model Preview - Show for completed tasks with downloadUrl, but only when visible */}
      {task.status === 'completed' && task.result?.downloadUrl && (
        <>
          {isVisible ? (
            <TaskModelPreview
              downloadUrl={getFullApiUrl(task.result.downloadUrl, settings.apiEndpoint) || ''}
              format={task.result.format}
            />
          ) : (
            <PreviewPlaceholder>
              <i className="fas fa-cube"></i>&nbsp; 3D Preview (scroll to load)
            </PreviewPlaceholder>
          )}
        </>
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

      {/* Import Progress */}
      {isImporting && (
        <ImportProgressContainer>
          <ProgressBarWrapper>
            <ProgressBarFill progress={importProgress} />
          </ProgressBarWrapper>
          <ImportProgressText>
            <i className="fas fa-spinner"></i>
            Importing model... {Math.round(importProgress)}%
          </ImportProgressText>
        </ImportProgressContainer>
      )}

      {/* Action Buttons */}
      <ActionButtons>
        {/* Primary action: Import */}
        {task.status === 'completed' && onImportToScene && (
          <ActionButton 
            variant="primary" 
            onClick={(e) => {
              e.stopPropagation();
              onImportToScene(task.id);
            }}
          >
            Import
          </ActionButton>
        )}
        
        {/* Secondary actions dropdown: More */}
        {task.status === 'completed' && task.result?.downloadUrl && (
          <DropdownContainer ref={dropdownRef}>
            <ActionButton 
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(!dropdownOpen);
              }}
            >
              ⋮ More
            </ActionButton>
            <DropdownMenu isOpen={dropdownOpen}>
              {onMeshEditing && (
                <DropdownItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    onMeshEditing(task.id);
                  }}
                >
                  Mesh Editing
                </DropdownItem>
              )}
              {onUseAsInput && (
                <DropdownItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    onUseAsInput(task.id);
                  }}
                >
                  Reuse
                </DropdownItem>
              )}
              {onDownload && (
                <DropdownItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpen(false);
                    onDownload(task.id);
                  }}
                >
                  Download
                </DropdownItem>
              )}
            </DropdownMenu>
          </DropdownContainer>
        )}
        
        {/* Danger action: Delete */}
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