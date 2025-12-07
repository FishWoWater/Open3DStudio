import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store';
import { getApiClient } from '../../api/client';
import Select, { SelectOption } from '../ui/Select';
import MeshFileUploadWithPreview from '../ui/MeshFileUploadWithPreview';
import { TaskType } from '../../types/state';
import { JobStatus, PartCompletionRequest } from '../../types/api';
import { getFullApiUrl } from '../../utils/url';

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
  const { addTask, addNotification, ui, clearTaskResultAsInput, tasks, settings } = useStore();
  const [formData, setFormData] = useState<FormData>({
    meshFile: null,
    uploadedMeshId: null,
    outputFormat: 'glb',
    modelPreference: 'holopart_part_completion'
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Use refs to store uploaded file IDs persistently across renders
  const uploadedMeshIdRef = React.useRef<string | null>(null);
  const currentMeshFileRef = React.useRef<File | null>(null);

  // Handle task result as input
  useEffect(() => {
    if (ui.taskResultAsInput) {
      const task = tasks.tasks.find(t => t.id === ui.taskResultAsInput);
      if (task?.result?.downloadUrl) {
        const downloadUrl = getFullApiUrl(task.result.downloadUrl, settings.apiEndpoint);
        if (!downloadUrl) {
          clearTaskResultAsInput();
          return;
        }
        
        setIsDownloading(true);
        setError(null);
        
        fetch(downloadUrl)
          .then(response => {
            if (!response.ok) throw new Error(`Failed to download: ${response.statusText}`);
            return response.blob();
          })
          .then(blob => {
            let filename = 'mesh.glb';
            const urlPath = task.result!.downloadUrl!.split('?')[0];
            const urlParts = urlPath.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            
            if (lastPart && lastPart.includes('.')) {
              filename = lastPart;
            } else {
              const extension = blob.type.includes('gltf') ? 'glb' : 
                               blob.type.includes('obj') ? 'obj' :
                               blob.type.includes('fbx') ? 'fbx' :
                               blob.type.includes('ply') ? 'ply' : 'glb';
              filename = `${task.name.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
            }
            
            const file = new File([blob], filename, { type: blob.type || 'model/gltf-binary' });
            
            setFormData(prev => ({
              ...prev,
              meshFile: file,
              uploadedMeshId: null
            }));
            
            // Reset mesh refs when loading from task result
            uploadedMeshIdRef.current = null;
            currentMeshFileRef.current = file;
            
            setIsDownloading(false);
            addNotification({
              type: 'success',
              title: 'Mesh Loaded',
              message: `Successfully loaded mesh from task result`,
              duration: 3000
            });
          })
          .catch(error => {
            console.error('Failed to download task result:', error);
            setIsDownloading(false);
            setError('Failed to download mesh from task result');
            addNotification({
              type: 'error',
              title: 'Download Failed',
              message: error instanceof Error ? error.message : 'Could not load mesh from task result',
              duration: 4000
            });
          })
          .finally(() => {
            clearTaskResultAsInput();
          });
      } else {
        clearTaskResultAsInput();
      }
    }
  }, [ui.taskResultAsInput, tasks.tasks, clearTaskResultAsInput, settings.apiEndpoint, addNotification]);

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleMeshChange = useCallback((file: File | null, meshId: string | null) => {
    setFormData(prev => ({ ...prev, meshFile: file, uploadedMeshId: meshId }));
    uploadedMeshIdRef.current = null; // Reset ref when file changes
    currentMeshFileRef.current = file;
    setError(null);
  }, []);

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
      
      // Check if we have a cached file ID for the current mesh file
      let meshFileId = uploadedMeshIdRef.current;
      // Compare files by properties instead of reference to handle file object recreation
      const isSameMesh = currentMeshFileRef.current && formData.meshFile &&
        currentMeshFileRef.current.name === formData.meshFile.name &&
        currentMeshFileRef.current.size === formData.meshFile.size &&
        currentMeshFileRef.current.lastModified === formData.meshFile.lastModified;
      
      // Upload mesh file if not already uploaded or if file changed
      if (!meshFileId || !isSameMesh) {
        const uploadResponse = await apiClient.uploadMeshFile(
          formData.meshFile!,
          (progress) => setUploadProgress(progress * 0.8) // 80% for upload
        );
        meshFileId = uploadResponse.file_id;
        uploadedMeshIdRef.current = meshFileId; // Store in ref for immediate reuse
        currentMeshFileRef.current = formData.meshFile;
        handleInputChange('uploadedMeshId', meshFileId); // Also update state for UI
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
        name: `${formData.meshFile!.name}`,
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
        {isDownloading && (
          <InfoBox>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid #4a9eff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Downloading mesh from task result...
            </div>
          </InfoBox>
        )}
        <MeshFileUploadWithPreview
          value={formData.meshFile}
          uploadedMeshId={formData.uploadedMeshId}
          onChange={handleMeshChange}
          acceptedFormats={['.glb', '.obj', '.fbx', '.ply', '.stl']}
          maxSizeMB={200}
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
          disabled={isCompleting || isDownloading}
          onClick={handleComplete}
        >
          {isCompleting ? 'Processing...' : isDownloading ? 'Downloading...' : 'Complete Missing Parts'}
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