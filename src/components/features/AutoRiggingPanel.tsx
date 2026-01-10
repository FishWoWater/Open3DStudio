import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store';
import { getApiClient } from '../../api/client';
import Select, { SelectOption } from '../ui/Select';
import MeshFileUploadWithPreview from '../ui/MeshFileUploadWithPreview';
import AdvancedParameters from '../ui/AdvancedParameters';
import { useModelParameters } from '../../hooks/useModelParameters';
import { TaskType } from '../../types/state';
import { JobStatus, AutoRiggingRequest } from '../../types/api';
import { getFullApiUrl } from '../../utils/url';

const PanelContainer = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.default};
  height: 100%;
  overflow-y: auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
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
const rigModeOptions: SelectOption[] = [
  { value: 'skeleton', label: 'Skeleton Only' },
  { value: 'skin', label: 'Skinning Only' },
  { value: 'full', label: 'Full Rig (Skeleton + Skinning)' }
];

const outputFormatOptions: SelectOption[] = [
  { value: 'fbx', label: 'FBX' },
  // { value: 'glb', label: 'GLB' }
];

const modelPreferenceOptions: SelectOption[] = [
  { value: 'unirig_auto_rig', label: 'UniRig (Default)' }
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

const RigButton = styled.button<{ disabled: boolean }>`
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
  rigMode: 'skeleton' | 'skin' | 'full';
  outputFormat: 'fbx';
  modelPreference?: string;
}

const AutoRiggingPanel: React.FC = () => {
  const { addTask, addNotification, ui, clearTaskResultAsInput, tasks, settings } = useStore();
  const [formData, setFormData] = useState<FormData>({
    meshFile: null,
    uploadedMeshId: null,
    rigMode: 'full',
    outputFormat: 'fbx',
    modelPreference: 'unirig_auto_rig'
  });
  const [advancedParams, setAdvancedParams] = useState<Record<string, any>>({});
  const [isRigging, setIsRigging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Use refs to store uploaded file IDs persistently across renders
  const uploadedMeshIdRef = React.useRef<string | null>(null);
  
  // Fetch model-specific parameters
  const { parameters: modelParameters } = useModelParameters(formData.modelPreference);
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
        
        // Show loading state
        setIsDownloading(true);
        setError(null);
        
        // Download the mesh file and convert it to a File object
        fetch(downloadUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to download: ${response.statusText}`);
            }
            return response.blob();
          })
          .then(blob => {
            // Extract filename from URL, handling query parameters
            let filename = 'mesh.glb';
            const urlPath = task.result!.downloadUrl!.split('?')[0]; // Remove query params
            const urlParts = urlPath.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            
            if (lastPart && lastPart.includes('.')) {
              filename = lastPart;
            } else {
              // Infer extension from blob type or use default
              const extension = blob.type.includes('gltf') ? 'glb' : 
                               blob.type.includes('obj') ? 'obj' :
                               blob.type.includes('fbx') ? 'fbx' :
                               blob.type.includes('ply') ? 'ply' : 'glb';
              filename = `${task.name.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
            }
            
            // Create a File object from the blob
            const file = new File([blob], filename, { type: blob.type || 'model/gltf-binary' });
            
            setFormData(prev => ({
              ...prev,
              meshFile: file,
              uploadedMeshId: null // Will be set after upload
            }));
            
            // Reset mesh refs when loading from task result
            uploadedMeshIdRef.current = null;
            currentMeshFileRef.current = file;
            
            setIsDownloading(false);
            
            // Show success notification
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
      return 'Please select a character mesh file';
    }
    
    if (formData.meshFile.size > 200 * 1024 * 1024) { // 200MB limit from API docs
      return 'Mesh file must be smaller than 200MB';
    }
    
    return null;
  }, [formData]);

  const handleRig = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsRigging(true);
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

      // Create rigging request
      const request: AutoRiggingRequest = {
        mesh_file_id: meshFileId,
        rig_mode: formData.rigMode,
        output_format: formData.outputFormat,
        model_preference: formData.modelPreference,
        ...advancedParams // Include model-specific parameters
      };

      // Start rigging job
      const response = await apiClient.generateRig(request);

      if (!response.job_id) {
        throw new Error('Failed to start rigging job');
      }

      setUploadProgress(100); // Complete progress after successful request

      // Create task to track the job
      const task = {
        id: `task-${Date.now()}`,
        jobId: response.job_id,
        type: 'auto-rigging' as TaskType,
        name: `${formData.meshFile!.name.substring(0, 15)} (${formData.rigMode})`,
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
            rigMode: formData.rigMode,
            outputFormat: formData.outputFormat,
            modelPreference: formData.modelPreference
          }
        }
      };

      addTask(task);

      addNotification({
        type: 'success',
        title: 'Rigging Started',
        message: `Auto rigging job submitted successfully. Job ID: ${response.job_id}`,
        duration: 5000,
      });

      setIsRigging(false);
      setUploadProgress(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate rig');
      setIsRigging(false);
      setUploadProgress(0);
      
      addNotification({
        type: 'error',
        title: 'Rigging Failed',
        message: err instanceof Error ? err.message : 'Failed to generate character rig. Please try again.'
      });
    }
  }, [validateForm, formData, addTask, addNotification, handleInputChange]);

  return (
    <PanelContainer>
      <Header>
        <Title>Auto Rigging</Title>
        <Description>
          Automatically generate skeletal rigs for character meshes using AI algorithms.
        </Description>
      </Header>

      <FormSection>
        <Label>Character Mesh Upload (Required)</Label>
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
          acceptedFormats={['.glb', '.obj', '.fbx', '.ply', '.dae']}
          maxSizeMB={200}
        />
      </FormSection>

      <FormSection>
        <Label>Rigging Mode</Label>
        <Select
          options={rigModeOptions}
          value={formData.rigMode}
          onChange={(value) => handleInputChange('rigMode', value)}
          placeholder="Select rigging mode"
        />
        <InfoBox>
          <strong>Skeleton:</strong> Creates bone structure only<br/>
          <strong>Skinning:</strong> Binds geometry to existing bones<br/>
          <strong>Full:</strong> Complete rig with bones and skinning
        </InfoBox>
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
      </FormSection>

      {formData.modelPreference && modelParameters && (
        <AdvancedParameters
          parameters={modelParameters.schema.parameters}
          values={advancedParams}
          onChange={setAdvancedParams}
        />
      )}

      <FormSection>
        <RigButton
          disabled={isRigging || isDownloading}
          onClick={handleRig}
        >
          {isRigging ? 'Processing...' : isDownloading ? 'Downloading...' : 'Generate Character Rig'}
        </RigButton>
        
        {isRigging && (
          <ProgressBar progress={uploadProgress} />
        )}
        
        {error && (
          <ErrorMessage>{error}</ErrorMessage>
        )}
      </FormSection>
    </PanelContainer>
  );
};

export default AutoRiggingPanel; 