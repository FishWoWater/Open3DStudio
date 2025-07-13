import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
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
  TransformMode
} from '../types/state';

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

const defaultUIState: UIState = {
  sidebar: {
    leftCollapsed: false,
    rightCollapsed: false,
    width: 400
  },
  viewport: {
    renderMode: 'solid',
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
    gridSize: 0.2
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
  }
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

const defaultState: AppState = {
  currentModule: 'mesh-generation',
  currentFeature: 'text-to-mesh',
  isLoading: false,
  error: null,
  settings: defaultSettings,
  tasks: defaultTaskState,
  ui: defaultUIState,
  system: defaultSystemState
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
        'mesh-generation': 'text-to-mesh',
        'mesh-painting': 'text-painting',
        'mesh-segmentation': 'segment-mesh',
        'part-completion': 'complete-parts',
        'auto-rigging': 'generate-rig'
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
      set((state) => ({
        settings: { ...state.settings, ...settings }
      }));
    },

    resetSettings: () => {
      set({ settings: defaultSettings });
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
        
        // Save to localStorage
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks(newTasks);
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

        // Save to localStorage
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks(newTasks);
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
        const newTasks = state.tasks.tasks.filter(t => t.id !== taskId);
        
        // Save to localStorage
        import('../services/taskPersistence').then(({ taskPersistence }) => {
          taskPersistence.saveTasks(newTasks);
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
        return {
          tasks: {
            ...state.tasks,
            tasks: state.tasks.tasks.filter(t => !completedTaskIds.has(t.id)),
            completedTasks: []
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
        const { taskPersistence } = await import('../services/taskPersistence');
        const tasks = await taskPersistence.initializeAndSync();
        
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
        const { taskPersistence } = await import('../services/taskPersistence');
        const currentTasks = get().tasks.tasks;
        const mergedTasks = await taskPersistence.mergeTasks(currentTasks);
        
        // Save merged tasks back to localStorage
        taskPersistence.saveTasks(mergedTasks);
        
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

    // Viewport actions
    addModel: (model: LoadedModel) => {
      // Store original materials if the model has object3D
      let modelWithMaterials = { ...model };
      if (model.object3D && !model.originalMaterials) {
        const { MaterialManager } = require('../utils/materials');
        modelWithMaterials.originalMaterials = MaterialManager.storeOriginalMaterials(model.object3D);
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
    updateSystemStatus: store.updateSystemStatus
  };
};

export default useStore; 