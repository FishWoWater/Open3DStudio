import React from 'react';
import styled from 'styled-components';
import { useCurrentModule, useStoreActions } from '../../store';
import { ModuleType } from '../../types/state';

const TopBarContainer = styled.header`
  background: rgba(20, 20, 20, 0.95);
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  padding: 0 ${props => props.theme.spacing.lg};
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(24px);
  flex-shrink: 0;
  position: relative;
  z-index: 100;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-weight: ${props => props.theme.typography.fontWeight.bold};
  font-size: ${props => props.theme.typography.fontSize.lg};
  letter-spacing: -0.02em;

  i {
    color: ${props => props.theme.colors.primary[500]};
    font-size: 24px;
    filter: drop-shadow(0 0 8px ${props => props.theme.colors.primary[500]}40);
  }
`;

const MainNav = styled.nav`
  display: flex;
  gap: 2px;
  background: ${props => props.theme.colors.background.tertiary};
  padding: 4px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.default};
`;

const NavItem = styled.button<{ active: boolean }>`
  background: ${props => props.active 
    ? `linear-gradient(135deg, ${props.theme.colors.primary[600]} 0%, ${props.theme.colors.primary[500]} 100%)`
    : 'transparent'
  };
  border: none;
  color: ${props => props.active 
    ? 'white' 
    : props.theme.colors.text.secondary
  };
  padding: 10px 20px;
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  cursor: pointer;
  transition: ${props => props.theme.transitions.normal};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  position: relative;
  white-space: nowrap;
  letter-spacing: -0.01em;

  &:hover {
    background: ${props => props.active 
      ? `linear-gradient(135deg, ${props.theme.colors.primary[600]} 0%, ${props.theme.colors.primary[500]} 100%)`
      : 'rgba(255, 255, 255, 0.06)'
    };
    color: ${props => props.active 
      ? 'white' 
      : props.theme.colors.text.primary
    };
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }

  ${props => props.active && `
    box-shadow: ${props.theme.shadows.md};
    transform: translateY(-1px);
  `}
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border.default};
  color: ${props => props.theme.colors.text.secondary};
  width: 36px;
  height: 36px;
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: ${props => props.theme.colors.border.hover};
    color: ${props => props.theme.colors.text.primary};
  }
`;

interface TopBarProps {
  onSettingsClick?: () => void;
}

const modules: { id: ModuleType; name: string; icon: string }[] = [
  { id: 'mesh-generation', name: 'Mesh Generation', icon: 'fas fa-shapes' },
  { id: 'mesh-painting', name: 'Mesh Painting', icon: 'fas fa-paint-brush' },
  { id: 'mesh-segmentation', name: 'Mesh Segmentation', icon: 'fas fa-cut' },
  { id: 'part-completion', name: 'Part Completion', icon: 'fas fa-puzzle-piece' },
  { id: 'auto-rigging', name: 'Auto Rigging', icon: 'fas fa-sitemap' }
];

const TopBar: React.FC<TopBarProps> = ({ onSettingsClick }) => {
  const currentModule = useCurrentModule();
  const { setCurrentModule, openModal } = useStoreActions();

  const handleModuleChange = (moduleId: ModuleType) => {
    setCurrentModule(moduleId);
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      openModal('settings');
    }
  };

  return (
    <TopBarContainer>
      <Logo>
        <i className="fas fa-cube"></i>
        <span>Minimal 3D Studio</span>
      </Logo>
      
      <MainNav>
        {modules.map(module => (
          <NavItem
            key={module.id}
            active={currentModule === module.id}
            onClick={() => handleModuleChange(module.id)}
          >
            <i className={module.icon}></i>
            <span>{module.name}</span>
          </NavItem>
        ))}
      </MainNav>

      <HeaderActions>
        {/* <ActionButton title="Save Project">
          <i className="fas fa-save"></i>
        </ActionButton>
        <ActionButton title="Export Model">
          <i className="fas fa-download"></i>
        </ActionButton> */}
        <ActionButton title="Settings" onClick={handleSettingsClick}>
          <i className="fas fa-cog"></i>
        </ActionButton>
      </HeaderActions>
    </TopBarContainer>
  );
};

export default TopBar; 