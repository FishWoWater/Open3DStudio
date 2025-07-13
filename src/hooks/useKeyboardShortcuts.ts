import { useEffect } from 'react';
import { useStoreActions } from '../store';
import { ViewportTool } from '../types/state';

/**
 * Custom hook for handling global keyboard shortcuts in the 3D viewport
 * 
 * Keyboard shortcuts:
 * - Q: Select tool
 * - W: Move tool
 * - E: Rotate tool  
 * - R: Scale tool
 * - ESC: Back to select tool
 */
export const useKeyboardShortcuts = () => {
  const { setCurrentTool } = useStoreActions();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true' ||
        target.isContentEditable
      ) {
        return;
      }

      // Prevent default behavior for our shortcuts
      const key = event.key.toLowerCase();
      let toolToSet: ViewportTool | null = null;

      switch (key) {
        case 'q':
          toolToSet = 'select';
          break;
        case 'w':
          toolToSet = 'move';
          break;
        case 'e':
          toolToSet = 'rotate';
          break;
        case 'r':
          toolToSet = 'scale';
          break;
        case 'escape':
          toolToSet = 'select';
          break;
      }

      if (toolToSet) {
        event.preventDefault();
        event.stopPropagation();
        setCurrentTool(toolToSet);
        
        // Optional: Show a brief tooltip or notification
        console.log(`Switched to ${toolToSet} tool`);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown, true);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [setCurrentTool]);
};

export default useKeyboardShortcuts;
