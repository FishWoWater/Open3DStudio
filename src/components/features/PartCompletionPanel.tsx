import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store';
import { getApiClient } from '../../api/client';
import Select, { SelectOption } from '../ui/Select';
import { TaskType } from '../../types/state';
import { JobStatus, PartCompletionRequest } from '../../types/api';

const PanelContainer = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.default};
  height: 100%;
  overflow-y: auto;
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Title = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.lg};
  font-weight: ${props => props.theme.typography.fontWeight.semibold};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Description = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  line-height: ${props => props.theme.typography.lineHeight.relaxed};
`;

const FormSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

// Select options
const outputFormatOptions: SelectOption[] = [
  { value: 'glb', label: 'GLB' },
  { value: 'obj', label: 'OBJ' },
  { value: 'fbx', label: 'FBX' },
  { value: 'ply', label: 'PLY' }
];

const modelPreferenceOptions: SelectOption[] = [
  { value: 'holopart_part_completion', label: 'HoloPart (Default)' }
];

const DropZone = styled.div<{ isDragOver: boolean; hasFile: boolean }>`
  border: 2px dashed ${props => 
    props.isDragOver ? props.theme.colors.primary[500] : 
    props.hasFile ? props.theme.colors.success : 
    props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  background: ${props => props.isDragOver ? `${props.theme.colors.primary[500]}10` : 'transparent'};

  &:hover {
    border-color: ${props => props.theme.colors.primary[400]};
    background: ${props => `${props.theme.colors.primary[500]}05`};
  }
`;

const DropZoneText = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const FileInfo = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const CompleteButton = styled.button<{ disabled: boolean }>`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.disabled ? props.theme.colors.gray[600] : props.theme.colors.primary[500]};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all ${props => props.theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${props => props.theme.colors.primary[600]};
  }
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 4px;
  background: ${props => props.theme.colors.gray[700]};
  border-radius: 2px;
  overflow: hidden;
  margin: ${props => props.theme.spacing.sm} 0;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.progress}%;
    background: ${props => props.theme.colors.primary[500]};
    transition: width ${props => props.theme.transitions.normal};
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  background: ${props => `${props.theme.colors.error}15`};
  border: 1px solid ${props => `${props.theme.colors.error}30`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const InfoBox = styled.div`
  background: ${props => `${props.theme.colors.info}15`};
  border: 1px solid ${props => `${props.theme.colors.info}30`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.md};
`;

interface FormData {
  meshFile: File | null;
  uploadedMeshId: string | null;
  outputFormat: 'glb' | 'obj' | 'fbx' | 'ply';
  modelPreference?: string;
}

const PartCompletionPanel: React.FC = () => {
  const { addTask, addNotification } = useStore();
  const [formData, setFormData] = useState<FormData>({
    meshFile: null,
    uploadedMeshId: null,
    outputFormat: 'glb',
    modelPreference: 'holopart_part_completion'
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const meshFile = files.find(file => 
      file.name.endsWith('.glb') || 
      file.name.endsWith('.obj') || 
      file.name.endsWith('.fbx') ||
      file.name.endsWith('.ply') ||
      file.name.endsWith('.stl')
    );
    
    if (meshFile) {
      handleInputChange('meshFile', meshFile);
      handleInputChange('uploadedMeshId', null); // Reset uploaded ID
    } else {
      setError('Please select a valid 3D mesh file (GLB, OBJ, FBX, PLY, STL)');
    }
  }, [handleInputChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('meshFile', file);
      handleInputChange('uploadedMeshId', null); // Reset uploaded ID
    }
  }, [handleInputChange]);

  const validateForm = useCallback((): string | null => {
    if (!formData.meshFile) {
      return 'Please select an incomplete 3D mesh file';
    }
    
    if (formData.meshFile.size > 200 * 1024 * 1024) { // 200MB limit from API docs
      return 'Mesh file must be smaller than 200MB';
    }
    
    return null;
  }, [formData]);

  const handleComplete = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsCompleting(true);
    setUploadProgress(0);
    setError(null);

    try {
      const apiClient = getApiClient();
      
      // Upload mesh file if not already uploaded
      let meshFileId = formData.uploadedMeshId;
      if (!meshFileId) {
        const uploadResponse = await apiClient.uploadMeshFile(
          formData.meshFile!,
          (progress) => setUploadProgress(progress * 0.8) // 80% for upload
        );
        meshFileId = uploadResponse.file_id;
        handleInputChange('uploadedMeshId', meshFileId);
      }

      // Create part completion request
      const request: PartCompletionRequest = {
        mesh_file_id: meshFileId,
        output_format: formData.outputFormat,
        model_preference: formData.modelPreference
      };

      // Start completion job
      const response = await apiClient.partCompletion(request);

      if (!response.job_id) {
        throw new Error('Failed to start part completion job');
      }

      setUploadProgress(100); // Complete progress after successful request

      // Create task to track the job
      const task = {
        id: `task-${Date.now()}`,
        jobId: response.job_id,
        type: 'part-completion' as TaskType,
        name: `Part Completion: ${formData.meshFile!.name}`,
        status: response.status as JobStatus,
        createdAt: new Date(),
        progress: 0,
        inputData: {
          files: [{
            id: formData.uploadedMeshId || `mesh-${Date.now()}`,
            name: formData.meshFile!.name,
            type: formData.meshFile!.type,
            size: formData.meshFile!.size
          }],
          parameters: {
            outputFormat: formData.outputFormat,
            modelPreference: formData.modelPreference
          }
        }
      };

      addTask(task);

      addNotification({
        type: 'success',
        title: 'Completion Started',
        message: `Part completion job submitted successfully. Job ID: ${response.job_id}`, 
        duration: 5000,
      });

      setIsCompleting(false);
      setUploadProgress(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete mesh parts');
      setIsCompleting(false);
      setUploadProgress(0);
      
      addNotification({
        type: 'error',
        title: 'Completion Failed',
        message: err instanceof Error ? err.message : 'Failed to complete missing mesh parts. Please try again.',
        duration: 5000,
      });
    }
  }, [validateForm, formData, addTask, addNotification, handleInputChange]);

  return (
    <PanelContainer>
      <Header>
        <Title>Part Completion</Title>
        <Description>
          Complete missing parts of 3D meshes using AI-powered reconstruction algorithms.
        </Description>
      </Header>

      <FormSection>
        <Label>Incomplete Mesh Upload (Required)</Label>
        <DropZone
          isDragOver={isDragOver}
          hasFile={!!formData.meshFile}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => document.getElementById('meshInput')?.click()}
        >
          <DropZoneText>
            {formData.meshFile 
              ? `Selected: ${formData.meshFile.name}`
              : 'Drag & drop an incomplete 3D mesh here, or click to select'
            }
          </DropZoneText>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Supported: GLB, OBJ, FBX, PLY, STL (max 200MB)
          </div>
          {formData.meshFile && (
            <FileInfo>
              Size: {(formData.meshFile.size / 1024 / 1024).toFixed(2)} MB
            </FileInfo>
          )}
        </DropZone>
        <input
          id="meshInput"
          type="file"
          accept=".glb,.obj,.fbx,.ply,.stl"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </FormSection>

      <FormSection>
        <Label>Output Format</Label>
        <Select
          options={outputFormatOptions}
          value={formData.outputFormat}
          onChange={(value) => handleInputChange('outputFormat', value)}
          placeholder="Select output format"
        />
      </FormSection>

      <FormSection>
        <Label>Model Preference (Optional)</Label>
        <Select
          options={modelPreferenceOptions}
          value={formData.modelPreference}
          onChange={(value) => handleInputChange('modelPreference', value)}
          placeholder="Select model preference"
        />
        <InfoBox>
          The AI will analyze the mesh and automatically detect and complete missing parts.
        </InfoBox>
      </FormSection>

      <FormSection>
        <CompleteButton
          disabled={isCompleting}
          onClick={handleComplete}
        >
          {isCompleting ? 'Processing...' : 'Complete Missing Parts'}
        </CompleteButton>
        
        {isCompleting && (
          <ProgressBar progress={uploadProgress} />
        )}
        
        {error && (
          <ErrorMessage>{error}</ErrorMessage>
        )}
      </FormSection>
    </PanelContainer>
  );
};

export default PartCompletionPanel; 