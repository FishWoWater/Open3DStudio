import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';
import { 
  AppState, 
  ModuleType, 
  Task, 
  AppSettings, 
  UIState, 
  SystemState,
  TaskState,
  PerformanceMetrics,
  LoadedModel,
  RenderMode,
  ModalType,
  ViewportTool,
  TransformMode,
  AuthState,
  GameStudioState,
  GameProject,
  GameGenre,
  ChatMessage,
  GameConfig
} from '../types/state';
import { AuthStatus, UserInfo } from '../types/api';

// Default state values
const defaultSettings: AppSettings = {
  apiEndpoint: 'http://localhost:7842',
  apiKey: undefined,
  theme: 'dark',
  autoSave: true,
  defaultOutputFormat: 'glb',
  maxConcurrentTasks: 3,
  pollingInterval: 5000,
  language: 'en'
};

// Initialize settings from localStorage or defaults
const initializeSettings = (): AppSettings => {
  try {
    // Dynamically import the settings persistence service
    if (typeof window !== 'undefined' && window.localStorage) {
      const { settingsPersistence } = require('../services/settingsPersistence');
      const savedSettings = settingsPersistence.loadSettings();
      
      if (savedSettings) {
        // Merge saved settings with defaults to ensure all required fields exist
        return { ...defaultSettings, ...savedSettings };
      }
    }
  } catch (error) {
    console.warn('Failed to load saved settings, using defaults:', error);
  }
  
  return defaultSettings;
};

const defaultUIState: UIState = {
  sidebar: {
    leftCollapsed: false,
    rightCollapsed: false,
    width: 400
  },
  viewport: {
    renderMode: 'rendered',
    camera: {
      position: [5, 5, 5],
      target: [0, 0, 0],
      fov: 75,
      near: 0.1,
      far: 1000
    },
    selection: [],
    loadedModels: [],
    lighting: {
      ambientIntensity: 1.0,
      directionalIntensity: 1.0,
      directionalPosition: [100, 100, 100],
      enableShadows: true
    },
    background: 'default',
    currentTool: 'select',
    isTransforming: false,
    transformMode: 'world',
    gizmoVisible: true,
    snapToGrid: true,
    gridSize: 0.2,
    doubleSided: true
  },
  modal: {
    isOpen: false,
    type: null,
    data: undefined
  },
  notifications: [],
  dragAndDrop: {
    isDragging: false,
    dragType: null,
    dragData: undefined
  },
  taskResultAsInput: null
};

const defaultSystemState: SystemState = {
  isOnline: false,
  performance: {
    cpuUsage: 0,
    memoryUsage: 0,
    renderTime: 16.67,
    frameRate: 60
  }
};

const defaultTaskState: TaskState = {
  tasks: [],
  activeTasks: [],
  completedTasks: [],
  failedTasks: [],
  isPolling: false
};

const defaultAuthState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
  authStatus: null,
  isCheckingAuth: false
};

// Helper function for game project persistence
const persistGameProjects = (projects: GameProject[], currentProjectId: string | null = null) => {
  import('../services/gameProjectPersistence').then(({ gameProjectPersistence }) => {
    gameProjectPersistence.saveProjects(projects);
    if (currentProjectId !== null) {
      gameProjectPersistence.saveCurrentProjectId(currentProjectId);
    }
  });
};

// Initialize game studio state from localStorage
const initializeGameStudioState = (): GameStudioState => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Using require for synchronous initialization at startup
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { gameProjectPersistence } = require('../services/gameProjectPersistence');
      const savedState = gameProjectPersistence.initializeState();
      return {
        ...defaultGameStudioState,
        ...savedState
      };
    }
  } catch (error) {
    console.warn('Failed to load saved game projects, using defaults:', error);
  }
  return defaultGameStudioState;
};

const defaultGameStudioState: GameStudioState = {
  projects: [],
  currentProjectId: null,
  isGenerating: false,
  chatInput: ''
};

const defaultState: AppState = {
  currentModule: 'game-studio',
  currentFeature: 'game-ideation',
  isLoading: false,
  error: null,
  settings: initializeSettings(),
  tasks: defaultTaskState,
  ui: defaultUIState,
  system: defaultSystemState,
  auth: defaultAuthState,
  gameStudio: initializeGameStudioState()
};

// Store interface with actions
interface StoreState extends AppState {
  // Module actions
  setCurrentModule: (module: ModuleType) => void;
  setCurrentFeature: (feature: string) => void;
  
  // Loading and error actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => string;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  clearFailedTasks: () => void;
  clearAllTasks: () => void;
  setTaskPolling: (polling: boolean) => void;
  initializeTasks: () => Promise<void>;
  loadTasksFromHistory: () => Promise<void>;
  
  // UI actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setRenderMode: (mode: RenderMode) => void;
  setCurrentTool: (tool: ViewportTool) => void;
  setTransformMode: (mode: TransformMode) => void;
  setGizmoVisible: (visible: boolean) => void;
  setSnapToGrid: (snap: boolean) => void;
  setGridSize: (size: number) => void;
  setDoubleSided: (doubleSided: boolean) => void;
  
  // Viewport actions
  addModel: (model: LoadedModel) => void;
  removeModel: (modelId: string) => void;
  updateModel: (modelId: string, updates: Partial<LoadedModel>) => void;
  selectModel: (modelId: string, multi?: boolean) => void;
  clearSelection: () => void;
  setTransforming: (transforming: boolean) => void;
  transformSelectedModels: (transform: Partial<Pick<LoadedModel, 'position' | 'rotation' | 'scale'>>) => void;
  setSelectedModelsTransform: (transform: Partial<Pick<LoadedModel, 'position' | 'rotation' | 'scale'>>) => void;
  deleteSelectedModels: () => void;
  
  // Model analysis utilities
  analyzeModelSkeleton: (object3D: any) => any;
  analyzeModelParts: (object3D: any) => any;
  
  // Modal actions
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // System actions
  updateSystemStatus: (status: Partial<SystemState>) => void;
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void;
  
  // Drag and drop actions
  startDrag: (type: string, data: any) => void;
  endDrag: () => void;
  
  // Task result as input actions
  setTaskResultAsInput: (taskId: string | null) => void;
  clearTaskResultAsInput: () => void;
  
  // Authentication actions
  checkAuthStatus: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setAuthToken: (token: string | null) => void;
  setAuthUser: (user: UserInfo | null) => void;
  loadSavedAuth: () => void;
  
  // Game Studio actions
  createGameProject: (genre: GameGenre, name: string, gameType?: '2d' | '3d', template?: string) => string;
  updateGameProject: (projectId: string, updates: Partial<GameProject>) => void;
  deleteGameProject: (projectId: string) => void;
  setCurrentGameProject: (projectId: string | null) => void;
  addChatMessage: (projectId: string, message: ChatMessage) => void;
  setGameStudioGenerating: (isGenerating: boolean) => void;
  buildGame: (projectId: string) => Promise<void>;
  exportGame: (projectId: string) => void;
  
  // Utility actions
  reset: () => void;
}

// Notification interface (local to this file)
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
}

// Create the store
export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
    ...defaultState,

    // Module actions
    setCurrentModule: (module: ModuleType) => {
      set({ currentModule: module });
      // Reset feature when switching modules
      const defaultFeatures: Record<ModuleType, string> = {
        'game-studio': 'game-ideation',
        'mesh-generation': 'text-to-mesh',
        'mesh-painting': 'text-painting',
        'mesh-segmentation': 'segment-mesh',
        'part-completion': 'complete-parts',
        'auto-rigging': 'generate-rig',
        'mesh-retopology': 'retopologize-mesh',
        'mesh-uv-unwrapping': 'unwrap-mesh'
      };
      set({ currentFeature: defaultFeatures[module] });
    },

    setCurrentFeature: (feature: string) => {
      set({ currentFeature: feature });
    },

    // Loading and error actions
    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    // Settings actions
    updateSettings: (settings: Partial<AppSettings>) => {
      set((state) => {
        const newSettings = { ...state.settings, ...settings };
        
        // Save to localStorage
        try {
          import('../services/settingsPersistence').then(({ settingsPersistence }) => {
            settingsPersistence.saveSettings(newSettings);
          });
        } catch (error) {
          console.error('Failed to save settings:', error);
        }
        
        return { settings: newSettings };
      });
    },

    resetSettings: () => {
      set({ settings: defaultSettings });
      
      // Save to localStorage
      try {
        import('../services/settingsPersistence').then(({ settingsPersistence }) => {
          settingsPersistence.saveSettings(defaultSettings);
        });
      } catch (error) {
        console.error('Failed to save reset settings:', error);
      }
    },

    // Task actions
    addTask: (task: Omit<Task, 'id' | 'createdAt'>) => {
      const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newTask: Task = {
        ...task,
        id,
        createdAt: new Date()
      };

      set((state) => {
        const newTasks = [...state.tasks.tasks, newTask];
        
        // Save to localStorage with user ID (if authenticated)
        const userId = state.auth.user?.user_id;
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks(newTasks, userId);
        });

        return {
          tasks: {
            ...state.tasks,
            tasks: newTasks,
            activeTasks: task.status === 'processing' || task.status === 'queued'
              ? [...state.tasks.activeTasks, id]
              : state.tasks.activeTasks
          }
        };
      });

      return id;
    },

    updateTask: (taskId: string, updates: Partial<Task>) => {
      set((state) => {
        const taskIndex = state.tasks.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return state;

        const updatedTask = { ...state.tasks.tasks[taskIndex], ...updates };
        const newTasks = [...state.tasks.tasks];
        newTasks[taskIndex] = updatedTask;

        // Save to localStorage with user ID (if authenticated)
        const userId = state.auth.user?.user_id;
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks(newTasks, userId);
        });

        // Update active/completed/failed lists
        let { activeTasks, completedTasks, failedTasks } = state.tasks;

        // Remove from all lists first
        activeTasks = activeTasks.filter(id => id !== taskId);
        completedTasks = completedTasks.filter(id => id !== taskId);
        failedTasks = failedTasks.filter(id => id !== taskId);

        // Add to appropriate list based on new status
        if (updatedTask.status === 'processing' || updatedTask.status === 'queued') {
          activeTasks.push(taskId);
        } else if (updatedTask.status === 'completed') {
          completedTasks.push(taskId);
        } else if (updatedTask.status === 'failed') {
          failedTasks.push(taskId);
        }

        return {
          tasks: {
            ...state.tasks,
            tasks: newTasks,
            activeTasks,
            completedTasks,
            failedTasks
          }
        };
      });
    },

    removeTask: (taskId: string) => {
      set((state) => {
        // Find the task to get its jobId
        const task = state.tasks.tasks.find(t => t.id === taskId);
        
        // Delete job from cloud database
        if (task?.jobId) {
          import('../api/client').then(({ getApiClient }) => {
            getApiClient().deleteJob(task.jobId!).catch(error => {
              console.error(`Failed to delete job ${task.jobId}:`, error);
            });
          });
        }
        
        const newTasks = state.tasks.tasks.filter(t => t.id !== taskId);
        
        // Save to localStorage with user ID
        const userId = state.auth.user?.user_id;
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks(newTasks, userId);
        });

        return {
          tasks: {
            ...state.tasks,
            tasks: newTasks,
            activeTasks: state.tasks.activeTasks.filter(id => id !== taskId),
            completedTasks: state.tasks.completedTasks.filter(id => id !== taskId),
            failedTasks: state.tasks.failedTasks.filter(id => id !== taskId)
          }
        };
      });
    },

    clearCompletedTasks: () => {
      set((state) => {
        const completedTaskIds = new Set(state.tasks.completedTasks);
        
        // Delete jobs from cloud database
        const tasksToDelete = state.tasks.tasks.filter(t => completedTaskIds.has(t.id));
        tasksToDelete.forEach(task => {
          if (task.jobId) {
            import('../api/client').then(({ getApiClient }) => {
              getApiClient().deleteJob(task.jobId!).catch(error => {
                console.error(`Failed to delete job ${task.jobId}:`, error);
              });
            });
          }
        });
        
        const newTasks = state.tasks.tasks.filter(t => !completedTaskIds.has(t.id));
        
        // Save to localStorage with user ID
        const userId = state.auth.user?.user_id;
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks(newTasks, userId);
        });
        
        return {
          tasks: {
            ...state.tasks,
            tasks: newTasks,
            completedTasks: []
          }
        };
      });
    },

    clearFailedTasks: () => {
      set((state) => {
        const failedTaskIds = new Set(state.tasks.failedTasks);
        
        // Delete jobs from cloud database
        const tasksToDelete = state.tasks.tasks.filter(t => failedTaskIds.has(t.id));
        tasksToDelete.forEach(task => {
          if (task.jobId) {
            import('../api/client').then(({ getApiClient }) => {
              getApiClient().deleteJob(task.jobId!).catch(error => {
                console.error(`Failed to delete job ${task.jobId}:`, error);
              });
            });
          }
        });
        
        const newTasks = state.tasks.tasks.filter(t => !failedTaskIds.has(t.id));
        
        // Save to localStorage with user ID
        const userId = state.auth.user?.user_id;
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks(newTasks, userId);
        });
        
        return {
          tasks: {
            ...state.tasks,
            tasks: newTasks,
            failedTasks: []
          }
        };
      });
    },

    clearAllTasks: () => {
      set((state) => {
        // Delete all jobs from cloud database
        state.tasks.tasks.forEach(task => {
          if (task.jobId) {
            import('../api/client').then(({ getApiClient }) => {
              getApiClient().deleteJob(task.jobId!).catch(error => {
                console.error(`Failed to delete job ${task.jobId}:`, error);
              });
            });
          }
        });
        
        // Save to localStorage with user ID
        const userId = state.auth.user?.user_id;
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks([], userId);
        });
        
        return {
          tasks: {
            ...state.tasks,
            tasks: [],
            activeTasks: [],
            completedTasks: [],
            failedTasks: []
          }
        };
      });
    },

    setTaskPolling: (polling: boolean) => {
      set((state) => ({
        tasks: { ...state.tasks, isPolling: polling }
      }));
    },

    initializeTasks: async () => {
      try {
        const state = get();
        const { taskPersistence } = await import('../services/taskPersistence');
        
        // Get current user ID (undefined in anonymous mode)
        const userId = state.auth.user?.user_id;
        
        // Initialize and sync tasks with user verification
        const tasks = await taskPersistence.initializeAndSync(userId);
        
        console.log(`[Tasks] Initialized ${tasks.length} tasks for user ${userId || 'anonymous'}`);
        
        // Update the store with loaded/merged tasks
        set((state) => {
          const activeTasks: string[] = [];
          const completedTasks: string[] = [];
          const failedTasks: string[] = [];

          tasks.forEach(task => {
            if (task.status === 'processing' || task.status === 'queued') {
              activeTasks.push(task.id);
            } else if (task.status === 'completed') {
              completedTasks.push(task.id);
            } else if (task.status === 'failed') {
              failedTasks.push(task.id);
            }
          });

          return {
            tasks: {
              ...state.tasks,
              tasks,
              activeTasks,
              completedTasks,
              failedTasks
            }
          };
        });
      } catch (error) {
        console.error('Failed to initialize tasks:', error);
      }
    },

    loadTasksFromHistory: async () => {
      try {
        const state = get();
        const { taskPersistence } = await import('../services/taskPersistence');
        const currentTasks = state.tasks.tasks;
        const mergedTasks = await taskPersistence.mergeTasks(currentTasks);
        
        // Save merged tasks back to localStorage with user ID
        const userId = state.auth.user?.user_id;
        taskPersistence.saveTasks(mergedTasks, userId);
        
        // Update the store
        set((state) => {
          const activeTasks: string[] = [];
          const completedTasks: string[] = [];
          const failedTasks: string[] = [];

          mergedTasks.forEach(task => {
            if (task.status === 'processing' || task.status === 'queued') {
              activeTasks.push(task.id);
            } else if (task.status === 'completed') {
              completedTasks.push(task.id);
            } else if (task.status === 'failed') {
              failedTasks.push(task.id);
            }
          });

          return {
            tasks: {
              ...state.tasks,
              tasks: mergedTasks,
              activeTasks,
              completedTasks,
              failedTasks
            }
          };
        });
      } catch (error) {
        console.error('Failed to load tasks from history:', error);
      }
    },

    // UI actions
    toggleLeftSidebar: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          sidebar: {
            ...state.ui.sidebar,
            leftCollapsed: !state.ui.sidebar.leftCollapsed
          }
        }
      }));
    },

    toggleRightSidebar: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          sidebar: {
            ...state.ui.sidebar,
            rightCollapsed: !state.ui.sidebar.rightCollapsed
          }
        }
      }));
    },

    setSidebarWidth: (width: number) => {
      set((state) => ({
        ui: {
          ...state.ui,
          sidebar: { ...state.ui.sidebar, width }
        }
      }));
    },

    setRenderMode: (mode: RenderMode) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: { ...state.ui.viewport, renderMode: mode }
        }
      }));
    },

    setCurrentTool: (tool: ViewportTool) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: { 
            ...state.ui.viewport, 
            currentTool: tool,
            isTransforming: false // Reset transform state when changing tools
          }
        }
      }));
    },

    setTransformMode: (mode: TransformMode) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: { ...state.ui.viewport, transformMode: mode }
        }
      }));
    },

    setGizmoVisible: (visible: boolean) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: { ...state.ui.viewport, gizmoVisible: visible }
        }
      }));
    },

    setSnapToGrid: (snap: boolean) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: { ...state.ui.viewport, snapToGrid: snap }
        }
      }));
    },

    setGridSize: (size: number) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: { ...state.ui.viewport, gridSize: size }
        }
      }));
    },

    setDoubleSided: (doubleSided: boolean) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: { ...state.ui.viewport, doubleSided }
        }
      }));
    },

    // Viewport actions
    addModel: (model: LoadedModel) => {
      // Store original materials and analyze model structure
      let modelWithMaterials = { ...model };
      if (model.object3D && !model.originalMaterials) {
        const { MaterialManager } = require('../utils/materials');
        modelWithMaterials.originalMaterials = MaterialManager.storeOriginalMaterials(model.object3D);
        
        // Analyze skeleton and parts
        modelWithMaterials.skeleton = get().analyzeModelSkeleton(model.object3D);
        modelWithMaterials.parts = get().analyzeModelParts(model.object3D);
      }

      set((state) => ({
        ui: {
          ...state.ui,
          viewport: {
            ...state.ui.viewport,
            loadedModels: [...state.ui.viewport.loadedModels, modelWithMaterials]
          }
        }
      }));
    },

    removeModel: (modelId: string) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: {
            ...state.ui.viewport,
            loadedModels: state.ui.viewport.loadedModels.filter(m => m.id !== modelId),
            selection: state.ui.viewport.selection.filter(id => id !== modelId)
          }
        }
      }));
    },

    updateModel: (modelId: string, updates: Partial<LoadedModel>) => {
      set((state) => {
        const modelIndex = state.ui.viewport.loadedModels.findIndex(m => m.id === modelId);
        if (modelIndex === -1) return state;

        const updatedModels = [...state.ui.viewport.loadedModels];
        const currentModel = updatedModels[modelIndex];
        const updatedModel = { ...currentModel, ...updates };

        // Store original materials if object3D is being set and we don't have them yet
        if (updates.object3D && !currentModel.originalMaterials) {
          const { MaterialManager } = require('../utils/materials');
          updatedModel.originalMaterials = MaterialManager.storeOriginalMaterials(updates.object3D);
        }

        updatedModels[modelIndex] = updatedModel;

        return {
          ui: {
            ...state.ui,
            viewport: {
              ...state.ui.viewport,
              loadedModels: updatedModels
            }
          }
        };
      });
    },

    selectModel: (modelId: string, multi = false) => {
      set((state) => {
        let newSelection: string[];
        
        if (multi) {
          newSelection = state.ui.viewport.selection.includes(modelId)
            ? state.ui.viewport.selection.filter(id => id !== modelId)
            : [...state.ui.viewport.selection, modelId];
        } else {
          newSelection = [modelId];
        }

        // Update model selected state
        const updatedModels = state.ui.viewport.loadedModels.map(model => ({
          ...model,
          selected: newSelection.includes(model.id)
        }));

        return {
          ui: {
            ...state.ui,
            viewport: {
              ...state.ui.viewport,
              selection: newSelection,
              loadedModels: updatedModels
            }
          }
        };
      });
    },

    clearSelection: () => {
      set((state) => {
        const updatedModels = state.ui.viewport.loadedModels.map(model => ({
          ...model,
          selected: false
        }));

        return {
          ui: {
            ...state.ui,
            viewport: {
              ...state.ui.viewport,
              selection: [],
              loadedModels: updatedModels
            }
          }
        };
      });
    },

    setTransforming: (transforming: boolean) => {
      set((state) => ({
        ui: {
          ...state.ui,
          viewport: { ...state.ui.viewport, isTransforming: transforming }
        }
      }));
    },

    transformSelectedModels: (transform: Partial<Pick<LoadedModel, 'position' | 'rotation' | 'scale'>>) => {
      set((state) => {
        const updatedModels = state.ui.viewport.loadedModels.map(model => {
          if (model.selected) {
            const updatedModel = { ...model };
            
            // Apply incremental transforms
            if (transform.position) {
              updatedModel.position = [
                model.position[0] + transform.position[0],
                model.position[1] + transform.position[1],
                model.position[2] + transform.position[2]
              ];
              // Update the actual Three.js object position
              if (model.object3D) {
                model.object3D.position.set(...updatedModel.position);
              }
            }
            
            if (transform.rotation) {
              updatedModel.rotation = [
                model.rotation[0] + transform.rotation[0],
                model.rotation[1] + transform.rotation[1],
                model.rotation[2] + transform.rotation[2]
              ];
              // Update the actual Three.js object rotation
              if (model.object3D) {
                model.object3D.rotation.set(...updatedModel.rotation);
              }
            }
            
            if (transform.scale) {
              updatedModel.scale = [
                model.scale[0] * transform.scale[0],
                model.scale[1] * transform.scale[1],
                model.scale[2] * transform.scale[2]
              ];
              // Update the actual Three.js object scale
              if (model.object3D) {
                model.object3D.scale.set(...updatedModel.scale);
              }
            }
            
            return updatedModel;
          }
          return model;
        });

        return {
          ui: {
            ...state.ui,
            viewport: { ...state.ui.viewport, loadedModels: updatedModels }
          }
        };
      });
    },

    // New function for absolute transforms (used during gizmo operations)
    setSelectedModelsTransform: (transform: Partial<Pick<LoadedModel, 'position' | 'rotation' | 'scale'>>) => {
      set((state) => {
        const updatedModels = state.ui.viewport.loadedModels.map(model => {
          if (model.selected) {
            const updatedModel = { ...model };
            
            // Apply absolute transforms
            if (transform.position) {
              updatedModel.position = [...transform.position];
              // Update the actual Three.js object position
              if (model.object3D) {
                model.object3D.position.set(...updatedModel.position);
              }
            }
            
            if (transform.rotation) {
              updatedModel.rotation = [...transform.rotation];
              // Update the actual Three.js object rotation
              if (model.object3D) {
                model.object3D.rotation.set(...updatedModel.rotation);
              }
            }
            
            if (transform.scale) {
              updatedModel.scale = [...transform.scale];
              // Update the actual Three.js object scale
              if (model.object3D) {
                model.object3D.scale.set(...updatedModel.scale);
              }
            }
            
            return updatedModel;
          }
          return model;
        });

        return {
          ui: {
            ...state.ui,
            viewport: { ...state.ui.viewport, loadedModels: updatedModels }
          }
        };
      });
    },

    deleteSelectedModels: () => {
      set((state) => {
        const selectedIds = new Set(state.ui.viewport.selection);
        const updatedModels = state.ui.viewport.loadedModels.filter(
          model => !selectedIds.has(model.id)
        );

        return {
          ui: {
            ...state.ui,
            viewport: {
              ...state.ui.viewport,
              loadedModels: updatedModels,
              selection: []
            }
          }
        };
      });
    },

    // Modal actions
    openModal: (type: ModalType, data?: any) => {
      set((state) => ({
        ui: {
          ...state.ui,
          modal: { isOpen: true, type, data }
        }
      }));
    },

    closeModal: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          modal: { isOpen: false, type: null, data: undefined }
        }
      }));
    },

    // Notification actions
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp: new Date()
      };

      set((state) => ({
        ui: {
          ...state.ui,
          notifications: [...state.ui.notifications, newNotification]
        }
      }));

      // Auto-remove notification after duration
      if (notification.duration) {
        setTimeout(() => {
          get().removeNotification(id);
        }, notification.duration);
      }

      return id;
    },

    removeNotification: (id: string) => {
      set((state) => ({
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(n => n.id !== id)
        }
      }));
    },

    clearNotifications: () => {
      set((state) => ({
        ui: { ...state.ui, notifications: [] }
      }));
    },

    // System actions
    updateSystemStatus: (status: Partial<SystemState>) => {
      set((state) => ({
        system: { ...state.system, ...status, lastUpdate: new Date() }
      }));
    },

    updatePerformance: (metrics: Partial<PerformanceMetrics>) => {
      set((state) => ({
        system: {
          ...state.system,
          performance: { ...state.system.performance, ...metrics }
        }
      }));
    },

    // Drag and drop actions
    startDrag: (type: string, data: any) => {
      set((state) => ({
        ui: {
          ...state.ui,
          dragAndDrop: {
            isDragging: true,
            dragType: type as any,
            dragData: data
          }
        }
      }));
    },

    endDrag: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          dragAndDrop: {
            isDragging: false,
            dragType: null,
            dragData: undefined
          }
        }
      }));
    },

    // Task result as input actions
    setTaskResultAsInput: (taskId: string | null) => {
      set((state) => ({
        ui: {
          ...state.ui,
          taskResultAsInput: taskId
        }
      }));
    },

    clearTaskResultAsInput: () => {
      set((state) => ({
        ui: {
          ...state.ui,
          taskResultAsInput: null
        }
      }));
    },

    // Model analysis utilities
    analyzeModelSkeleton: (object3D: any) => {
      if (!object3D) return undefined;

      const bones: any[] = [];
      const skinnedMeshes: any[] = [];
      const animations: any[] = [];

      // Find bones and skinned meshes in the object hierarchy
      object3D.traverse((child: any) => {
        if (child.type === 'Bone' || child.isBone === true) {
          // For bones found in the hierarchy, store both local and world positions
          const boneData = {
            bone: child,
            name: child.name || `Bone_${bones.length}`,
            position: child.position.clone(),
            worldPosition: new THREE.Vector3(),
            parent: child.parent && (child.parent.type === 'Bone' || child.parent.isBone) ? child.parent : null
          };
          
          // Calculate world position
          child.updateMatrixWorld(true);
          child.getWorldPosition(boneData.worldPosition);
          
          bones.push(boneData);
        }
        if (child.type === 'SkinnedMesh' || child.isSkinnedMesh === true) {
          skinnedMeshes.push(child);
          if (child.skeleton && child.skeleton.bones) {
            // Add skeleton bones if not already included
            child.skeleton.bones.forEach((bone: any) => {
              // Check if this bone is already in our list
              const existingBone = bones.find(b => b.bone === bone);
              if (!existingBone) {
                const boneData = {
                  bone: bone,
                  name: bone.name || `SkeletonBone_${bones.length}`,
                  position: bone.position.clone(),
                  worldPosition: new THREE.Vector3(),
                  parent: bone.parent && (bone.parent.type === 'Bone' || bone.parent.isBone) ? bone.parent : null
                };
                
                // Calculate world position
                bone.updateMatrixWorld(true);
                bone.getWorldPosition(boneData.worldPosition);
                
                bones.push(boneData);
              }
            });
          }
        }
      });

      // Check for animations
      if (object3D.animations && object3D.animations.length > 0) {
        animations.push(...object3D.animations);
      }

      if (bones.length > 0 || skinnedMeshes.length > 0) {
        return {
          bones,
          skinnedMeshes,
          animations
        };
      }

      return undefined;
    },

    analyzeModelParts: (object3D: any) => {
      if (!object3D) return undefined;

      const meshGroups: any[] = [];
      const meshes: any[] = [];

      // Collect all meshes
      object3D.traverse((child: any) => {
        if (child.type === 'Mesh' || (child.isMesh === true) || (child.geometry && child.material)) {
          meshes.push(child);
        }
      });

      // If we have more than one mesh, consider it as having parts
      if (meshes.length > 1) {
        // For parts visualization, each mesh should be its own part
        meshes.forEach((mesh, index) => {
          meshGroups.push({
            name: `Part ${index + 1}`,
            meshes: [mesh],
            originalMaterial: mesh.material
          });
        });

        return {
          meshGroups,
          hasParts: meshGroups.length > 1
        };
      }
      return {
        meshGroups: [],
        hasParts: false
      };
    },

    // Authentication actions
    checkAuthStatus: async () => {
      set((state) => ({
        auth: { ...state.auth, isCheckingAuth: true }
      }));

      try {
        const { getApiClient } = await import('../api/client');
        const apiClient = getApiClient();
        const authStatus = await apiClient.getAuthStatus();
        
        set((state) => ({
          auth: { 
            ...state.auth, 
            authStatus,
            isCheckingAuth: false
          }
        }));
      } catch (error) {
        console.error('Failed to check auth status:', error);
        set((state) => ({
          auth: { 
            ...state.auth, 
            authStatus: null,
            isCheckingAuth: false
          }
        }));
      }
    },

    login: async (username: string, password: string) => {
      try {
        const { getApiClient } = await import('../api/client');
        const apiClient = getApiClient();
        const response = await apiClient.login({ username, password });
        
        console.log('[Auth] Login successful, token received:', response.token.substring(0, 20) + '...');
        
        // Check if cached tasks belong to a different user
        const { taskPersistence } = await import('../services/taskPersistence');
        const cachedUserId = taskPersistence.getCachedUserId();
        
        if (cachedUserId && cachedUserId !== response.user.user_id) {
          console.log(`[Auth] Cached tasks belong to different user, clearing...`);
          taskPersistence.clearTasks();
          // Clear tasks in store as well
          set((state) => ({
            tasks: {
              ...state.tasks,
              tasks: [],
              activeTasks: [],
              completedTasks: [],
              failedTasks: []
            }
          }));
        }
        
        // Save auth data
        const { authPersistence } = await import('../services/authPersistence');
        authPersistence.saveAuth(response.token, response.user);
        
        // Update API client with token - this is critical!
        apiClient.setAuthToken(response.token);
        console.log('[Auth] Token set on API client');
        
        // Update store
        set((state) => ({
          auth: {
            ...state.auth,
            isAuthenticated: true,
            token: response.token,
            user: response.user
          }
        }));

        // Show success notification
        get().addNotification({
          type: 'success',
          title: 'Login Successful',
          message: `Welcome back, ${response.user.username}!`,
          duration: 3000
        });

        // Load tasks for this user
        await get().initializeTasks();
      } catch (error: any) {
        console.error('Login failed:', error);
        get().addNotification({
          type: 'error',
          title: 'Login Failed',
          message: error.message || 'Invalid credentials',
          duration: 5000
        });
        throw error;
      }
    },

    register: async (username: string, email: string, password: string) => {
      try {
        const { getApiClient } = await import('../api/client');
        const apiClient = getApiClient();
        const response = await apiClient.register({ username, email, password });
        
        console.log('[Auth] Registration successful, token received:', response.token.substring(0, 20) + '...');
        
        // Clear any existing cached tasks (new user shouldn't see old data)
        const { taskPersistence } = await import('../services/taskPersistence');
        taskPersistence.clearTasks();
        
        // Save auth data
        const { authPersistence } = await import('../services/authPersistence');
        authPersistence.saveAuth(response.token, response.user);
        
        // Update API client with token - this is critical!
        apiClient.setAuthToken(response.token);
        console.log('[Auth] Token set on API client');
        
        // Update store
        set((state) => ({
          auth: {
            ...state.auth,
            isAuthenticated: true,
            token: response.token,
            user: response.user
          },
          tasks: {
            ...state.tasks,
            tasks: [],
            activeTasks: [],
            completedTasks: [],
            failedTasks: []
          }
        }));

        // Show success notification
        get().addNotification({
          type: 'success',
          title: 'Registration Successful',
          message: `Welcome, ${response.user.username}!`,
          duration: 3000
        });

        // Initialize tasks for new user (should be empty from backend)
        await get().initializeTasks();
      } catch (error: any) {
        console.error('Registration failed:', error);
        get().addNotification({
          type: 'error',
          title: 'Registration Failed',
          message: error.message || 'Registration failed',
          duration: 5000
        });
        throw error;
      }
    },

    logout: () => {
      console.log('[Auth] Logging out, clearing user data...');
      
      // Clear cached tasks (they belong to the logged out user)
      import('../services/taskPersistence').then(({ taskPersistence }) => {
        taskPersistence.clearTasks();
      });
      
      // Clear persisted auth
      import('../services/authPersistence').then(({ authPersistence }) => {
        authPersistence.clearAuth();
      });

      // Clear API client token
      import('../api/client').then(({ getApiClient }) => {
        const apiClient = getApiClient();
        apiClient.setAuthToken(null);
      });

      // Clear store auth state and tasks
      set((state) => ({
        auth: {
          ...state.auth,
          isAuthenticated: false,
          token: null,
          user: null
        },
        tasks: {
          ...state.tasks,
          tasks: [],
          activeTasks: [],
          completedTasks: [],
          failedTasks: []
        }
      }));

      // Show notification
      get().addNotification({
        type: 'info',
        title: 'Logged Out',
        message: 'You have been logged out successfully',
        duration: 3000
      });
    },

    setAuthToken: (token: string | null) => {
      set((state) => ({
        auth: { ...state.auth, token, isAuthenticated: !!token }
      }));

      // Update API client
      import('../api/client').then(({ getApiClient }) => {
        const apiClient = getApiClient();
        apiClient.setAuthToken(token);
      });
    },

    setAuthUser: (user: UserInfo | null) => {
      set((state) => ({
        auth: { ...state.auth, user }
      }));
    },

    loadSavedAuth: () => {
      import('../services/authPersistence').then(({ authPersistence }) => {
        const savedAuth = authPersistence.loadAuth();
        
        if (savedAuth) {
          // Update store
          set((state) => ({
            auth: {
              ...state.auth,
              isAuthenticated: true,
              token: savedAuth.token,
              user: savedAuth.user
            }
          }));

          // Update API client
          import('../api/client').then(({ getApiClient }) => {
            const apiClient = getApiClient();
            apiClient.setAuthToken(savedAuth.token);
          });
        }
      });
    },

    // Game Studio actions
    createGameProject: (genre: GameGenre, name: string, gameType: '2d' | '3d' = '3d', template?: string) => {
      const projectId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const defaultGameConfig: GameConfig = {
        title: name,
        width: 800,
        height: 600,
        backgroundColor: '#1a1a2e',
        physics: genre === 'platformer' || genre === 'arcade',
        controls: {
          type: 'both',
          mappings: {
            'ArrowUp': 'jump',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'Space': 'action'
          }
        },
        scenes: [{
          id: 'main',
          name: 'Main Scene',
          isStartScene: true,
          objects: []
        }],
        playerConfig: {
          speed: 5,
          jumpHeight: 15,
          health: 100,
          abilities: []
        }
      };
      
      const newProject: GameProject = {
        id: projectId,
        name,
        description: '',
        genre,
        gameType,
        template,
        status: 'ideation',
        createdAt: new Date(),
        updatedAt: new Date(),
        conversation: [{
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Welcome to Game Studio! 🎮 I'm here to help you create an amazing ${gameType?.toUpperCase()} ${genre} game called "${name}".\n\nLet's start by discussing your vision:\n- What's the main goal of your game?\n- What makes it unique or fun?\n- Do you have any reference games in mind?\n\nTell me about your game idea and I'll help bring it to life!`,
          timestamp: new Date()
        }],
        gameConfig: defaultGameConfig,
        assets: []
      };
      
      set((state) => {
        const newProjects = [...state.gameStudio.projects, newProject];
        
        // Persist to localStorage using helper
        persistGameProjects(newProjects, projectId);
        
        return {
          gameStudio: {
            ...state.gameStudio,
            projects: newProjects,
            currentProjectId: projectId
          }
        };
      });
      
      return projectId;
    },

    updateGameProject: (projectId: string, updates: Partial<GameProject>) => {
      set((state) => {
        const projectIndex = state.gameStudio.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) return state;
        
        const updatedProjects = [...state.gameStudio.projects];
        updatedProjects[projectIndex] = {
          ...updatedProjects[projectIndex],
          ...updates,
          updatedAt: new Date()
        };
        
        // Persist to localStorage using helper
        persistGameProjects(updatedProjects);
        
        return {
          gameStudio: {
            ...state.gameStudio,
            projects: updatedProjects
          }
        };
      });
    },

    deleteGameProject: (projectId: string) => {
      set((state) => {
        const newProjects = state.gameStudio.projects.filter(p => p.id !== projectId);
        const newCurrentId = state.gameStudio.currentProjectId === projectId 
          ? null 
          : state.gameStudio.currentProjectId;
        
        // Persist to localStorage using helper
        persistGameProjects(newProjects, newCurrentId);
        
        return {
          gameStudio: {
            ...state.gameStudio,
            projects: newProjects,
            currentProjectId: newCurrentId
          }
        };
      });
    },

    setCurrentGameProject: (projectId: string | null) => {
      set((state) => {
        // Persist current project ID
        import('../services/gameProjectPersistence').then(({ gameProjectPersistence }) => {
          gameProjectPersistence.saveCurrentProjectId(projectId);
        });
        
        return {
          gameStudio: {
            ...state.gameStudio,
            currentProjectId: projectId
          }
        };
      });
    },

    addChatMessage: (projectId: string, message: ChatMessage) => {
      set((state) => {
        const projectIndex = state.gameStudio.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) return state;
        
        const updatedProjects = [...state.gameStudio.projects];
        updatedProjects[projectIndex] = {
          ...updatedProjects[projectIndex],
          conversation: [...updatedProjects[projectIndex].conversation, message],
          updatedAt: new Date()
        };
        
        // Persist to localStorage using helper
        persistGameProjects(updatedProjects);
        
        return {
          gameStudio: {
            ...state.gameStudio,
            projects: updatedProjects
          }
        };
      });
    },

    setGameStudioGenerating: (isGenerating: boolean) => {
      set((state) => ({
        gameStudio: {
          ...state.gameStudio,
          isGenerating
        }
      }));
    },

    buildGame: async (projectId: string) => {
      const state = get();
      const project = state.gameStudio.projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      // Import the game code generator
      const { GameCodeGenerator } = await import('../utils/gameCodeGenerator');
      
      // Generate the game code
      const gameCode = GameCodeGenerator.generateHTML5Game(project);
      const previewUrl = GameCodeGenerator.getPreviewDataUrl(project);
      
      // Update project with generated code
      set((state) => {
        const projectIndex = state.gameStudio.projects.findIndex(p => p.id === projectId);
        if (projectIndex === -1) return state;
        
        const updatedProjects = [...state.gameStudio.projects];
        updatedProjects[projectIndex] = {
          ...updatedProjects[projectIndex],
          status: 'testing',
          generatedCode: gameCode,
          previewUrl,
          updatedAt: new Date()
        };
        
        // Persist to localStorage using helper
        persistGameProjects(updatedProjects);
        
        return {
          gameStudio: {
            ...state.gameStudio,
            projects: updatedProjects
          }
        };
      });
      
      // Add a message to the chat
      get().addChatMessage(projectId, {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `🎉 Your ${project.genre} game has been built successfully!\n\n**What's next:**\n- Click "Export" to download the game as an HTML file\n- The game runs in any browser, no installation needed\n- Share the file with friends or host it online\n\nWould you like to make any changes to the game?`,
        timestamp: new Date()
      });
    },

    exportGame: (projectId: string) => {
      const state = get();
      const project = state.gameStudio.projects.find(p => p.id === projectId);
      if (!project || !project.generatedCode) {
        throw new Error('No game code to export. Build the game first.');
      }
      
      // Download the game
      import('../utils/gameCodeGenerator').then(({ GameCodeGenerator }) => {
        GameCodeGenerator.downloadGame(project);
      });
    },

    // Utility actions
    reset: () => {
      set(defaultState);
    }
  }))
);

// Selectors for common state access patterns
export const useCurrentModule = () => useStore(state => state.currentModule);
export const useCurrentFeature = () => useStore(state => state.currentFeature);
export const useSettings = () => useStore(state => state.settings);
export const useTasks = () => useStore(state => state.tasks);
export const useActiveTasks = () => useStore(state => 
  state.tasks.tasks.filter(task => state.tasks.activeTasks.includes(task.id))
);
export const useUI = () => useStore(state => state.ui);
export const useViewport = () => useStore(state => state.ui.viewport);
export const useNotifications = () => useStore(state => state.ui.notifications);
export const useSystem = () => useStore(state => state.system);
export const useLoading = () => useStore(state => state.isLoading);
export const useError = () => useStore(state => state.error);

// Action selectors
export const useStoreActions = () => {
  const store = useStore();
  return {
    setCurrentModule: store.setCurrentModule,
    setCurrentFeature: store.setCurrentFeature,
    setLoading: store.setLoading,
    setError: store.setError,
    updateSettings: store.updateSettings,
    addTask: store.addTask,
    updateTask: store.updateTask,
    removeTask: store.removeTask,
    clearCompletedTasks: store.clearCompletedTasks,
    clearFailedTasks: store.clearFailedTasks,
    clearAllTasks: store.clearAllTasks,
    initializeTasks: store.initializeTasks,
    loadTasksFromHistory: store.loadTasksFromHistory,
    toggleLeftSidebar: store.toggleLeftSidebar,
    toggleRightSidebar: store.toggleRightSidebar,
    setRenderMode: store.setRenderMode,
    setCurrentTool: store.setCurrentTool,
    setTransformMode: store.setTransformMode,
    setGizmoVisible: store.setGizmoVisible,
    setSnapToGrid: store.setSnapToGrid,
    setGridSize: store.setGridSize,
    setDoubleSided: store.setDoubleSided,
    addModel: store.addModel,
    removeModel: store.removeModel,
    updateModel: store.updateModel,
    selectModel: store.selectModel,
    clearSelection: store.clearSelection,
    setTransforming: store.setTransforming,
    transformSelectedModels: store.transformSelectedModels,
    setSelectedModelsTransform: store.setSelectedModelsTransform,
    deleteSelectedModels: store.deleteSelectedModels,
    openModal: store.openModal,
    closeModal: store.closeModal,
    addNotification: store.addNotification,
    removeNotification: store.removeNotification,
    updateSystemStatus: store.updateSystemStatus,
    setTaskResultAsInput: store.setTaskResultAsInput,
    clearTaskResultAsInput: store.clearTaskResultAsInput,
    checkAuthStatus: store.checkAuthStatus,
    login: store.login,
    register: store.register,
    logout: store.logout,
    setAuthToken: store.setAuthToken,
    setAuthUser: store.setAuthUser,
    loadSavedAuth: store.loadSavedAuth,
    // Game Studio actions
    createGameProject: store.createGameProject,
    updateGameProject: store.updateGameProject,
    deleteGameProject: store.deleteGameProject,
    setCurrentGameProject: store.setCurrentGameProject,
    addChatMessage: store.addChatMessage,
    setGameStudioGenerating: store.setGameStudioGenerating,
    buildGame: store.buildGame,
    exportGame: store.exportGame
  };
};

export default useStore; 