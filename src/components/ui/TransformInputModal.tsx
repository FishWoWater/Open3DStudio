import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.xl};
  width: 520px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.background.tertiary};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ModalBody = styled.div`
  padding: ${props => props.theme.spacing.lg};
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
`;

const TransformSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border.default};

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  i {
    font-size: ${props => props.theme.typography.fontSize.xs};
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.sm};
`;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

const InputLabel = styled.label`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.xs};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.3px;
`;

const Input = styled.input`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.primary};
  transition: ${props => props.theme.transitions.fast};
  font-family: 'Monaco', 'Courier New', monospace;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[500]}20;
    background: ${props => props.theme.colors.background.secondary};
  }

  &:hover:not(:focus) {
    border-color: ${props => props.theme.colors.border.hover};
  }
`;

const ModalFooter = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-left: auto;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};
  border: none;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: ${props.theme.colors.primary[600]};
          color: white;
          &:hover {
            background: ${props.theme.colors.primary[500]};
            transform: translateY(-1px);
            box-shadow: ${props.theme.shadows.md};
          }
          &:active {
            transform: translateY(0);
          }
        `;
      case 'danger':
        return `
          background: ${props.theme.colors.error};
          color: white;
          &:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: ${props.theme.shadows.md};
          }
          &:active {
            transform: translateY(0);
          }
        `;
      default:
        return `
          background: transparent;
          color: ${props.theme.colors.text.secondary};
          border: 1px solid ${props.theme.colors.border.default};
          &:hover {
            background: ${props.theme.colors.background.tertiary};
            color: ${props.theme.colors.text.primary};
            border-color: ${props.theme.colors.border.hover};
          }
        `;
    }
  }}
`;

const HelpText = styled.div`
  font-size: ${props => props.theme.typography.fontSize.xs};
  color: ${props => props.theme.colors.text.muted};
  margin-top: ${props => props.theme.spacing.xs};
`;

interface TransformInputModalProps {
  currentTransform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
  onApply: (transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
  onClose: () => void;
}

const TransformInputModal: React.FC<TransformInputModalProps> = ({
  currentTransform,
  onApply,
  onClose
}) => {
  const [position, setPosition] = useState<[number, number, number]>(currentTransform.position);
  const [rotation, setRotation] = useState<[number, number, number]>(currentTransform.rotation);
  const [scale, setScale] = useState<[number, number, number]>(currentTransform.scale);

  useEffect(() => {
    setPosition(currentTransform.position);
    setRotation(currentTransform.rotation);
    setScale(currentTransform.scale);
  }, [currentTransform]);

  // Format number to 2 decimal places
  const formatFloat = (value: number): string => {
    return value.toFixed(2);
  };

  const handleApply = () => {
    onApply({ position, rotation, scale });
    onClose();
  };

  const handleReset = () => {
    setPosition([0, 0, 0]);
    setRotation([0, 0, 0]);
    setScale([1, 1, 1]);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <i className="fas fa-sliders-h"></i>
            Transform Properties
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <i className="fas fa-times"></i>
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <TransformSection>
            <SectionLabel>
              <i className="fas fa-arrows-alt"></i>
              Position
            </SectionLabel>
            <InputGroup>
              <InputWrapper>
                <InputLabel>X</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formatFloat(position[0])}
                  onChange={(e) => setPosition([parseFloat(e.target.value) || 0, position[1], position[2]])}
                />
              </InputWrapper>
              <InputWrapper>
                <InputLabel>Y</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formatFloat(position[1])}
                  onChange={(e) => setPosition([position[0], parseFloat(e.target.value) || 0, position[2]])}
                />
              </InputWrapper>
              <InputWrapper>
                <InputLabel>Z</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formatFloat(position[2])}
                  onChange={(e) => setPosition([position[0], position[1], parseFloat(e.target.value) || 0])}
                />
              </InputWrapper>
            </InputGroup>
            <HelpText>World space position in units</HelpText>
          </TransformSection>

          <TransformSection>
            <SectionLabel>
              <i className="fas fa-sync-alt"></i>
              Rotation
            </SectionLabel>
            <InputGroup>
              <InputWrapper>
                <InputLabel>X</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formatFloat(rotation[0] * 180 / Math.PI)}
                  onChange={(e) => {
                    const degrees = parseFloat(e.target.value) || 0;
                    setRotation([degrees * Math.PI / 180, rotation[1], rotation[2]]);
                  }}
                />
              </InputWrapper>
              <InputWrapper>
                <InputLabel>Y</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formatFloat(rotation[1] * 180 / Math.PI)}
                  onChange={(e) => {
                    const degrees = parseFloat(e.target.value) || 0;
                    setRotation([rotation[0], degrees * Math.PI / 180, rotation[2]]);
                  }}
                />
              </InputWrapper>
              <InputWrapper>
                <InputLabel>Z</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  value={formatFloat(rotation[2] * 180 / Math.PI)}
                  onChange={(e) => {
                    const degrees = parseFloat(e.target.value) || 0;
                    setRotation([rotation[0], rotation[1], degrees * Math.PI / 180]);
                  }}
                />
              </InputWrapper>
            </InputGroup>
            <HelpText>Rotation in degrees</HelpText>
          </TransformSection>

          <TransformSection>
            <SectionLabel>
              <i className="fas fa-expand-arrows-alt"></i>
              Scale
            </SectionLabel>
            <InputGroup>
              <InputWrapper>
                <InputLabel>X</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={formatFloat(scale[0])}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0.001;
                    setScale([Math.max(0.001, val), scale[1], scale[2]]);
                  }}
                />
              </InputWrapper>
              <InputWrapper>
                <InputLabel>Y</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={formatFloat(scale[1])}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0.001;
                    setScale([scale[0], Math.max(0.001, val), scale[2]]);
                  }}
                />
              </InputWrapper>
              <InputWrapper>
                <InputLabel>Z</InputLabel>
                <Input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={formatFloat(scale[2])}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0.001;
                    setScale([scale[0], scale[1], Math.max(0.001, val)]);
                  }}
                />
              </InputWrapper>
            </InputGroup>
            <HelpText>Scale multiplier (must be greater than 0)</HelpText>
          </TransformSection>
        </ModalBody>

        <ModalFooter>
          <Button variant="danger" onClick={handleReset}>
            <i className="fas fa-undo"></i> Reset
          </Button>
          <ButtonGroup>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleApply}>
              <i className="fas fa-check"></i> Apply
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default TransformInputModal;

