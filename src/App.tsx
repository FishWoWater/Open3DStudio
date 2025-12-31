import React, { useEffect, useState } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { createApiClient } from './api/client';
import { useStore, useSettings, useStoreActions, useCurrentModule } from './store';
import { useTaskPolling } from './hooks/useTaskPolling';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { getTheme } from './styles/theme';

// Layout Components
import TopBar from './components/layout/TopBar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import Viewport from './components/layout/Viewport';
import BottomBar from './components/layout/BottomBar';
import SettingsPanel from './components/ui/SettingsPanel';
import NotificationContainer from './components/ui/NotificationContainer';
import LoadingOverlay from './components/ui/LoadingOverlay';
import ErrorBoundary from './components/ui/ErrorBoundary';
import UVViewerModal from './components/ui/UVViewerModal';
import AuthPanel from './components/ui/AuthPanel';
import GamePreview from './components/ui/GamePreview';

// Global Styles
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${props => props.theme.typography.fontFamily.sans};
    background: ${props => props.theme.colors.background.primary};
    color: ${props => props.theme.colors.text.primary};
    overflow: hidden;
    height: 100vh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Scrollbar Styles */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background.secondary};
  }

  ::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border.default};
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.border.hover};
  }

  /* Selection Styles */
  ::selection {
    background: ${props => props.theme.colors.primary[500]}40;
  }

  /* Focus Styles */
  *:focus {
    outline: none;
  }

  *:focus-visible {
    outline: 2px solid ${props => props.theme.colors.primary[500]};
    outline-offset: 2px;
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

// Hook for Electron integration
const useElectronIntegration = () => {
  const { addNotification, openModal } = useStoreActions();

  useEffect(() => {
    if (window.electronAPI) {
      // Menu event handlers
      const handleNewProject = () => {
        addNotification({
          type: 'info',
          title: 'New Project',
          message: 'Starting new project...',
          duration: 3000
        });
      };

      const handleOpenProject = () => {
        openModal('file-upload', { type: 'project' });
      };

      const handleSaveProject = () => {
        addNotification({
          type: 'success',
          title: 'Project Saved',
          message: 'Project saved successfully',
          duration: 3000
        });
      };

      const handleImportModel = () => {
        openModal('file-upload', { type: 'model' });
      };

      const handleExportModel = () => {
        openModal('file-upload', { type: 'export' });
      };

      const handleAbout = () => {
        openModal('about');
      };

      // Set up event listeners
      window.electronAPI.onMenuNewProject(handleNewProject);
      window.electronAPI.onMenuOpenProject(handleOpenProject);
      window.electronAPI.onMenuSaveProject(handleSaveProject);
      window.electronAPI.onMenuImportModel(handleImportModel);
      window.electronAPI.onMenuExportModel(handleExportModel);
      window.electronAPI.onMenuAbout(handleAbout);

      // Cleanup
      return () => {
        window.electronAPI?.removeAllListeners('menu-new-project');
        window.electronAPI?.removeAllListeners('menu-open-project');
        window.electronAPI?.removeAllListeners('menu-save-project');
        window.electronAPI?.removeAllListeners('menu-import-model');
        window.electronAPI?.removeAllListeners('menu-export-model');
        window.electronAPI?.removeAllListeners('menu-about');
      };
    }
  }, [addNotification, openModal]);
};

// Hook for API initialization
const useApiInitialization = () => {
  const settings = useSettings();
  const { updateSystemStatus, addNotification, initializeTasks, checkAuthStatus, loadSavedAuth } = useStoreActions();
  const [apiInitialized, setApiInitialized] = useState(false);
  const auth = useStore(state => state.auth);

  useEffect(() => {
    const initializeApi = async () => {
      try {
        // Load saved auth token from localStorage
        const { authPersistence } = await import('./services/authPersistence');
        const savedAuth = authPersistence.loadAuth();
        const savedToken = savedAuth?.token;

        // Create API client with token if available
        const apiClient = createApiClient({
          baseURL: settings.apiEndpoint,
          apiKey: savedToken || settings.apiKey,
          timeout: 30000,
          retries: 3
        });

        // Load saved auth into store (after API client is created)
        loadSavedAuth();

        // Test connection with fast health check (5 second timeout, no retries)
        const isConnected = await apiClient.quickHealthCheck();
        
        updateSystemStatus({
          isOnline: isConnected
        });

        if (isConnected) {
          addNotification({
            type: 'success',
            title: 'API Connected',
            message: `Connected to ${settings.apiEndpoint}`,
            duration: 3000
          });

          // Check authentication status
          try {
            await checkAuthStatus();
          } catch (error) {
            console.warn('Failed to check auth status:', error);
          }

          // Get initial system status with normal timeout/retry settings
          try {
            const systemStatus = await apiClient.getSystemStatus();
            updateSystemStatus({
              status: systemStatus,
              isOnline: true
            });
          } catch (error) {
            console.warn('Failed to get system status:', error);
          }

          // Initialize tasks with backend history (only if auth is disabled or user is authenticated)
          // We'll delay this until we know the auth status
          const authStatusCheck = auth.authStatus;
          if (!authStatusCheck || !authStatusCheck.user_auth_enabled || auth.isAuthenticated) {
            try {
              await initializeTasks();
            } catch (error) {
              console.warn('Failed to initialize tasks:', error);
            }
          }
        } else {
          addNotification({
            type: 'warning',
            title: 'API Connection Failed',
            message: `Could not connect to ${settings.apiEndpoint}. Check if the server is running.`,
            duration: 5000
          });
        }

        setApiInitialized(true);
      } catch (error) {
        console.error('Failed to initialize API:', error);
        addNotification({
          type: 'error',
          title: 'API Initialization Failed',
          message: 'Failed to initialize API client',
          duration: 5000
        });
        setApiInitialized(true);
      }
    };

    initializeApi();
  }, [settings.apiEndpoint, settings.apiKey]);

  return apiInitialized;
};

// Main App Component
const App: React.FC = () => {
  const { isLoading, error, auth } = useStore();
  const { ui } = useStore();
  const settings = useSettings();
  const currentModule = useCurrentModule();
  const { closeModal, initializeTasks } = useStoreActions();
  
  // Get current theme based on settings
  const currentTheme = getTheme(settings.theme === 'auto' ? 'dark' : settings.theme);
  
  // Check if we're in game studio mode
  const isGameStudioMode = currentModule === 'game-studio';
  
  // Initialize integrations
  useElectronIntegration();
  const apiInitialized = useApiInitialization();

  // Determine if we need authentication
  const authRequired = auth.authStatus?.user_auth_enabled && !auth.isAuthenticated;
  const showAuthPanel = apiInitialized && authRequired;
  
  // Start task polling once API is initialized and authenticated (if required)
  useTaskPolling({
    enabled: apiInitialized && !authRequired,
    pollingInterval: settings.pollingInterval
  });

  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  // Handle successful authentication
  const handleAuthComplete = async () => {
    // After successful auth, initialize tasks
    try {
      await initializeTasks();
    } catch (error) {
      console.error('Failed to initialize tasks after auth:', error);
    }
  };

  // Show loading screen while initializing
  if (!apiInitialized || auth.isCheckingAuth) {
    return (
      <ThemeProvider theme={currentTheme}>
        <GlobalStyle />
        <AppContainer>
          <LoadingOverlay 
            isVisible={true}
            message={auth.isCheckingAuth ? "Checking authentication..." : "Initializing 3D Studio..."}
          />
        </AppContainer>
      </ThemeProvider>
    );
  }

  // Show auth panel if authentication is required
  if (showAuthPanel) {
    return (
      <ThemeProvider theme={currentTheme}>
        <GlobalStyle />
        <AppContainer>
          <AuthPanel onAuthComplete={handleAuthComplete} />
        </AppContainer>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <GlobalStyle />
      <ErrorBoundary>
        <AppContainer>
          {/* Top Navigation Bar */}
          <TopBar />

          {/* Main Content Area */}
          <MainContent>
            {/* Left Sidebar - Feature Controls */}
            <LeftSidebar 
              isCollapsed={ui.sidebar.leftCollapsed}
              width={ui.sidebar.width}
            />

            {/* Central Content - Game Preview or 3D Viewport */}
            {isGameStudioMode ? <GamePreview /> : <Viewport />}

            {/* Right Sidebar - Task History (hidden in game studio mode) */}
            {!isGameStudioMode && (
              <RightSidebar 
                isCollapsed={ui.sidebar.rightCollapsed}
              />
            )}
          </MainContent>

          {/* Bottom Control Bar (hidden in game studio mode) */}
          {!isGameStudioMode && <BottomBar />}

          {/* Overlays and Modals */}
          <SettingsPanel />
          <NotificationContainer />
          
          {/* UV Viewer Modal */}
          {ui.modal.type === 'uv-viewer' && (
            <UVViewerModal
              isOpen={ui.modal.isOpen}
              model={ui.modal.data?.model || null}
              onClose={closeModal}
            />
          )}
          
          {/* Global Loading Overlay */}
          {isLoading && (
            <LoadingOverlay 
              isVisible={isLoading}
              message="Processing..."
            />
          )}
        </AppContainer>
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App; 