import React from 'react';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const PlaceholderContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(
    circle at center,
    ${props => props.theme.colors.background.secondary}20 0%,
    transparent 70%
  );
  color: ${props => props.theme.colors.text.muted};
  text-align: center;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      ${props => props.theme.colors.border.default}20 2px,
      ${props => props.theme.colors.border.default}20 4px
    );
    opacity: 0.1;
  }
`;

const IconContainer = styled.div`
  font-size: 80px;
  color: ${props => props.theme.colors.primary[500]}40;
  margin-bottom: ${props => props.theme.spacing.lg};
  animation: ${float} 3s ease-in-out infinite;
  filter: drop-shadow(0 0 20px ${props => props.theme.colors.primary[500]}20);
`;

const Title = styled.h3`
  font-size: ${props => props.theme.typography.fontSize['2xl']};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  letter-spacing: -0.01em;
`;

const Description = styled.p`
  font-size: ${props => props.theme.typography.fontSize.base};
  color: ${props => props.theme.colors.text.muted};
  max-width: 400px;
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
`;

const ViewportPlaceholder: React.FC = () => {
  return (
    <PlaceholderContainer>
      <IconContainer>
        <i className="fas fa-cube"></i>
      </IconContainer>
      <Title>3D Viewport</Title>
      <Description>
        Your generated 3D models will appear here. Start by selecting a module and creating your first model.
      </Description>
    </PlaceholderContainer>
  );
};

export default ViewportPlaceholder; 