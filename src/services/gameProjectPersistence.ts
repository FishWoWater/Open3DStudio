import { GameProject, GameStudioState } from '../types/state';

const GAME_PROJECTS_KEY = 'open3dstudio_game_projects';
const CURRENT_PROJECT_KEY = 'open3dstudio_current_game_project';

/**
 * Persistence service for Game Studio projects
 * Saves and loads game projects from localStorage
 */
export const gameProjectPersistence = {
  /**
   * Save all game projects to localStorage
   */
  saveProjects: (projects: GameProject[]): void => {
    try {
      // Serialize projects, excluding non-serializable fields
      const serializable = projects.map(project => ({
        ...project,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        conversation: project.conversation.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      }));
      localStorage.setItem(GAME_PROJECTS_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to save game projects:', error);
    }
  },

  /**
   * Load all game projects from localStorage
   */
  loadProjects: (): GameProject[] => {
    try {
      const data = localStorage.getItem(GAME_PROJECTS_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Deserialize dates
      return parsed.map((project: any) => ({
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
        conversation: project.conversation.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Failed to load game projects:', error);
      return [];
    }
  },

  /**
   * Save current project ID
   */
  saveCurrentProjectId: (projectId: string | null): void => {
    try {
      if (projectId) {
        localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
      } else {
        localStorage.removeItem(CURRENT_PROJECT_KEY);
      }
    } catch (error) {
      console.error('Failed to save current project ID:', error);
    }
  },

  /**
   * Load current project ID
   */
  loadCurrentProjectId: (): string | null => {
    try {
      return localStorage.getItem(CURRENT_PROJECT_KEY);
    } catch (error) {
      console.error('Failed to load current project ID:', error);
      return null;
    }
  },

  /**
   * Clear all game project data
   */
  clearAll: (): void => {
    try {
      localStorage.removeItem(GAME_PROJECTS_KEY);
      localStorage.removeItem(CURRENT_PROJECT_KEY);
    } catch (error) {
      console.error('Failed to clear game projects:', error);
    }
  },

  /**
   * Initialize game studio state from localStorage
   */
  initializeState: (): Partial<GameStudioState> => {
    const projects = gameProjectPersistence.loadProjects();
    const currentProjectId = gameProjectPersistence.loadCurrentProjectId();
    
    // Validate that current project exists
    const validCurrentId = projects.some(p => p.id === currentProjectId) 
      ? currentProjectId 
      : null;
    
    return {
      projects,
      currentProjectId: validCurrentId
    };
  }
};
