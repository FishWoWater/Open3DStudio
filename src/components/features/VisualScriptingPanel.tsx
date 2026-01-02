import React from 'react';
import styled from 'styled-components';

const PanelContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.default};
  overflow: hidden;
  align-items: center;
  justify-content: center;
`;

const Placeholder = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  text-align: center;
  padding: 48px;
`;

const VisualScriptingPanel: React.FC = () => {
  // Placeholder for node-based visual scripting editor
  return (
    <PanelContainer>
      <Placeholder>
        <i className="fas fa-project-diagram" style={{ fontSize: 48, marginBottom: 16 }}></i>
        <div>Visual Scripting Editor (Coming Soon)</div>
        <div style={{ fontSize: 14, marginTop: 8 }}>
          Drag and connect nodes to define game logic without code.<br/>
          (This will support both 2D and 3D games.)
        </div>
      </Placeholder>
    </PanelContainer>
  );
};

export default VisualScriptingPanel;
