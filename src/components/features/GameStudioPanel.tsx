import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useStore, useStoreActions } from '../../store';
import { GameProject, ChatMessage, GameGenre, GameConfig } from '../../types/state';

// Constants for AI response timing (milliseconds)
const AI_RESPONSE_BASE_DELAY_MS = 1000;
const AI_RESPONSE_RANDOM_DELAY_MS = 1000;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: ${props => props.theme.spacing.md};
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
`;

const ProjectTitle = styled.h4`
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.base};
`;

const NewProjectButton = styled.button`
  background: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    background: ${props => props.theme.colors.primary[600]};
  }
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.default};
  overflow: hidden;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: ${props => props.theme.spacing.sm};
  
  span {
    width: 8px;
    height: 8px;
    background: ${props => props.theme.colors.primary[500]};
    border-radius: 50%;
    animation: ${pulse} 1.4s infinite;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

const MessageBubble = styled.div<{ role: 'user' | 'assistant' | 'system' }>`
  max-width: 85%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: ${props => props.theme.typography.fontSize.sm};
  line-height: 1.5;
  align-self: ${props => props.role === 'user' ? 'flex-end' : 'flex-start'};
  background: ${props => {
    switch (props.role) {
      case 'user': return props.theme.colors.primary[500];
      case 'assistant': return props.theme.colors.background.secondary;
      case 'system': return props.theme.colors.warning + '20';
      default: return props.theme.colors.background.secondary;
    }
  }};
  color: ${props => props.role === 'user' ? 'white' : props.theme.colors.text.primary};
  border: ${props => props.role === 'system' ? `1px solid ${props.theme.colors.warning}` : 'none'};
  
  p {
    margin: 0 0 ${props => props.theme.spacing.xs} 0;
    &:last-child { margin-bottom: 0; }
  }
  
  ul, ol {
    margin: ${props => props.theme.spacing.xs} 0;
    padding-left: ${props => props.theme.spacing.lg};
  }
  
  code {
    background: rgba(0, 0, 0, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }
`;

const ChatInputContainer = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const ChatInput = styled.textarea`
  flex: 1;
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  resize: none;
  min-height: 44px;
  max-height: 120px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const SendButton = styled.button<{ disabled?: boolean }>`
  background: ${props => props.disabled ? props.theme.colors.gray[600] : props.theme.colors.primary[500]};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primary[600]};
  }
`;

const QuickActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.border.default};
`;

const QuickActionButton = styled.button`
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.default};
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  cursor: pointer;
  
  &:hover {
    background: ${props => props.theme.colors.primary[500]}20;
    border-color: ${props => props.theme.colors.primary[500]};
    color: ${props => props.theme.colors.primary[400]};
  }
`;

const StatusBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.tertiary};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
`;

const StatusBadge = styled.span<{ status: string }>`
  background: ${props => {
    switch (props.status) {
      case 'ideation': return props.theme.colors.primary[500];
      case 'designing': return props.theme.colors.warning;
      case 'building': return '#f59e0b';
      case 'testing': return props.theme.colors.info || '#3b82f6';
      case 'deployed': return props.theme.colors.success;
      default: return props.theme.colors.gray[500];
    }
  }};
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  text-transform: capitalize;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.md};
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'success' | 'secondary' }>`
  flex: 1;
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
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const WelcomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  gap: ${props => props.theme.spacing.lg};
`;

const WelcomeIcon = styled.div`
  font-size: 48px;
  color: ${props => props.theme.colors.primary[500]};
`;

const WelcomeTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.xl};
`;

const WelcomeText = styled.p`
  margin: 0;
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  max-width: 300px;
  line-height: 1.6;
`;

const GenreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.sm};
  width: 100%;
  max-width: 300px;
`;

const GenreButton = styled.button`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.colors.primary[500]}20;
    border-color: ${props => props.theme.colors.primary[500]};
  }
  
  i {
    font-size: 20px;
    color: ${props => props.theme.colors.primary[500]};
  }
  
  span {
    font-size: ${props => props.theme.typography.fontSize.xs};
  }
`;

// AI response simulation (in production, this would call a real AI service)
const generateAIResponse = (message: string, project: GameProject | null): string => {
  const lowerMessage = message.toLowerCase();
  
  if (!project) {
    return "Let's create a new game! What type of game would you like to make? You can choose from platformer, puzzle, shooter, racing, RPG, adventure, or arcade games.";
  }
  
  if (lowerMessage.includes('build') || lowerMessage.includes('generate') || lowerMessage.includes('create game')) {
    return `Great! I'll help you build your ${project.genre} game "${project.name}". Based on our discussion, here's what I'll generate:

**Game Features:**
- Genre: ${project.genre}
- Controls: Keyboard + Touch support
- ${project.gameConfig.physics ? 'Physics-based gameplay' : 'Simple collision detection'}

**Next Steps:**
1. Click "Build Game" to generate the game code
2. Preview the game in the viewport
3. Export or deploy when ready

Would you like me to proceed with building the game?`;
  }
  
  if (lowerMessage.includes('3d') || lowerMessage.includes('model') || lowerMessage.includes('asset')) {
    return `I can help generate 3D assets for your game! Here are some options:

**Recommended 3D Assets:**
- Player character model
- Environment objects (platforms, obstacles)
- Collectible items
- Enemy characters

To generate 3D assets:
1. Describe what you need (e.g., "a cute robot character")
2. I'll create the asset using the MeshGen module
3. Assets will automatically be added to your game

What 3D asset would you like to create first?`;
  }
  
  if (lowerMessage.includes('deploy') || lowerMessage.includes('publish') || lowerMessage.includes('share')) {
    return `To deploy your game, you have several options:

**Deployment Options:**
1. **Download HTML5** - Single file, works anywhere
2. **Deploy to Replit** - Instant hosting with shareable URL
3. **Export for Game Engines** - Use in Unity/Unreal

Click "Export Game" when you're ready to deploy!`;
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('what can')) {
    return `I'm your AI game development assistant! Here's what I can help with:

**Game Design:**
- Brainstorm game mechanics
- Design levels and puzzles
- Balance difficulty

**Asset Creation:**
- Generate 3D models automatically
- Create textures and sprites
- Design UI elements

**Development:**
- Generate playable game code
- Preview and test games
- Export for deployment

What would you like to work on?`;
  }
  
  // Default contextual response
  return `That's a great idea for your ${project.genre} game! I've noted that down. 

Here are some suggestions to enhance your concept:
- Add power-ups for variety
- Include a scoring system
- Create multiple difficulty levels

Would you like me to help design the game mechanics, generate 3D assets, or build a prototype?`;
};

const GameStudioPanel: React.FC = () => {
  const { gameStudio } = useStore();
  const { 
    createGameProject, 
    updateGameProject, 
    addChatMessage,
    setGameStudioGenerating,
    buildGame,
    addNotification
  } = useStoreActions();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const currentProject = gameStudio.projects.find(p => p.id === gameStudio.currentProjectId);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentProject?.conversation]);
  
  const handleNewProject = (genre: GameGenre) => {
    const genreNames: Record<GameGenre, string> = {
      platformer: 'Platformer Adventure',
      puzzle: 'Puzzle Challenge',
      shooter: 'Space Shooter',
      racing: 'Speed Racer',
      rpg: 'Fantasy Quest',
      adventure: 'Epic Journey',
      simulation: 'Life Simulator',
      arcade: 'Arcade Classic',
      educational: 'Learning Game',
      other: 'My Game'
    };
    
    createGameProject(genre, genreNames[genre]);
  };
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentProject) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    addChatMessage(currentProject.id, {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });
    
    // Simulate AI typing
    setIsTyping(true);
    
    // Generate AI response (simulated delay)
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage, currentProject);
      
      addChatMessage(currentProject.id, {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      });
      
      setIsTyping(false);
    }, AI_RESPONSE_BASE_DELAY_MS + Math.random() * AI_RESPONSE_RANDOM_DELAY_MS);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleQuickAction = (action: string) => {
    setInputValue(action);
    inputRef.current?.focus();
  };
  
  const handleBuildGame = async () => {
    if (!currentProject) return;
    
    try {
      setGameStudioGenerating(true);
      await buildGame(currentProject.id);
      
      addNotification({
        type: 'success',
        title: 'Game Built!',
        message: 'Your game is ready to preview and export',
        duration: 5000
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Build Failed',
        message: error instanceof Error ? error.message : 'Failed to build game',
        duration: 5000
      });
    } finally {
      setGameStudioGenerating(false);
    }
  };
  
  // Welcome screen for new users
  if (!currentProject) {
    return (
      <Container>
        <WelcomeContainer>
          <WelcomeIcon>
            <i className="fas fa-gamepad"></i>
          </WelcomeIcon>
          <WelcomeTitle>Game Studio</WelcomeTitle>
          <WelcomeText>
            Create games with AI! Describe your game idea, and I'll help you build it with auto-generated 3D assets.
          </WelcomeText>
          
          <GenreGrid>
            <GenreButton onClick={() => handleNewProject('platformer')}>
              <i className="fas fa-running"></i>
              <span>Platformer</span>
            </GenreButton>
            <GenreButton onClick={() => handleNewProject('puzzle')}>
              <i className="fas fa-puzzle-piece"></i>
              <span>Puzzle</span>
            </GenreButton>
            <GenreButton onClick={() => handleNewProject('shooter')}>
              <i className="fas fa-crosshairs"></i>
              <span>Shooter</span>
            </GenreButton>
            <GenreButton onClick={() => handleNewProject('arcade')}>
              <i className="fas fa-ghost"></i>
              <span>Arcade</span>
            </GenreButton>
            <GenreButton onClick={() => handleNewProject('racing')}>
              <i className="fas fa-car"></i>
              <span>Racing</span>
            </GenreButton>
            <GenreButton onClick={() => handleNewProject('adventure')}>
              <i className="fas fa-compass"></i>
              <span>Adventure</span>
            </GenreButton>
          </GenreGrid>
        </WelcomeContainer>
      </Container>
    );
  }
  
  return (
    <Container>
      <ProjectHeader>
        <ProjectTitle>{currentProject.name}</ProjectTitle>
        <NewProjectButton onClick={() => handleNewProject('other')}>
          <i className="fas fa-plus"></i>
          New
        </NewProjectButton>
      </ProjectHeader>
      
      <StatusBar>
        <span>Genre: {currentProject.genre}</span>
        <StatusBadge status={currentProject.status}>
          {currentProject.status}
        </StatusBadge>
      </StatusBar>
      
      <ChatContainer>
        <ChatMessages>
          {currentProject.conversation.map(msg => (
            <MessageBubble key={msg.id} role={msg.role}>
              {msg.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </MessageBubble>
          ))}
          {isTyping && (
            <MessageBubble role="assistant">
              <TypingIndicator>
                <span />
                <span />
                <span />
              </TypingIndicator>
            </MessageBubble>
          )}
          <div ref={messagesEndRef} />
        </ChatMessages>
        
        <QuickActions>
          <QuickActionButton onClick={() => handleQuickAction('Help me design the game mechanics')}>
            🎮 Game Mechanics
          </QuickActionButton>
          <QuickActionButton onClick={() => handleQuickAction('Generate 3D assets for my game')}>
            🎨 Create Assets
          </QuickActionButton>
          <QuickActionButton onClick={() => handleQuickAction('Build and preview my game')}>
            🔨 Build Game
          </QuickActionButton>
          <QuickActionButton onClick={() => handleQuickAction('How do I deploy my game?')}>
            🚀 Deploy
          </QuickActionButton>
        </QuickActions>
        
        <ChatInputContainer>
          <ChatInput
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your game idea..."
            rows={1}
          />
          <SendButton 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            <i className="fas fa-paper-plane"></i>
          </SendButton>
        </ChatInputContainer>
      </ChatContainer>
      
      <ActionButtons>
        <ActionButton 
          variant="primary"
          onClick={handleBuildGame}
          disabled={gameStudio.isGenerating}
        >
          <i className={gameStudio.isGenerating ? 'fas fa-spinner fa-spin' : 'fas fa-hammer'}></i>
          {gameStudio.isGenerating ? 'Building...' : 'Build Game'}
        </ActionButton>
        <ActionButton 
          variant="success"
          disabled={!currentProject.generatedCode}
        >
          <i className="fas fa-download"></i>
          Export
        </ActionButton>
      </ActionButtons>
    </Container>
  );
};

export default GameStudioPanel;
