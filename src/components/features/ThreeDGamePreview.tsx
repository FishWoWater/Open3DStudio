/**
 * 3D Game Preview Component
 * Displays and runs 3D games using the GameEngine
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { GameProject } from '../../types/state';
import { Platformer3DTemplate } from '../../game-engine/templates/Platformer3DTemplate';

interface ThreeDGamePreviewProps {
  project: GameProject;
  autoPlay?: boolean;
}

export const ThreeDGamePreview: React.FC<ThreeDGamePreviewProps> = ({
  project,
  autoPlay = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Platformer3DTemplate | null>(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize game based on genre
    let game: Platformer3DTemplate | null = null;

    if (project.genre === 'platformer') {
      game = new Platformer3DTemplate(canvasRef.current, project);

      // Set up callbacks
      game.onScoreChange = (newScore) => setScore(newScore);
      game.onLivesChange = (newLives) => setLives(newLives);
      game.onGameOver = () => {
        setGameOver(true);
        setIsPlaying(false);
      };

      gameRef.current = game;

      if (autoPlay) {
        game.start();
        setIsPlaying(true);
      }
    }

    // Cleanup
    return () => {
      if (game) {
        game.dispose();
      }
    };
  }, [project, autoPlay]);

  const handlePlayPause = () => {
    if (!gameRef.current) return;

    if (isPlaying) {
      gameRef.current.pause();
      setIsPlaying(false);
    } else {
      gameRef.current.resume();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!gameRef.current) return;

    gameRef.current.reset();
    gameRef.current.start();
    setIsPlaying(true);
    setGameOver(false);
  };

  return (
    <Container>
      <GameCanvas
        ref={canvasRef}
        width={project.gameConfig.width}
        height={project.gameConfig.height}
      />

      <UIOverlay>
        <ScorePanel>
          <ScoreItem>
            <Label>Score:</Label>
            <Value>{score}</Value>
          </ScoreItem>
          <ScoreItem>
            <Label>Lives:</Label>
            <Value>{lives}</Value>
          </ScoreItem>
        </ScorePanel>

        <Controls>
          <ControlButton onClick={handlePlayPause}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </ControlButton>
          <ControlButton onClick={handleRestart}>
            🔄 Restart
          </ControlButton>
        </Controls>

        {gameOver && (
          <GameOverOverlay>
            <GameOverText>GAME OVER</GameOverText>
            <FinalScore>Final Score: {score}</FinalScore>
            <RestartButton onClick={handleRestart}>
              Play Again
            </RestartButton>
          </GameOverOverlay>
        )}
      </UIOverlay>

      <Instructions>
        <InstructionText>
          <strong>Controls:</strong> Arrow Keys or WASD to move, Space to jump
        </InstructionText>
      </Instructions>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
`;

const GameCanvas = styled.canvas`
  display: block;
  background: #000;
`;

const UIOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

const ScorePanel = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-family: monospace;
  backdrop-filter: blur(10px);
`;

const ScoreItem = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.span`
  color: #aaa;
`;

const Value = styled.span`
  color: #4ecdc4;
  font-weight: bold;
`;

const Controls = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  gap: 8px;
  pointer-events: auto;
`;

const ControlButton = styled.button`
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  backdrop-filter: blur(10px);
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.85);
    border-color: #4ecdc4;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Instructions = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
`;

const InstructionText = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  text-align: center;

  strong {
    color: white;
  }
`;

const GameOverOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  backdrop-filter: blur(10px);
`;

const GameOverText = styled.h1`
  color: #ff6b6b;
  font-size: 48px;
  margin: 0 0 16px 0;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
`;

const FinalScore = styled.div`
  color: white;
  font-size: 24px;
  margin-bottom: 24px;
`;

const RestartButton = styled.button`
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 30px;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }
`;
