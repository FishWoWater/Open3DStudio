import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useStore, useStoreActions } from '../../store';

const PreviewContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.background.primary};
  position: relative;
`;

const PreviewHeader = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  background: ${props => props.theme.colors.background.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
`;

const PreviewTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  
  i {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const PreviewActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'success' }>`
  background: ${props => {
    switch (props.variant) {
      case 'primary': return props.theme.colors.primary[500];
      case 'success': return props.theme.colors.success;
      default: return props.theme.colors.background.tertiary;
    }
  }};
  color: ${props => props.variant ? 'white' : props.theme.colors.text.primary};
  border: 1px solid ${props => props.variant ? 'transparent' : props.theme.colors.border.default};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PreviewContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.lg};
  overflow: hidden;
`;

const GameFrame = styled.iframe`
  width: 100%;
  height: 100%;
  max-width: 900px;
  max-height: 700px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.lg};
  text-align: center;
  color: ${props => props.theme.colors.text.muted};
  max-width: 400px;
`;

const EmptyIcon = styled.div`
  font-size: 64px;
  color: ${props => props.theme.colors.primary[500]};
  opacity: 0.5;
`;

const EmptyTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xl};
`;

const EmptyText = styled.p`
  margin: 0;
  line-height: 1.6;
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const StepsList = styled.ol`
  text-align: left;
  line-height: 1.8;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  
  li {
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  strong {
    color: ${props => props.theme.colors.primary[400]};
  }
`;

const GamePreview: React.FC = () => {
  const { gameStudio } = useStore();
  const { exportGame, addNotification } = useStoreActions();
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const currentProject = gameStudio.projects.find(p => p.id === gameStudio.currentProjectId);
  const hasPreview = currentProject?.previewUrl;
  
  const handleExport = () => {
    if (!currentProject) return;
    
    try {
      exportGame(currentProject.id);
      addNotification({
        type: 'success',
        title: 'Game Exported!',
        message: 'Your game has been downloaded as an HTML file',
        duration: 4000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export game',
        duration: 5000
      });
    }
  };
  
  const handleNewWindow = () => {
    if (currentProject?.previewUrl) {
      window.open(currentProject.previewUrl, '_blank', 'width=850,height=650');
    }
  };
  
  if (!currentProject) {
    return (
      <PreviewContainer>
        <PreviewHeader>
          <PreviewTitle>
            <i className="fas fa-gamepad"></i>
            Game Preview
          </PreviewTitle>
        </PreviewHeader>
        <PreviewContent>
          <EmptyState>
            <EmptyIcon>
              <i className="fas fa-gamepad"></i>
            </EmptyIcon>
            <EmptyTitle>Welcome to Game Studio</EmptyTitle>
            <EmptyText>
              Create games with AI! Start by selecting a game type in the left panel.
            </EmptyText>
            <StepsList>
              <li>Choose a <strong>game genre</strong> (platformer, puzzle, etc.)</li>
              <li>Chat with AI to <strong>describe your game</strong></li>
              <li>Click <strong>Build Game</strong> to generate</li>
              <li><strong>Preview & Export</strong> your playable game!</li>
            </StepsList>
          </EmptyState>
        </PreviewContent>
      </PreviewContainer>
    );
  }
  
  if (!hasPreview) {
    return (
      <PreviewContainer>
        <PreviewHeader>
          <PreviewTitle>
            <i className="fas fa-gamepad"></i>
            {currentProject.name}
          </PreviewTitle>
        </PreviewHeader>
        <PreviewContent>
          <EmptyState>
            <EmptyIcon>
              <i className="fas fa-hammer"></i>
            </EmptyIcon>
            <EmptyTitle>Ready to Build</EmptyTitle>
            <EmptyText>
              Discuss your game idea in the chat, then click "Build Game" to generate a playable prototype.
            </EmptyText>
          </EmptyState>
        </PreviewContent>
      </PreviewContainer>
    );
  }
  
  return (
    <PreviewContainer>
      <PreviewHeader>
        <PreviewTitle>
          <i className="fas fa-play-circle"></i>
          {currentProject.name} - Live Preview
        </PreviewTitle>
        <PreviewActions>
          <ActionButton onClick={handleNewWindow}>
            <i className="fas fa-external-link-alt"></i>
            Open in Window
          </ActionButton>
          <ActionButton variant="success" onClick={handleExport}>
            <i className="fas fa-download"></i>
            Download Game
          </ActionButton>
        </PreviewActions>
      </PreviewHeader>
      <PreviewContent>
        <GameFrame
          src={currentProject.previewUrl}
          title={currentProject.name}
          sandbox="allow-scripts allow-same-origin"
        />
      </PreviewContent>
    </PreviewContainer>
  );
};

export default GamePreview;
