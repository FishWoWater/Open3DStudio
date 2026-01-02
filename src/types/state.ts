import { JobStatus, OutputFormat, JobInfo, SystemStatus, AuthStatus, UserInfo } from './api';
import * as THREE from 'three';

// Application State Types
export interface AppState {
  currentModule: ModuleType;
  currentFeature: string;
  isLoading: boolean;
  error: string | null;
  settings: AppSettings;
  tasks: TaskState;
  ui: UIState;
  system: SystemState;
  auth: AuthState;
  gameStudio: GameStudioState;
}

// Authentication State Types
export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserInfo | null;
  authStatus: AuthStatus | null;
  isCheckingAuth: boolean;
}

// Module Types
export type ModuleType = 
  | 'game-studio'
  | 'mesh-generation' 
  | 'mesh-painting' 
  | 'mesh-segmentation' 
  | 'part-completion' 
  | 'auto-rigging'
  | 'mesh-retopology'
  | 'mesh-uv-unwrapping';

export interface ModuleConfig {
  id: ModuleType;
  name: string;
  icon: string;
  features: FeatureConfig[];
}

export interface FeatureConfig {
  id: string;
  name: string;
  component: string;
  description: string;
}

// Game Studio Types
export type GameType = '2d' | '3d';

export interface GameProject {
  id: string;
  name: string;
  description: string;
  genre: GameGenre;
  gameType: GameType;
  template?: string;
  status: 'ideation' | 'designing' | 'building' | 'testing' | 'deployed';
  createdAt: Date;
  updatedAt: Date;
  conversation: ChatMessage[];
  gameConfig: GameConfig;
  assets: GameAsset[];
  generatedCode?: string;
  previewUrl?: string;
  deploymentUrl?: string;
}

export type GameGenre = 
  | 'platformer'
  | 'puzzle'
  | 'shooter'
  | 'racing'
  | 'rpg'
  | 'adventure'
  | 'simulation'
  | 'arcade'
  | 'educational'
  | 'other';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    suggestedAssets?: string[];
    gameConfigUpdates?: Partial<GameConfig>;
  };
}

export interface GameConfig {
  title: string;
  width: number;
  height: number;
  backgroundColor: string;
  physics: boolean;
  controls: ControlScheme;
  scenes: GameScene[];
  playerConfig?: PlayerConfig;
}

export interface ControlScheme {
  type: 'keyboard' | 'touch' | 'both';
  mappings: Record<string, string>;
}

export interface GameScene {
  id: string;
  name: string;
  isStartScene: boolean;
  objects: GameObject[];
  background?: string;
}

export interface GameObject {
  id: string;
  type: 'player' | 'enemy' | 'collectible' | 'obstacle' | 'decoration' | 'trigger';
  name: string;
  position: { x: number; y: number; z?: number };
  size: { width: number; height: number; depth?: number };
  assetId?: string;
  properties: Record<string, any>;
}

export interface PlayerConfig {
  speed: number;
  jumpHeight?: number;
  health?: number;
  abilities?: string[];
}

export interface GameAsset {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'sprite' | 'sound';
  status: 'pending' | 'generating' | 'ready' | 'failed';
  taskId?: string;
  url?: string;
  prompt?: string;
}

export interface GameStudioState {
  projects: GameProject[];
  currentProjectId: string | null;
  isGenerating: boolean;
  chatInput: string;
}

// Settings Types
export interface AppSettings {
  apiEndpoint: string;
  apiKey?: string;
  theme: ThemeType;
  autoSave: boolean;
  defaultOutputFormat: OutputFormat;
  maxConcurrentTasks: number;
  pollingInterval: number;
  language: string;
}

export type ThemeType = 'dark' | 'light' | 'auto';

// Task Management Types
export interface TaskState {
  tasks: Task[];
  activeTasks: string[];
  completedTasks: string[];
  failedTasks: string[];
  isPolling: boolean;
}

export interface Task {
  id: string;
  jobId?: string;
  type: TaskType;
  name: string;
  status: JobStatus;
  createdAt: Date;
  completedAt?: Date;
  processingTime?: number;
  progress?: number;
  inputData: TaskInputData;
  result?: TaskResult;
  error?: string;
  thumbnail?: string;
  inputImageUrl?: string; // URL to input image from API response (persists across sessions)
  modelPreference?: string; // Model used for this task
}

export type TaskType = 
  | 'text-to-mesh'
  | 'image-to-mesh'
  // | 'text-to-textured-mesh'
  // | 'image-to-textured-mesh'
  | 'text-mesh-painting'
  | 'image-mesh-painting'
  | 'mesh-seg'
  | 'part-completion'
  | 'auto-rigging'
  | 'mesh-retopo'
  | 'mesh-uv-unwrap';

export interface TaskInputData {
  textPrompt?: string;
  texturePrompt?: string;
  files?: UploadedFile[];
  parameters?: Record<string, any>;
}

export interface TaskResult {
  outputPath?: string;
  downloadUrl?: string;
  fileSize?: number;
  format?: string;
  previewImageUrl?: string; 
  metadata?: Record<string, any>;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  base64?: string;
  path?: string;
}

// UI State Types
export interface UIState {
  sidebar: SidebarState;
  viewport: ViewportState;
  modal: ModalState;
  notifications: Notification[];
  dragAndDrop: DragDropState;
  taskResultAsInput: string | null; // Task ID whose result should be used as input
}

export interface SidebarState {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  width: number;
}

export interface ViewportState {
  renderMode: RenderMode;
  camera: CameraState;
  selection: string[];
  loadedModels: LoadedModel[];
  lighting: LightingConfig;
  background: BackgroundType;
  currentTool: ViewportTool;
  isTransforming: boolean;
  transformMode: TransformMode;
  gizmoVisible: boolean;
  snapToGrid: boolean;
  gridSize: number;
  doubleSided: boolean;
}

export type RenderMode = 'solid' | 'wireframe' | 'rendered' | 'material' | 'parts' | 'skeleton';
export type BackgroundType = 'default' | 'environment' | 'color' | 'gradient';
export type ViewportTool = 'select' | 'move' | 'rotate' | 'scale';
export type TransformMode = 'local' | 'world' | 'screen';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
}

export interface LoadedModel {
  id: string;
  name: string;
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  visible: boolean;
  selected: boolean;
  metadata?: Record<string, any>;
  object3D?: any;
  material?: ModelMaterial;
  boundingBox?: BoundingBox;
  // Store original materials for imported models to enable proper material switching
  originalMaterials?: (THREE.Material | THREE.Material[])[];
  // Skeleton information for skeleton render mode
  skeleton?: {
    bones: any[]; // THREE.Bone objects
    skinnedMeshes: any[]; // Meshes with skeleton
    animations?: any[]; // AnimationClips if available
  };
  // Parts information for parts render mode
  parts?: {
    meshGroups: { 
      name: string; 
      meshes: any[]; // THREE.Mesh objects in this group
      originalMaterial?: any; 
    }[];
    hasParts: boolean;
  };
}

export interface ModelMaterial {
  type: 'standard' | 'phong' | 'lambert' | 'wireframe' | 'depth' | 'normal';
  color?: string;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  texture?: string;
}

export interface BoundingBox {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
  size: [number, number, number];
}

export interface LightingConfig {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalPosition: [number, number, number];
  enableShadows: boolean;
}

export interface ModalState {
  isOpen: boolean;
  type: ModalType | null;
  data?: any;
}

export type ModalType = 
  | 'settings'
  | 'task-details'
  | 'file-upload'
  | 'model-viewer'
  | 'uv-viewer'
  | 'about'
  | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  duration?: number;
  actions?: NotificationAction[];
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationAction {
  label: string;
  action: () => void;
}

export interface DragDropState {
  isDragging: boolean;
  dragType: DragType | null;
  dragData?: any;
}

export type DragType = 'file' | 'model' | 'task';

// System State Types
export interface SystemState {
  status?: SystemStatus;
  isOnline: boolean;
  lastUpdate?: Date;
  lastChecked?: Date;
  performance: PerformanceMetrics;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage?: number;
  renderTime: number;
  frameRate: number;
}

// Form State Types
export interface FormState<T = any> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// Action Types for State Management
export interface Action<T = any> {
  type: string;
  payload?: T;
}

// Reducer Types
export type Reducer<T> = (state: T, action: Action) => T;

// Store Types
export interface Store<T = AppState> {
  getState: () => T;
  dispatch: (action: Action) => void;
  subscribe: (listener: () => void) => () => void;
}