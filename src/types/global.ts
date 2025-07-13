// Global type definitions and augmentations

// Three.js and React Three Fiber extensions
declare global {
  // Window object augmentation for Electron
  interface Window {
    electronAPI?: {
      // File operations
      selectFile: () => Promise<string | null>;
      selectDirectory: () => Promise<string | null>;
      readFile: (path: string) => Promise<ArrayBuffer>;
      writeFile: (path: string, data: ArrayBuffer) => Promise<void>;
      
      // System operations
      getSystemInfo: () => Promise<{
        platform: string;
        arch: string;
        version: string;
      }>;
      
      // App operations
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      toggleFullscreen: () => void;
      
      // Menu event handlers (used in App.tsx)
      onMenuNewProject: (callback: () => void) => void;
      onMenuOpenProject: (callback: () => void) => void;
      onMenuSaveProject: (callback: () => void) => void;
      onMenuImportModel: (callback: () => void) => void;
      onMenuExportModel: (callback: () => void) => void;
      onMenuAbout: (callback: () => void) => void;
      
      // IPC communication
      send: (channel: string, data?: any) => void;
      receive: (channel: string, callback: (data: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      group: any;
      mesh: any;
      geometry: any;
      material: any;
      primitive: any;
    }
  }
}

// Styled Components theme augmentation
declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      gray: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      success: string;
      warning: string;
      error: string;
      info: string;
      background: {
        primary: string;
        secondary: string;
        tertiary: string;
      };
      text: {
        primary: string;
        secondary: string;
        muted: string;
      };
      border: {
        default: string;
        hover: string;
        focus: string;
      };
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    borderRadius: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
      full: string;
    };
    shadows: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
    typography: {
      fontFamily: {
        sans: string;
        mono: string;
      };
      fontSize: {
        xs: string;
        sm: string;
        base: string;
        lg: string;
        xl: string;
        '2xl': string;
        '3xl': string;
        '4xl': string;
      };
      fontWeight: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
      };
      lineHeight: {
        tight: number;
        normal: number;
        relaxed: number;
      };
    };
    transitions: {
      fast: string;
      normal: string;
      slow: string;
    };
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  }
}

// Error types for better error handling
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

// Utility types
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

// Event types
export interface CustomEvent<T = any> {
  type: string;
  detail: T;
  timestamp: number;
}

// File handling types
export interface FileWithPath extends File {
  path?: string;
  webkitRelativePath: string;
}

// API response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

// Component ref types
export type ComponentRef<T extends HTMLElement = HTMLDivElement> = React.RefObject<T>;

// Animation frame helper
export type AnimationFrameCallback = (time: number) => void;

// Performance measurement
export interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
}

// Development flags
export interface DevFlags {
  enableDebugMode: boolean;
  enablePerformanceMonitoring: boolean;
  enableVerboseLogging: boolean;
  mockApiResponses: boolean;
}

// Re-export only the types that actually exist
export type { 
  ModuleType,
  Task,
  TaskState,
  UIState,
  SidebarState,
  ViewportState,
  ModalType,
  NotificationType,
  RenderMode,
  LightingConfig as GlobalLightingConfig
} from './state';

export type {
  JobStatus,
  ApiError,
  UploadProgress,
  TextToMeshRequest,
  ImageToMeshRequest,
  MeshPaintingRequest,
  MeshSegmentationRequest,
  PartCompletionRequest,
  AutoRiggingRequest
} from './api';

export type {
  BaseComponentProps,
  FeaturePanelProps,
  TaskItemProps,
  ModalProps,
  NotificationProps
} from './components'; 