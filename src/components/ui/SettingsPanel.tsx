import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSettings, useStoreActions, useUI } from '../../store';
import { AppSettings } from '../../types/state';

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.default};
  width: 90vw;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.theme.shadows.xl};
`;

const ModalHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${props => props.theme.borderRadius.sm};
  
  &:hover {
    background: ${props => props.theme.colors.background.tertiary};
    color: ${props => props.theme.colors.text.primary};
  }
`;

const ModalBody = styled.div`
  padding: ${props => props.theme.spacing.lg};
  overflow-y: auto;
  flex: 1;
`;

const FormSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.base};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  i {
    color: ${props => props.theme.colors.primary[500]};
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const Input = styled.input`
  width: 100%;
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  transition: ${props => props.theme.transitions.fast};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    background: ${props => props.theme.colors.background.secondary};
    box-shadow: 0 0 0 4px ${props => props.theme.colors.primary[500]}20;
  }
`;

const Select = styled.select`
  width: 100%;
  background: ${props => props.theme.colors.background.tertiary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  transition: ${props => props.theme.transitions.fast};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    background: ${props => props.theme.colors.background.secondary};
    box-shadow: 0 0 0 4px ${props => props.theme.colors.primary[500]}20;
  }
`;



const ModalFooter = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border.default};
  display: flex;
  gap: ${props => props.theme.spacing.lg};
  justify-content: flex-end;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  background: ${props => props.variant === 'primary' 
    ? props.theme.colors.primary[600]
    : 'transparent'
  };
  border: 1px solid ${props => props.variant === 'primary' 
    ? props.theme.colors.primary[600]
    : props.theme.colors.border.default
  };
  color: ${props => props.variant === 'primary' 
    ? 'white'
    : props.theme.colors.text.primary
  };
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
  transition: ${props => props.theme.transitions.fast};
  
  &:hover {
    background: ${props => props.variant === 'primary' 
      ? props.theme.colors.primary[500]
      : props.theme.colors.background.tertiary
    };
  }
`;

const SettingsPanel: React.FC = () => {
  const ui = useUI();
  const settings = useSettings();
  const { closeModal, updateSettings, addNotification } = useStoreActions();
  
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [testingConnection, setTestingConnection] = useState(false);

  const isOpen = ui.modal.isOpen && ui.modal.type === 'settings';

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  const handleInputChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      // Test the API connection with new settings
      const response = await fetch(`${formData.apiEndpoint}/health`);
      if (response.ok) {
        addNotification({
          type: 'success',
          title: 'Connection Test Successful',
          message: `Successfully connected to ${formData.apiEndpoint}`,
          duration: 3000
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Connection Test Failed',
        message: `Could not connect to ${formData.apiEndpoint}`,
        duration: 5000
      });
    }
    setTestingConnection(false);
  };

  const handleSave = () => {
    updateSettings(formData);
    addNotification({
      type: 'success',
      title: 'Settings Saved',
      message: 'Your settings have been updated successfully',
      duration: 3000
    });
    closeModal();
  };

  const handleReset = () => {
    const defaultSettings: AppSettings = {
      apiEndpoint: 'http://localhost:7842',
      apiKey: undefined,
      theme: 'dark',
      autoSave: true,
      defaultOutputFormat: 'glb',
      maxConcurrentTasks: 3,
      pollingInterval: 5000,
      language: 'en'
    };
    setFormData(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onClick={closeModal}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Settings</ModalTitle>
          <CloseButton onClick={closeModal}>&times;</CloseButton>
        </ModalHeader>

        <ModalBody>
          <FormSection>
            <SectionTitle>
              <i className="fas fa-server"></i>
              API Configuration
            </SectionTitle>
            
            <FormGroup>
              <Label>API Endpoint</Label>
              <Input
                type="text"
                value={formData.apiEndpoint}
                onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                placeholder="http://localhost:7842"
              />
            </FormGroup>
            
            <FormGroup>
              <Label>API Key (Optional)</Label>
              <Input
                type="password"
                value={formData.apiKey || ''}
                onChange={(e) => handleInputChange('apiKey', e.target.value || undefined)}
                placeholder="Enter your API key"
              />
            </FormGroup>
            
            <FormGroup>
              <Button 
                variant="secondary" 
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </FormGroup>
          </FormSection>

          <FormSection>
            <SectionTitle>
              <i className="fas fa-cog"></i>
              General Settings
            </SectionTitle>
            
            <FormGroup>
              <Label>Theme</Label>
              <Select
                value={formData.theme}
                onChange={(e) => handleInputChange('theme', e.target.value)}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </Select>
            </FormGroup>
{/*             
            <FormGroup>
              <Label>Default Output Format</Label>
              <Select
                value={formData.defaultOutputFormat}
                onChange={(e) => handleInputChange('defaultOutputFormat', e.target.value)}
              >
                <option value="glb">GLB</option>
                <option value="obj">OBJ</option>
                <option value="fbx">FBX</option>
                <option value="ply">PLY</option>
              </Select>
            </FormGroup>
            
            <FormGroup>
              <CheckboxLabel>
                <Checkbox
                  checked={formData.autoSave}
                  onChange={(e) => handleInputChange('autoSave', e.target.checked)}
                />
                Auto-save projects
              </CheckboxLabel>
            </FormGroup> */}
          </FormSection>

          <FormSection>
            <SectionTitle>
              <i className="fas fa-tachometer-alt"></i>
              Performance Settings
            </SectionTitle>
{/*             
            <FormGroup>
              <Label>Max Concurrent Tasks: {formData.maxConcurrentTasks}</Label>
              <Input
                type="range"
                min="1"
                max="10"
                value={formData.maxConcurrentTasks}
                onChange={(e) => handleInputChange('maxConcurrentTasks', parseInt(e.target.value))}
              />
            </FormGroup> */}
            
            <FormGroup>
              <Label>Polling Interval (ms): {formData.pollingInterval}</Label>
              <Input
                type="range"
                min="1000"
                max="30000"
                step="1000"
                value={formData.pollingInterval}
                onChange={(e) => handleInputChange('pollingInterval', parseInt(e.target.value))}
              />
            </FormGroup>
          </FormSection>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Settings
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default SettingsPanel; 