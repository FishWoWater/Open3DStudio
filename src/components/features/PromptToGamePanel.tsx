import React, { useState } from 'react';
import styled from 'styled-components';
import { useStoreActions, useStore } from '../../store';

const PanelContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.default};
  padding: 32px;
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 16px;
`;

const PromptInput = styled.textarea`
  width: 100%;
  max-width: 480px;
  min-height: 80px;
  font-size: 1.1rem;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border.default};
  margin-bottom: 16px;
  background: ${props => props.theme.colors.background.secondary};
  color: ${props => props.theme.colors.text.primary};
  resize: vertical;
`;

const GenerateButton = styled.button`
  background: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s;
  &:hover {
    background: ${props => props.theme.colors.primary[600]};
  }
`;

const StatusMessage = styled.div`
  margin-top: 24px;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
`;

const PromptToGamePanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { createGameProject, setCurrentGameProject, buildGame, addNotification } = useStoreActions();
  const { gameStudio } = useStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setStatus('Analyzing your idea and generating your game...');
    try {
      // Simulate AI genre/template detection (could be replaced with real AI call)
      let genre: any = 'platformer';
      let gameType: any = '2d';
      if (/3d|three/i.test(prompt)) gameType = '3d';
      if (/shooter|shoot/i.test(prompt)) genre = 'shooter';
      if (/puzzle/i.test(prompt)) genre = 'puzzle';
      if (/rpg|role/i.test(prompt)) genre = 'rpg';
      if (/adventure/i.test(prompt)) genre = 'adventure';
      if (/arcade/i.test(prompt)) genre = 'arcade';
      if (/race|car/i.test(prompt)) genre = 'racing';
      // Create project
      const name = prompt.split(/[.!?]/)[0].slice(0, 32) || 'My Game';
      const projectId = createGameProject(genre, name, gameType, genre);
      setCurrentGameProject(projectId);
      setStatus('Generating assets and building your game...');
      await new Promise(res => setTimeout(res, 2000)); // Simulate asset generation
      await buildGame(projectId);
      setStatus('Your game is ready! Preview or export it from the Game Studio.');
      addNotification({
        type: 'success',
        title: 'Game Ready',
        message: 'Your game has been generated! Switch to Game Studio to preview and export.',
        duration: 6000
      });
    } catch (e) {
      setStatus('Failed to generate game. Please try again.');
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Could not generate your game. Please try again.',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <PanelContainer>
      <Title>Generate a Game from Your Idea</Title>
      <PromptInput
        placeholder="Describe your game idea in one or two sentences (e.g. 'A 2D platformer where a robot collects gears in a factory')"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={isGenerating}
      />
      <GenerateButton onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
        {isGenerating ? 'Generating...' : 'Generate Game'}
      </GenerateButton>
      {status && <StatusMessage>{status}</StatusMessage>}
    </PanelContainer>
  );
};

export default PromptToGamePanel;
