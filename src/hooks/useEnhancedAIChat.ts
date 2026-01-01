/**
 * Enhanced AI Chat Hook using Vercel AI SDK
 * Provides streaming chat with game command parsing
 */

import { useChat } from 'ai/react';
import { useCallback } from 'react';
import { useToast } from '../components/ui/ToastProvider';

export interface GameCommand {
  type: 'ADD_OBJECT' | 'MODIFY_SCENE' | 'SET_PROPERTY' | 'SPAWN_ENEMY' | 'CHANGE_LEVEL' | 'PLAY_SOUND';
  params: Record<string, any>;
}

interface UseEnhancedAIChatOptions {
  projectId?: string;
  onGameCommand?: (command: GameCommand) => void;
  apiEndpoint?: string;
}

/**
 * Enhanced AI Chat Hook with game command extraction
 * Supports streaming responses and structured command parsing
 */
export const useEnhancedAIChat = (options: UseEnhancedAIChatOptions = {}) => {
  const { projectId, onGameCommand, apiEndpoint = '/api/game-chat' } = options;
  const { showError, showSuccess } = useToast();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
  } = useChat({
    api: apiEndpoint,
    body: {
      projectId,
    },
    onFinish: (message) => {
      // Parse AI response for game commands
      const commands = parseGameCommands(message.content);
      
      if (commands.length > 0) {
        commands.forEach(cmd => {
          if (onGameCommand) {
            onGameCommand(cmd);
          }
        });
        showSuccess(`Executed ${commands.length} command(s)`);
      }
    },
    onError: (error) => {
      showError('Chat Error', error.message);
    },
  });

  /**
   * Parse game commands from AI response
   * Looks for structured commands in JSON format or markdown code blocks
   */
  const parseGameCommands = useCallback((content: string): GameCommand[] => {
    const commands: GameCommand[] = [];

    // Try to find JSON commands in code blocks
    const codeBlockRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.type && parsed.params) {
          commands.push(parsed as GameCommand);
        }
      } catch (e) {
        console.warn('Failed to parse command:', match[1]);
      }
    }

    // Also look for inline JSON commands
    const inlineJsonRegex = /\{["']type["']:\s*["'](\w+)["'],\s*["']params["']:\s*\{[^}]+\}\}/g;
    while ((match = inlineJsonRegex.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed.type && parsed.params) {
          commands.push(parsed as GameCommand);
        }
      } catch (e) {
        console.warn('Failed to parse inline command:', match[0]);
      }
    }

    // Parse natural language commands
    const naturalCommands = parseNaturalLanguageCommands(content);
    commands.push(...naturalCommands);

    return commands;
  }, []);

  /**
   * Parse natural language into game commands
   */
  const parseNaturalLanguageCommands = (content: string): GameCommand[] => {
    const commands: GameCommand[] = [];
    const lowercaseContent = content.toLowerCase();

    // Spawn enemy pattern
    if (lowercaseContent.includes('spawn') && (lowercaseContent.includes('enemy') || lowercaseContent.includes('enemies'))) {
      const countMatch = content.match(/(\d+)\s+enem/i);
      const count = countMatch ? parseInt(countMatch[1]) : 1;
      
      commands.push({
        type: 'SPAWN_ENEMY',
        params: {
          type: 'default',
          count,
        }
      });
    }

    // Add object pattern
    if (lowercaseContent.includes('add') && (lowercaseContent.includes('object') || lowercaseContent.includes('cube') || lowercaseContent.includes('sphere'))) {
      let objectType = 'cube';
      if (lowercaseContent.includes('sphere')) objectType = 'sphere';
      if (lowercaseContent.includes('cylinder')) objectType = 'cylinder';
      
      commands.push({
        type: 'ADD_OBJECT',
        params: {
          type: objectType,
          position: [0, 0, 0],
        }
      });
    }

    // Change level pattern
    if (lowercaseContent.includes('next level') || lowercaseContent.includes('level up')) {
      commands.push({
        type: 'CHANGE_LEVEL',
        params: {
          action: 'next',
        }
      });
    }

    // Play sound pattern
    if (lowercaseContent.includes('play sound') || lowercaseContent.includes('play music')) {
      commands.push({
        type: 'PLAY_SOUND',
        params: {
          sound: 'background',
        }
      });
    }

    // Modify scene pattern
    if (lowercaseContent.includes('change background') || lowercaseContent.includes('set background')) {
      const colorMatch = content.match(/#[0-9a-fA-F]{6}|rgb\([^)]+\)|(?:red|blue|green|yellow|purple|orange|black|white)/i);
      
      commands.push({
        type: 'MODIFY_SCENE',
        params: {
          property: 'backgroundColor',
          value: colorMatch ? colorMatch[0] : '#000000',
        }
      });
    }

    return commands;
  };

  /**
   * Send a message to the AI with custom context
   */
  const sendMessage = useCallback(
    async (message: string, context?: Record<string, any>) => {
      const event = {
        preventDefault: () => {},
      } as any;

      await originalHandleSubmit(event, {
        data: {
          ...context,
          projectId,
        },
      });
    },
    [originalHandleSubmit, projectId]
  );

  /**
   * Ask AI for game suggestions
   */
  const askForSuggestions = useCallback(
    async (gameType: string) => {
      const prompt = `I'm building a ${gameType} game. Can you suggest some interesting features, mechanics, or assets I should add?`;
      await sendMessage(prompt);
    },
    [sendMessage]
  );

  /**
   * Ask AI to improve game code
   */
  const improveCode = useCallback(
    async (code: string) => {
      const prompt = `Can you review and improve this game code? Here's the current implementation:\n\n\`\`\`javascript\n${code}\n\`\`\`\n\nPlease suggest improvements for performance, code quality, and game feel.`;
      await sendMessage(prompt);
    },
    [sendMessage]
  );

  /**
   * Ask AI to debug an issue
   */
  const debugIssue = useCallback(
    async (issue: string, code?: string) => {
      let prompt = `I'm having an issue with my game: ${issue}`;
      if (code) {
        prompt += `\n\nHere's the relevant code:\n\n\`\`\`javascript\n${code}\n\`\`\``;
      }
      prompt += '\n\nCan you help me debug this?';
      await sendMessage(prompt);
    },
    [sendMessage]
  );

  return {
    // Basic chat functionality
    messages,
    input,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
    
    // Enhanced functionality
    sendMessage,
    askForSuggestions,
    improveCode,
    debugIssue,
    parseGameCommands,
  };
};

export default useEnhancedAIChat;
