import React from 'react';
import styled from 'styled-components';
import { useCurrentModule, useCurrentFeature } from '../../store';
import GameStudioPanel from '../features/GameStudioPanel';
import MeshGenerationPanel from '../features/MeshGenerationPanel';
import MeshPaintingPanel from '../features/MeshPaintingPanel';
import MeshSegmentationPanel from '../features/MeshSegmentationPanel';
import PartCompletionPanel from '../features/PartCompletionPanel';
import AutoRiggingPanel from '../features/AutoRiggingPanel';
import MeshRetopologyPanel from '../features/MeshRetopologyPanel';
import MeshUVUnwrappingPanel from '../features/MeshUVUnwrappingPanel';
import PromptToGamePanel from '../features/PromptToGamePanel';

const SidebarContainer = styled.aside<{ isCollapsed: boolean; width: number }>`
  width: ${props => props.isCollapsed ? '0' : `${props.width}px`};
  background: ${props => props.theme.colors.background.secondary};
  border-right: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  transition: ${props => props.theme.transitions.normal};
`;

const SidebarHeader = styled.div`
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  background: linear-gradient(135deg, 
    ${props => props.theme.colors.background.secondary} 0%, 
    ${props => props.theme.colors.background.tertiary} 100%
  );

  h3 {
    font-size: ${props => props.theme.typography.fontSize.lg};
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
    letter-spacing: -0.01em;
    color: ${props => props.theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: 10px;

    &::before {
      content: '';
      width: 4px;
      height: 20px;
      background: linear-gradient(135deg, 
        ${props => props.theme.colors.primary[600]} 0%, 
        ${props => props.theme.colors.primary[500]} 100%
      );
      border-radius: 2px;
    }
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.lg};
  scroll-behavior: smooth;
`;

interface LeftSidebarProps {
  isCollapsed: boolean;
  width: number;
}

const moduleNames: Record<string, string> = {
  'game-studio': 'Game Studio',
  'playable-generator': 'Prompt-to-Game',
  'mesh-generation': 'Mesh Generation',
  'mesh-painting': 'Mesh Painting',
  'mesh-segmentation': 'Mesh Segmentation',
  'part-completion': 'Part Completion',
  'auto-rigging': 'Auto Rigging',
  'mesh-retopology': 'Mesh Retopology',
  'mesh-uv-unwrapping': 'UV Unwrapping'
};

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isCollapsed, width }) => {
  const currentModule = useCurrentModule();
  const currentFeature = useCurrentFeature();

  const renderFeaturePanel = () => {
    switch (currentModule) {
      case 'game-studio':
        return <GameStudioPanel />;
      case 'playable-generator':
        return <PromptToGamePanel />;
      case 'mesh-generation':
        return <MeshGenerationPanel />;
      case 'mesh-painting':
        return <MeshPaintingPanel />;
      case 'mesh-segmentation':
        return <MeshSegmentationPanel />;
      case 'part-completion':
        return <PartCompletionPanel />;
      case 'auto-rigging':
        return <AutoRiggingPanel />;
      case 'mesh-retopology':
        return <MeshRetopologyPanel />;
      case 'mesh-uv-unwrapping':
        return <MeshUVUnwrappingPanel />;
      default:
        return <div>Select a module to begin</div>;
    }
  };

  if (isCollapsed) {
    return <SidebarContainer isCollapsed={true} width={0} />;
  }

  return (
    <SidebarContainer isCollapsed={false} width={width}>
      <SidebarHeader>
        <h3>{moduleNames[currentModule] || 'Unknown Module'}</h3>
      </SidebarHeader>
      
      <SidebarContent>
        {renderFeaturePanel()}
      </SidebarContent>
    </SidebarContainer>
  );
};

export default LeftSidebar; 