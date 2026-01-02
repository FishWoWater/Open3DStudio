import React, { useState } from 'react';
import styled from 'styled-components';

const WizardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: ${props => props.theme.colors.background.primary};
`;

const StepTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: 16px;
`;

const OptionGrid = styled.div`
  display: flex;
  gap: 32px;
  margin-bottom: 32px;
`;

const OptionCard = styled.button<{ selected: boolean }>`
  background: ${props => props.selected ? props.theme.colors.primary[100] : props.theme.colors.background.secondary};
  border: 2px solid ${props => props.selected ? props.theme.colors.primary[500] : props.theme.colors.border.default};
  border-radius: 16px;
  padding: 32px 40px;
  min-width: 200px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text.primary};
  box-shadow: ${props => props.selected ? props.theme.shadows.md : 'none'};
  transition: all 0.2s;
  &:hover {
    border-color: ${props => props.theme.colors.primary[400]};
    background: ${props => props.theme.colors.primary[50]};
  }
`;

const NextButton = styled.button`
  background: ${props => props.theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  transition: background 0.2s;
  &:hover {
    background: ${props => props.theme.colors.primary[600]};
  }
`;

const steps = [
  {
    title: 'Choose Game Type',
    options: [
      { id: '2d', label: '2D Game', icon: 'fas fa-th-large' },
      { id: '3d', label: '3D Game', icon: 'fas fa-cube' },
    ],
  },
  {
    title: 'Select Template',
    options: [
      { id: 'platformer', label: 'Platformer', icon: 'fas fa-shoe-prints' },
      { id: 'shooter', label: 'Shooter', icon: 'fas fa-bullseye' },
      { id: 'puzzle', label: 'Puzzle', icon: 'fas fa-puzzle-piece' },
      { id: 'rpg', label: 'RPG', icon: 'fas fa-dragon' },
    ],
  },
  {
    title: 'Name Your Game',
    options: [], // Will use input
  },
];

const ProjectWizard: React.FC<{ onComplete: (data: any) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<{ [key: string]: string }>({});
  const [gameName, setGameName] = useState('');

  const handleOptionSelect = (optionId: string) => {
    setSelections({ ...selections, [step]: optionId });
  };

  const handleNext = () => {
    if (step === 2) {
      onComplete({
        type: selections[0],
        template: selections[1],
        name: gameName,
      });
    } else {
      setStep(step + 1);
    }
  };

  return (
    <WizardContainer>
      <StepTitle>{steps[step].title}</StepTitle>
      {step < 2 ? (
        <OptionGrid>
          {steps[step].options.map(option => (
            <OptionCard
              key={option.id}
              selected={selections[step] === option.id}
              onClick={() => handleOptionSelect(option.id)}
            >
              <i className={option.icon} style={{ fontSize: 32, marginBottom: 12 }}></i>
              {option.label}
            </OptionCard>
          ))}
        </OptionGrid>
      ) : (
        <input
          type="text"
          placeholder="Enter game name..."
          value={gameName}
          onChange={e => setGameName(e.target.value)}
          style={{ fontSize: '1.2rem', padding: '12px 24px', borderRadius: 8, border: '1px solid #ccc', minWidth: 300 }}
        />
      )}
      <NextButton
        onClick={handleNext}
        disabled={step < 2 ? !selections[step] : !gameName.trim()}
      >
        {step === 2 ? 'Create Project' : 'Next'}
      </NextButton>
    </WizardContainer>
  );
};

export default ProjectWizard;
