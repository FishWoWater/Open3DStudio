import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useViewport, useStoreActions, useSystem } from '../../store';
import { getApiClient } from '../../api/client';
import { RenderMode, ViewportTool } from '../../types/state';

const BottomBarContainer = styled.footer`
  background: ${props => props.theme.colors.background.secondary};
  border-top: 1px solid ${props => props.theme.colors.border.default};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  flex-shrink: 0;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ControlButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active 
    ? props.theme.colors.primary[500]
    : 'transparent'
  };
  border: 1px solid ${props => props.active 
    ? props.theme.colors.primary[500]
    : props.theme.colors.border.default
  };
  color: ${props => props.active 
    ? 'white'
    : props.theme.colors.text.secondary
  };
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.active 
      ? props.theme.colors.primary[600]
      : 'rgba(255, 255, 255, 0.05)'
    };
    border-color: ${props => props.active 
      ? props.theme.colors.primary[600]
      : props.theme.colors.border.hover
    };
    color: ${props => props.active 
      ? 'white'
      : props.theme.colors.text.primary
    };
  }
`;

const Separator = styled.div`
  width: 1px;
  height: 20px;
  background: ${props => props.theme.colors.border.default};
  margin: 0 ${props => props.theme.spacing.sm};
`;

const StatusInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
`;

const StatusIndicator = styled.div<{ online: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.online 
      ? props.theme.colors.success
      : props.theme.colors.error
    };
    animation: ${props => props.online ? 'pulse 2s infinite' : 'none'};
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const SystemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
`;

const PerformanceInfo = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
  
  span {
    margin-right: ${props => props.theme.spacing.sm};
  }
`;

const sceneTools: { id: ViewportTool; icon: string; title: string }[] = [
  { id: 'select', icon: 'fas fa-mouse-pointer', title: 'Select (Q)' },
  { id: 'move', icon: 'fas fa-arrows-alt', title: 'Move (W)' },
  { id: 'rotate', icon: 'fas fa-sync-alt', title: 'Rotate (E)' },
  { id: 'scale', icon: 'fas fa-expand-arrows-alt', title: 'Scale (R)' }
];

const renderModes: { id: RenderMode; icon: string; title: string; description: string; requiresFeature?: string }[] = [
  { id: 'solid', icon: 'fas fa-cube', title: 'Solid', description: 'Solid shaded rendering with basic lighting' },
  { id: 'wireframe', icon: 'fas fa-project-diagram', title: 'Wireframe', description: 'Wireframe view showing mesh topology' },
  { id: 'rendered', icon: 'fas fa-eye', title: 'Rendered', description: 'Full rendering with original materials and textures' },
//   { id: 'material', icon: 'fas fa-palette', title: 'Material', description: 'Material preview with advanced lighting' },
  { id: 'parts', icon: 'fas fa-puzzle-piece', title: 'Show Parts', description: 'Colorize each mesh part with different colors', requiresFeature: 'parts' },
  { id: 'skeleton', icon: 'fas fa-user-tie', title: 'Show Skeleton', description: 'Show skeleton bones and connections (transparent mesh)', requiresFeature: 'skeleton' }
];

const BottomBar: React.FC = () => {
  const viewport = useViewport();
  const system = useSystem();
  const { 
    setRenderMode, 
    setCurrentTool,
    deleteSelectedModels,
    updateSystemStatus 
  } = useStoreActions();
  const [featuresCount, setFeaturesCount] = useState(0);
  const [modelsCount, setModelsCount] = useState(0);

  // Check API connection and get system status
  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const apiClient = getApiClient();
        
        // Check basic connectivity
        const healthStatus = await apiClient.getHealthStatus();
        const isConnected = healthStatus.status === 'healthy';
        
        // Get features and models count
        try {
          const features = await apiClient.getAvailableFeatures();
          const models = await apiClient.getAvailableModels();
          
          setFeaturesCount(features.total_features || 0);
          setModelsCount(models.total_models || 0);
        } catch (err) {
          // If features/models call fails, still mark as connected if health check passed
          console.warn('Failed to get features/models:', err);
          setFeaturesCount(0);
          setModelsCount(0);
        }
        
        updateSystemStatus({ 
          isOnline: isConnected,
          lastChecked: new Date()
        });
        
      } catch (error) {
        console.warn('API connection check failed:', error);
        updateSystemStatus({ 
          isOnline: false,
          lastChecked: new Date()
        });
        setFeaturesCount(0);
        setModelsCount(0);
      }
    };

    // Initial check
    checkSystemStatus();

    // Check every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);

    return () => clearInterval(interval);
  }, [updateSystemStatus]);

  const handleToolSelect = (toolId: ViewportTool) => {
    setCurrentTool(toolId);
  };

  const handleRenderModeChange = (mode: RenderMode) => {
    setRenderMode(mode);
  };

  const handleDeleteSelected = () => {
    if (viewport.selection.length > 0) {
      deleteSelectedModels();
    }
  };

  // Check if any loaded models support parts or skeleton features
  const hasPartsSupport = viewport.loadedModels.some(model => model.parts?.hasParts);
  const hasSkeletonSupport = viewport.loadedModels.some(model => model.skeleton && model.skeleton.bones.length > 0);

  // Filter render modes based on model capabilities
  const availableRenderModes = renderModes.filter(mode => {
    if (mode.requiresFeature === 'parts') return hasPartsSupport;
    if (mode.requiresFeature === 'skeleton') return hasSkeletonSupport;
    return true;
  });

  return (
    <BottomBarContainer>
      {/* Scene Controls */}
      <ControlGroup>
        {sceneTools.map(tool => (
          <ControlButton
            key={tool.id}
            active={viewport.currentTool === tool.id}
            onClick={() => handleToolSelect(tool.id)}
            title={tool.title}
          >
            <i className={tool.icon}></i>
          </ControlButton>
        ))}
        
        <Separator />
        
        <ControlButton 
          title={`Delete Selected (${viewport.selection.length})`}
          onClick={handleDeleteSelected}
          style={{ 
            opacity: viewport.selection.length > 0 ? 1 : 0.5,
            cursor: viewport.selection.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <i className="fas fa-trash"></i>
        </ControlButton>
      </ControlGroup>

      {/* Render Modes */}
      <ControlGroup>
        {availableRenderModes.map(mode => (
          <ControlButton
            key={mode.id}
            active={viewport.renderMode === mode.id}
            onClick={() => handleRenderModeChange(mode.id)}
            title={`${mode.title}: ${mode.description}`}
          >
            <i className={mode.icon}></i>
          </ControlButton>
        ))}
      </ControlGroup>

      {/* Status Information */}
      <StatusInfo>
        <StatusIndicator online={system.isOnline}>
          {system.isOnline ? 'Connected' : 'Disconnected'}
        </StatusIndicator>
        
        <SystemInfo>
          <span>Features: {featuresCount}</span>
          <span>Models: {modelsCount}</span>
        </SystemInfo>
        
        <PerformanceInfo>
          <span>FPS: {Math.round(system.performance.frameRate)}</span>
          <span>CPU: {Math.round(system.performance.cpuUsage)}%</span>
          <span>Memory: {Math.round(system.performance.memoryUsage)}%</span>
        </PerformanceInfo>
      </StatusInfo>
    </BottomBarContainer>
  );
};

export default BottomBar; 