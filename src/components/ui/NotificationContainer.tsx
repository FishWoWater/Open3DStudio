import React from 'react';
import styled, { keyframes } from 'styled-components';
import { useUI, useStoreActions } from '../../store';
import { NotificationType } from '../../types/state';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const Container = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  max-width: 400px;
  pointer-events: none;
`;

const NotificationCard = styled.div<{ type: NotificationType; isExiting?: boolean }>`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => {
    switch (props.type) {
      case 'error': return props.theme.colors.error;
      case 'warning': return props.theme.colors.warning;
      case 'success': return props.theme.colors.success;
      case 'info':
      default: return props.theme.colors.info;
    }
  }};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  animation: ${props => props.isExiting ? slideOut : slideIn} 0.3s ease-out;
  pointer-events: auto;
  position: relative;
  max-width: 100%;
  word-wrap: break-word;
`;

const NotificationHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const NotificationIcon = styled.div<{ type: NotificationType }>`
  color: ${props => {
    switch (props.type) {
      case 'error': return props.theme.colors.error;
      case 'warning': return props.theme.colors.warning;
      case 'success': return props.theme.colors.success;
      case 'info':
      default: return props.theme.colors.info;
    }
  }};
  font-size: ${props => props.theme.typography.fontSize.lg};
  flex-shrink: 0;
  margin-top: 2px;
`;

const NotificationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.xs};
  line-height: 1.4;
`;

const NotificationMessage = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  line-height: 1.5;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  flex-shrink: 0;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.gray[700]};
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-top: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  background: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.primary[600]};
  }
`;

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case 'error': return 'fas fa-exclamation-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    case 'success': return 'fas fa-check-circle';
    case 'info':
    default: return 'fas fa-info-circle';
  }
};

const NotificationContainer: React.FC = () => {
  const ui = useUI();
  const { removeNotification } = useStoreActions();
  const [exitingNotifications, setExitingNotifications] = React.useState<Set<string>>(new Set());

  const handleClose = (notificationId: string) => {
    setExitingNotifications(prev => new Set([...Array.from(prev), notificationId]));
    
    // Remove after animation completes
    setTimeout(() => {
      removeNotification(notificationId);
      setExitingNotifications(prev => {
        const next = new Set(Array.from(prev));
        next.delete(notificationId);
        return next;
      });
    }, 300);
  };

  const handleActionClick = (notificationId: string, action: () => void) => {
    action();
    handleClose(notificationId);
  };

  if (ui.notifications.length === 0) {
    return null;
  }

  return (
    <Container>
      {ui.notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          type={notification.type}
          isExiting={exitingNotifications.has(notification.id)}
        >
          <NotificationHeader>
            <NotificationIcon type={notification.type}>
              <i className={getNotificationIcon(notification.type)} />
            </NotificationIcon>
            
            <NotificationContent>
              <NotificationTitle>{notification.title}</NotificationTitle>
              <NotificationMessage>{notification.message}</NotificationMessage>
            </NotificationContent>
            
            <CloseButton 
              onClick={() => handleClose(notification.id)}
              title="Close notification"
            >
              ✕
            </CloseButton>
          </NotificationHeader>
          
          {notification.actions && notification.actions.length > 0 && (
            <ActionsContainer>
              {notification.actions.map((action, index) => (
                <ActionButton
                  key={index}
                  onClick={() => handleActionClick(notification.id, action.action)}
                >
                  {action.label}
                </ActionButton>
              ))}
            </ActionsContainer>
          )}
        </NotificationCard>
      ))}
    </Container>
  );
};

export default NotificationContainer; 