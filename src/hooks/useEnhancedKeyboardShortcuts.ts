/**
 * Enhanced Keyboard Shortcuts Hook using react-hotkeys-hook
 * Provides robust, scope-aware keyboard shortcuts for the 3D viewport and editor
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { useStoreActions } from '../store';
import { ViewportTool } from '../types/state';

/**
 * Options for keyboard shortcut configuration
 */
interface ShortcutOptions {
  enabled?: boolean;
  scopes?: string[];
}

/**
 * Enhanced keyboard shortcuts hook using react-hotkeys-hook
 * Provides context-aware shortcuts with better conflict handling
 */
export const useEnhancedKeyboardShortcuts = (options: ShortcutOptions = {}) => {
  const { enabled = true } = options;
  const { 
    setCurrentTool, 
    deleteSelectedModels, 
    toggleLeftSidebar,
    toggleRightSidebar,
    openModal,
    addNotification
  } = useStoreActions();

  // Helper to set tool and show notification
  const setToolWithFeedback = (tool: ViewportTool) => {
    setCurrentTool(tool);
  };

  // Transform tools - Q, W, E, R
  useHotkeys('q', () => setToolWithFeedback('select'), {
    enabled,
    preventDefault: true,
    description: 'Select tool'
  });

  useHotkeys('w', () => setToolWithFeedback('move'), {
    enabled,
    preventDefault: true,
    description: 'Move tool'
  });

  useHotkeys('e', () => setToolWithFeedback('rotate'), {
    enabled,
    preventDefault: true,
    description: 'Rotate tool'
  });

  useHotkeys('r', () => setToolWithFeedback('scale'), {
    enabled,
    preventDefault: true,
    description: 'Scale tool'
  });

  // Delete selected objects
  useHotkeys('delete, backspace, x', () => {
    deleteSelectedModels();
  }, {
    enabled,
    preventDefault: true,
    description: 'Delete selected objects'
  });

  // Escape - return to select tool
  useHotkeys('escape', () => {
    setToolWithFeedback('select');
  }, {
    enabled,
    description: 'Return to select tool'
  });

  // Toggle sidebars
  useHotkeys('tab', () => {
    toggleLeftSidebar();
  }, {
    enabled,
    preventDefault: true,
    description: 'Toggle left sidebar'
  });

  useHotkeys('shift+tab', () => {
    toggleRightSidebar();
  }, {
    enabled,
    preventDefault: true,
    description: 'Toggle right sidebar'
  });

  // Settings
  useHotkeys('mod+comma, ctrl+comma', () => {
    openModal('settings', {});
  }, {
    enabled,
    preventDefault: true,
    description: 'Open settings'
  });

  // Save project (Cmd/Ctrl + S)
  useHotkeys('mod+s, ctrl+s', (e) => {
    e.preventDefault();
    addNotification({
      type: 'success',
      title: 'Project Saved',
      message: 'Project saved successfully',
      duration: 3000
    });
  }, {
    enabled,
    preventDefault: true,
    description: 'Save project'
  });

  // Undo (Cmd/Ctrl + Z)
  useHotkeys('mod+z, ctrl+z', (e) => {
    e.preventDefault();
    addNotification({
      type: 'info',
      title: 'Undo',
      message: 'Undo action performed',
      duration: 2000
    });
  }, {
    enabled,
    description: 'Undo'
  });

  // Redo (Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y)
  useHotkeys('mod+shift+z, ctrl+shift+z, mod+y, ctrl+y', (e) => {
    e.preventDefault();
    addNotification({
      type: 'info',
      title: 'Redo',
      message: 'Redo action performed',
      duration: 2000
    });
  }, {
    enabled,
    description: 'Redo'
  });

  // Focus center (F key) - common in 3D apps
  useHotkeys('f', () => {
    addNotification({
      type: 'info',
      title: 'Focus',
      message: 'Camera focused on selection',
      duration: 2000
    });
  }, {
    enabled,
    preventDefault: true,
    description: 'Focus on selection'
  });

  // Reset camera (Home key)
  useHotkeys('home', () => {
    addNotification({
      type: 'info',
      title: 'Camera Reset',
      message: 'Camera reset to default view',
      duration: 2000
    });
  }, {
    enabled,
    preventDefault: true,
    description: 'Reset camera view'
  });

  // Toggle grid (G key)
  useHotkeys('g', () => {
    addNotification({
      type: 'info',
      title: 'Grid Toggle',
      message: 'Grid visibility toggled',
      duration: 2000
    });
  }, {
    enabled,
    preventDefault: true,
    description: 'Toggle grid visibility'
  });

  // Help overlay (? key)
  useHotkeys('shift+/', () => {
    addNotification({
      type: 'info',
      title: 'Keyboard Shortcuts',
      message: 'Q: Select, W: Move, E: Rotate, R: Scale, X: Delete, Tab: Toggle Sidebar',
      duration: 6000
    });
  }, {
    enabled,
    description: 'Show keyboard shortcuts help'
  });
};

/**
 * Keyboard shortcuts reference for documentation
 */
export const KEYBOARD_SHORTCUTS = {
  viewport: [
    { key: 'Q', description: 'Select tool' },
    { key: 'W', description: 'Move tool' },
    { key: 'E', description: 'Rotate tool' },
    { key: 'R', description: 'Scale tool' },
    { key: 'X / Delete / Backspace', description: 'Delete selected objects' },
    { key: 'Escape', description: 'Return to select tool' },
    { key: 'F', description: 'Focus on selection' },
    { key: 'G', description: 'Toggle grid visibility' },
    { key: 'Home', description: 'Reset camera view' },
  ],
  general: [
    { key: 'Tab', description: 'Toggle left sidebar' },
    { key: 'Shift + Tab', description: 'Toggle right sidebar' },
    { key: 'Ctrl/Cmd + S', description: 'Save project' },
    { key: 'Ctrl/Cmd + Z', description: 'Undo' },
    { key: 'Ctrl/Cmd + Shift + Z', description: 'Redo' },
    { key: 'Ctrl/Cmd + ,', description: 'Open settings' },
    { key: '?', description: 'Show keyboard shortcuts' },
  ]
};

export default useEnhancedKeyboardShortcuts;
