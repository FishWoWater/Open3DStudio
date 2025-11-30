import React from 'react';
import styled from 'styled-components';
import { useTasks, useStoreActions } from '../../store';
import TaskList from '../tasks/TaskList';

const SidebarContainer = styled.aside<{ isCollapsed: boolean }>`
  width: ${props => props.isCollapsed ? '0' : '320px'};
  background: ${props => props.theme.colors.background.secondary};
  border-left: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  transition: ${props => props.theme.transitions.normal};
`;

const SidebarHeader = styled.div`
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  background: linear-gradient(135deg, 
    ${props => props.theme.colors.background.secondary} 0%, 
    ${props => props.theme.colors.background.tertiary} 100%
  );
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    font-size: ${props => props.theme.typography.fontSize.lg};
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
    letter-spacing: -0.01em;
    color: ${props => props.theme.colors.text.primary};
    display: flex;
    align-items: center;
    gap: 10px;

    &::before {
      content: '';
      width: 4px;
      height: 20px;
      background: linear-gradient(135deg, 
        ${props => props.theme.colors.primary[600]} 0%, 
        ${props => props.theme.colors.primary[500]} 100%
      );
      border-radius: 2px;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ClearButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border.default};
  color: ${props => props.theme.colors.text.secondary};
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.error}20;
    border-color: ${props => props.theme.colors.error};
    color: ${props => props.theme.colors.error};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

interface RightSidebarProps {
  isCollapsed: boolean;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ isCollapsed }) => {
  const tasks = useTasks();
  const { clearFailedTasks, clearAllTasks, removeTask, updateTask } = useStoreActions();

  const handleTaskClick = (task: any) => {
    // Handle task click - maybe show details or load result
    console.log('Task clicked:', task);
  };

  const handleTaskDelete = (taskId: string) => {
    removeTask(taskId);
  };

  const handleTaskRetry = (taskId: string) => {
    updateTask(taskId, { status: 'queued' });
  };

  const handleClearFailed = () => {
    clearFailedTasks();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all tasks? This action cannot be undone.')) {
      clearAllTasks();
    }
  };

  if (isCollapsed) {
    return <SidebarContainer isCollapsed={true} />;
  }

  return (
    <SidebarContainer isCollapsed={false}>
      <SidebarHeader>
        <h3>Task History</h3>
        <ButtonGroup>
          <ClearButton 
            onClick={handleClearFailed}
            disabled={tasks.failedTasks.length === 0}
            title="Clear failed tasks"
          >
            <i className="fas fa-exclamation-triangle"></i>
          </ClearButton>
          <ClearButton 
            onClick={handleClearAll}
            disabled={tasks.tasks.length === 0}
            title="Clear all tasks"
          >
            <i className="fas fa-trash-alt"></i>
          </ClearButton>
        </ButtonGroup>
      </SidebarHeader>
      
      <SidebarContent>
        <TaskList
          tasks={tasks.tasks}
          onTaskClick={handleTaskClick}
          onTaskDelete={handleTaskDelete}
          onTaskRetry={handleTaskRetry}
          onClearCompleted={handleClearFailed}
        />
      </SidebarContent>
    </SidebarContainer>
  );
};

export default RightSidebar; 