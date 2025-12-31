import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useViewport, useStoreActions } from '../../store';
import { ModelExporter } from '../../utils/modelExporter';

const ExportDropdown = styled.div`
  position: relative;
  display: inline-block;
`;

const ExportButton = styled.button`
  background: ${props => props.theme.colors.success};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-left: ${props => props.theme.spacing.sm};
  
  &:hover {
    background: ${props => props.theme.colors.success}dd;
  }
  
  &:disabled {
    background: ${props => props.theme.colors.gray[400]};
    cursor: not-allowed;
  }
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: 1000;
  min-width: 220px;
  display: ${props => props.isOpen ? 'block' : 'none'};
  margin-top: 4px;
`;

const MenuSection = styled.div`
  padding: ${props => props.theme.spacing.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  
  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
  text-transform: uppercase;
  margin-bottom: ${props => props.theme.spacing.xs};
  letter-spacing: 0.5px;
`;

const MenuItem = styled.button`
  width: 100%;
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  
  &:hover {
    background: ${props => props.theme.colors.background.tertiary};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background: none;
    }
  }
  
  i {
    width: 16px;
    text-align: center;
    color: ${props => props.theme.colors.text.secondary};
  }
`;

const MenuItemDescription = styled.span`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
  margin-left: auto;
`;

interface ExportPanelProps {
  onExporting?: (isExporting: boolean) => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ onExporting }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const viewport = useViewport();
  const { addNotification } = useStoreActions();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModels = viewport.loadedModels.filter(m => m.selected);
  const hasModels = viewport.loadedModels.length > 0;
  const hasSelection = selectedModels.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (
    type: 'selected' | 'all' | 'scene',
    format: 'glb' | 'gltf'
  ) => {
    setIsExporting(true);
    onExporting?.(true);
    setIsOpen(false);

    try {
      if (type === 'selected') {
        // Export selected models individually
        for (const model of selectedModels) {
          await ModelExporter.exportAndDownloadModel(model, undefined, { format });
        }
        addNotification({
          type: 'success',
          title: 'Export Complete',
          message: `Exported ${selectedModels.length} model(s) as ${format.toUpperCase()}`,
          duration: 3000,
        });
      } else if (type === 'all' || type === 'scene') {
        // Export all models as a single scene
        const models = viewport.loadedModels;
        await ModelExporter.exportAndDownloadScene(models, `scene.${format}`, { format });
        addNotification({
          type: 'success',
          title: 'Scene Exported',
          message: `Exported scene with ${models.length} model(s) as ${format.toUpperCase()}`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export',
        duration: 5000,
      });
    } finally {
      setIsExporting(false);
      onExporting?.(false);
    }
  };

  return (
    <ExportDropdown ref={dropdownRef}>
      <ExportButton
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasModels || isExporting}
        title={hasModels ? 'Export models for game engines' : 'Add models to export'}
      >
        <i className={isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'}></i>
        {isExporting ? 'Exporting...' : 'Export'}
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '10px' }}></i>
      </ExportButton>

      <DropdownMenu isOpen={isOpen} onClick={(e) => e.stopPropagation()}>
        {hasSelection && (
          <MenuSection>
            <SectionTitle>Selected ({selectedModels.length})</SectionTitle>
            <MenuItem onClick={() => handleExport('selected', 'glb')}>
              <i className="fas fa-cube"></i>
              Export as GLB
              <MenuItemDescription>Game-ready</MenuItemDescription>
            </MenuItem>
            <MenuItem onClick={() => handleExport('selected', 'gltf')}>
              <i className="fas fa-file-code"></i>
              Export as GLTF
              <MenuItemDescription>Editable</MenuItemDescription>
            </MenuItem>
          </MenuSection>
        )}

        <MenuSection>
          <SectionTitle>Scene ({viewport.loadedModels.length} models)</SectionTitle>
          <MenuItem 
            onClick={() => handleExport('scene', 'glb')}
            disabled={!hasModels}
          >
            <i className="fas fa-layer-group"></i>
            Export Scene as GLB
            <MenuItemDescription>Unity/Unreal</MenuItemDescription>
          </MenuItem>
          <MenuItem 
            onClick={() => handleExport('scene', 'gltf')}
            disabled={!hasModels}
          >
            <i className="fas fa-folder-open"></i>
            Export Scene as GLTF
            <MenuItemDescription>Blender</MenuItemDescription>
          </MenuItem>
        </MenuSection>

        <MenuSection>
          <SectionTitle>Tips</SectionTitle>
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--text-muted)', 
            padding: '0 8px',
            lineHeight: '1.4'
          }}>
            <p style={{ margin: '0 0 4px 0' }}>
              <strong>GLB</strong>: Binary format, best for games
            </p>
            <p style={{ margin: 0 }}>
              <strong>GLTF</strong>: JSON format, editable in Blender
            </p>
          </div>
        </MenuSection>
      </DropdownMenu>
    </ExportDropdown>
  );
};

export default ExportPanel;
