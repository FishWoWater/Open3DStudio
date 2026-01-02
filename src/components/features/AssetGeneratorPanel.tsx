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

const AssetGeneratorPanel: React.FC = () => {
  // Placeholder for AI-powered asset generator UI
  return (
    <PanelContainer>
      <Placeholder>
        <i className="fas fa-robot" style={{ fontSize: 48, marginBottom: 16 }}></i>
        <div>AI Asset Generator (Coming Soon)</div>
        <div style={{ fontSize: 14, marginTop: 8 }}>
          Generate images, sprites, 3D models, audio, and video assets with simple prompts.<br/>
          (This will support both 2D and 3D games.)
        </div>
      </Placeholder>
    </PanelContainer>
  );
};

export default AssetGeneratorPanel;
