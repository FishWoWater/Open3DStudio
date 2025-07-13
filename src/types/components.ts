import { ReactNode, MouseEvent, ChangeEvent, DragEvent } from 'react';
import { Task, UploadedFile, ModuleType, RenderMode, NotificationType } from './state';
import { OutputFormat, JobStatus } from './api';

// Base Component Props
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
  id?: string;
  testId?: string;
}

// Layout Component Props
export interface TopBarProps extends BaseComponentProps {
  currentModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  onSettingsClick: () => void;
}

export interface SidebarProps extends BaseComponentProps {
  isLeft?: boolean;
  isCollapsed: boolean;
  width: number;
  onToggle: () => void;
  onResize: (width: number) => void;
}

export interface ViewportProps extends BaseComponentProps {
  renderMode: RenderMode;
  onRenderModeChange: (mode: RenderMode) => void;
  loadedModels: any[];
  onModelLoad: (model: any) => void;
}

export interface BottomBarProps extends BaseComponentProps {
  renderMode: RenderMode;
  onRenderModeChange: (mode: RenderMode) => void;
  selectedTool: string;
  onToolChange: (tool: string) => void;
  status: string;
}

// Feature Component Props
export interface FeaturePanelProps extends BaseComponentProps {
  moduleType: ModuleType;
  currentFeature: string;
  onFeatureChange: (feature: string) => void;
}

export interface TextToMeshProps extends BaseComponentProps {
  onSubmit: (data: TextToMeshFormData) => void;
  isLoading: boolean;
  error?: string;
}

export interface ImageToMeshProps extends BaseComponentProps {
  onSubmit: (data: ImageToMeshFormData) => void;
  onFileUpload: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  isLoading: boolean;
  error?: string;
}

export interface MeshPaintingProps extends BaseComponentProps {
  paintingType: 'text' | 'image';
  onSubmit: (data: MeshPaintingFormData) => void;
  onFileUpload: (files: File[], type: 'mesh' | 'texture') => void;
  uploadedFiles: UploadedFile[];
  isLoading: boolean;
  error?: string;
}

export interface MeshSegmentationProps extends BaseComponentProps {
  onSubmit: (data: MeshSegmentationFormData) => void;
  onFileUpload: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  isLoading: boolean;
  error?: string;
}

export interface PartCompletionProps extends BaseComponentProps {
  onSubmit: (data: PartCompletionFormData) => void;
  onFileUpload: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  isLoading: boolean;
  error?: string;
}

export interface AutoRiggingProps extends BaseComponentProps {
  onSubmit: (data: AutoRiggingFormData) => void;
  onFileUpload: (files: File[]) => void;
  uploadedFiles: UploadedFile[];
  isLoading: boolean;
  error?: string;
}

// Form Data Types
export interface TextToMeshFormData {
  textPrompt: string;
  outputFormat: OutputFormat;
  generateTextured: boolean;
  texturePrompt?: string;
  textureResolution?: number;
  modelPreference?: string;
}

export interface ImageToMeshFormData {
  outputFormat: OutputFormat;
  generateTextured: boolean;
  textureResolution?: number;
  modelPreference?: string;
  imageFile?: File;
}

export interface MeshPaintingFormData {
  paintingType: 'text' | 'image';
  textPrompt?: string;
  textureResolution: number;
  outputFormat: OutputFormat;
  modelPreference?: string;
  meshFile?: File;
  textureFile?: File;
}

export interface MeshSegmentationFormData {
  numParts: number;
  outputFormat: 'glb' | 'json';
  segmentationMethod: 'semantic' | 'geometric';
  modelPreference?: string;
  meshFile?: File;
}

export interface PartCompletionFormData {
  completionMode: 'auto' | 'manual';
  outputFormat: OutputFormat;
  completionQuality: 'fast' | 'balanced' | 'high';
  modelPreference?: string;
  meshFile?: File;
}

export interface AutoRiggingFormData {
  rigMode: 'skeleton' | 'skin' | 'full';
  characterType: 'humanoid' | 'quadruped' | 'generic';
  outputFormat: 'fbx' | 'glb';
  autoDetectJoints: boolean;
  includeIKChains: boolean;
  generateControlCurves: boolean;
  modelPreference?: string;
  meshFile?: File;
}

// UI Component Props
export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'url';
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface TextareaProps extends BaseComponentProps {
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export interface SelectProps extends BaseComponentProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ToggleProps extends BaseComponentProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  onChange?: (checked: boolean) => void;
}

export interface SliderProps extends BaseComponentProps {
  min: number;
  max: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  disabled?: boolean;
  label?: string;
  marks?: boolean;
  formatValue?: (value: number) => string;
  onChange?: (value: number) => void;
}

export interface DropzoneProps extends BaseComponentProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  onDrop: (files: File[]) => void;
  onError?: (error: string) => void;
  uploadedFiles?: UploadedFile[];
  placeholder?: string;
  icon?: string;
}

export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  animated?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
}

export interface TooltipProps extends BaseComponentProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

export interface NotificationProps extends BaseComponentProps {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

// Task Component Props
export interface TaskListProps extends BaseComponentProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskRetry: (taskId: string) => void;
  onClearCompleted: () => void;
}

export interface TaskItemProps extends BaseComponentProps {
  task: Task;
  onClick: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onRetry: (taskId: string) => void;
  onDownload: (taskId: string) => void;
  onViewInViewport: (taskId: string) => void;
}

export interface TaskStatusBadgeProps extends BaseComponentProps {
  status: JobStatus;
  progress?: number;
}

// Settings Component Props
export interface SettingsPanelProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsFormData;
  onSave: (settings: SettingsFormData) => void;
}

export interface SettingsFormData {
  apiEndpoint: string;
  apiKey?: string;
  theme: 'dark' | 'light' | 'auto';
  language: string;
  autoSave: boolean;
  defaultOutputFormat: OutputFormat;
  maxConcurrentTasks: number;
  pollingInterval: number;
}

// 3D Viewer Component Props
export interface ThreeViewerProps extends BaseComponentProps {
  models: ViewerModel[];
  renderMode: RenderMode;
  camera?: CameraConfig;
  lighting?: LightingConfig;
  background?: BackgroundConfig;
  onModelSelect?: (modelId: string) => void;
  onModelTransform?: (modelId: string, transform: Transform) => void;
  onCameraChange?: (camera: CameraConfig) => void;
}

export interface ViewerModel {
  id: string;
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  visible?: boolean;
  selected?: boolean;
}

export interface CameraConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
}

export interface LightingConfig {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalPosition: [number, number, number];
  enableShadows: boolean;
}

export interface BackgroundConfig {
  type: 'color' | 'gradient' | 'environment';
  color?: string;
  gradient?: [string, string];
  environmentMap?: string;
}

export interface Transform {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

// Event Handler Types
export interface DragHandlers {
  onDragStart?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragEnter?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
}

export interface FileUploadHandlers {
  onFileSelect?: (files: File[]) => void;
  onFileUpload?: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
  onUploadComplete?: (uploadedFiles: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
}

// Hook Return Types
export interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  handleSubmit: (onSubmit: (values: T) => void) => void;
  reset: () => void;
}

export interface UseFileUploadReturn {
  uploadedFiles: UploadedFile[];
  uploading: boolean;
  progress: number;
  error: string | null;
  uploadFiles: (files: File[]) => Promise<void>;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
} 