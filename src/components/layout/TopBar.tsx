import React from 'react';
import styled from 'styled-components';
import { useCurrentModule, useStoreActions, useStore } from '../../store';
import { ModuleType } from '../../types/state';

// Detect if running in Electron and platform
const isElectron = window.electronAPI !== undefined;
const isMacOS = navigator.platform.toLowerCase().includes('mac');
const isElectronMacOS = isElectron && isMacOS;

const TopBarContainer = styled.header<{ isElectronMacOS: boolean }>`
  background: ${props => props.theme.colors.background.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  padding: 0 ${props => props.theme.spacing.lg};
  padding-top: ${props => props.isElectronMacOS ? '28px' : '0'};
  height: ${props => props.isElectronMacOS ? '92px' : '64px'};
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
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: 6px 12px;
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const UserName = styled.span`
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const UserBadge = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.theme.colors.success};
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
  { id: 'mesh-generation', name: 'MeshGen', icon: 'fas fa-shapes' },
  { id: 'mesh-retopology', name: 'LowPoly Retopo', icon: 'fas fa-project-diagram' },
  { id: 'mesh-uv-unwrapping', name: 'UV Unwrap', icon: 'fas fa-map' },
  { id: 'mesh-painting', name: 'TextureGen', icon: 'fas fa-paint-brush' },
  { id: 'mesh-segmentation', name: 'Mesh Segmentation', icon: 'fas fa-cut' },
  // { id: 'part-completion', name: 'Part Completion', icon: 'fas fa-puzzle-piece' },
  { id: 'auto-rigging', name: 'Auto Rig', icon: 'fas fa-sitemap' },
];

const TopBar: React.FC<TopBarProps> = ({ onSettingsClick }) => {
  const currentModule = useCurrentModule();
  const { auth } = useStore();
  const { setCurrentModule, openModal, logout } = useStoreActions();

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

  const handleLogout = () => {
    logout();
  };

  return (
    <TopBarContainer isElectronMacOS={isElectronMacOS}>
      <Logo>
        <i className="fas fa-cube"></i>
        <span>Open3DStudio</span>
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
        <NavItem
          active={false}
          onClick={() => openModal('mesh-editing', { task: null })}
        >
          <i className="fas fa-edit"></i>
          <span>Mesh Edit</span>
        </NavItem>
      </MainNav>

      <HeaderActions>
        {auth.authStatus?.user_auth_enabled && auth.isAuthenticated && auth.user && (
          <UserInfo>
            <UserBadge />
            <UserName>{auth.user.username}</UserName>
          </UserInfo>
        )}
        
        <ActionButton 
          title="View on GitHub" 
          onClick={() => window.open('https://github.com/FishWoWater/Open3DStudio', '_blank')}
        >
          <i className="fab fa-github"></i>
        </ActionButton>
        
        {auth.authStatus?.user_auth_enabled && auth.isAuthenticated && (
          <ActionButton title="Logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i>
          </ActionButton>
        )}
        
        <ActionButton title="Settings" onClick={handleSettingsClick}>
          <i className="fas fa-cog"></i>
        </ActionButton>
      </HeaderActions>
    </TopBarContainer>
  );
};

export default TopBar; 