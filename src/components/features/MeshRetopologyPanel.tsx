import React, { useState, useCallback, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store';
import { getApiClient } from '../../api/client';
import Select, { SelectOption } from '../ui/Select';
import MeshFileUploadWithPreview from '../ui/MeshFileUploadWithPreview';
import AdvancedParameters from '../ui/AdvancedParameters';
import { useModelParameters } from '../../hooks/useModelParameters';
import { TaskType } from '../../types/state';
import { JobStatus, MeshRetopologyRequest, RetopologyAvailableModels } from '../../types/api';
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

const TextInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
  }
`;

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

const FilePreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
`;

const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
`;

const FileIcon = styled.div`
  font-size: 24px;
`;

const FileName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const FileSize = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
`;

const RemoveButton = styled.button`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.error};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    opacity: 0.8;
  }
`;

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
`;

const ProcessButton = styled.button<{ disabled: boolean }>`
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
  color: ${props => props.theme.colors.primary[400]};
  background: ${props => `${props.theme.colors.primary[500]}15`};
  border: 1px solid ${props => `${props.theme.colors.primary[500]}30`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.colors.border.default};
  border-top: 2px solid ${props => props.theme.colors.primary[500]};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface FormData {
  meshFile: File | null;
  uploadedMeshId: string | null;
  outputFormat: 'obj' | 'glb' | 'ply';
  polyType: 'tri' | 'quad';
  targetVertexCount: string;
  seed: string;
  modelPreference: string;
}

const outputFormatOptions: SelectOption[] = [
  { value: 'obj', label: 'OBJ' },
  { value: 'glb', label: 'GLB' },
  { value: 'ply', label: 'PLY' }
];

const polyTypeOptions: SelectOption[] = [
  { value: 'tri', label: 'Triangle' },
  { value: 'quad', label: 'Quad' }
];

const MeshRetopologyPanel: React.FC = () => {
  const { addTask, addNotification, ui, clearTaskResultAsInput, tasks, settings } = useStore();
  const [formData, setFormData] = useState<FormData>({
    meshFile: null,
    uploadedMeshId: null,
    outputFormat: 'obj',
    polyType: 'tri',
    targetVertexCount: '',
    seed: '42',
    modelPreference: ''
  });
  const [advancedParams, setAdvancedParams] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<RetopologyAvailableModels | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Use refs to store uploaded file IDs persistently across renders
  const uploadedMeshIdRef = React.useRef<string | null>(null);
  const currentMeshFileRef = React.useRef<File | null>(null);
  
  // Fetch model-specific parameters
  const { parameters: modelParameters } = useModelParameters(formData.modelPreference);

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
            let filename = 'mesh.obj';
            const urlPath = task.result!.downloadUrl!.split('?')[0];
            const urlParts = urlPath.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            
            if (lastPart && lastPart.includes('.')) {
              filename = lastPart;
            } else {
              const extension = blob.type.includes('gltf') ? 'glb' : 
                               blob.type.includes('obj') ? 'obj' :
                               blob.type.includes('fbx') ? 'fbx' :
                               blob.type.includes('ply') ? 'ply' : 'obj';
              filename = `${task.name.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
            }
            
            const file = new File([blob], filename, { type: blob.type || 'model/obj' });
            
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

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const apiClient = getApiClient();
        const models = await apiClient.getRetopologyAvailableModels();
        setAvailableModels(models);
        // Set default model preference
        if (models.available_models.length > 0) {
          setFormData(prev => ({ ...prev, modelPreference: models.available_models[0] }));
        }
      } catch (err) {
        console.error('Failed to fetch available models:', err);
        addNotification({
          type: 'error',
          title: 'Failed to Load Models',
          message: 'Could not fetch available retopology models',
          duration: 5000
        });
      } finally {
        setLoadingModels(false);
      }
    };

    fetchModels();
  }, [addNotification]);

  const modelPreferenceOptions: SelectOption[] = useMemo(() => {
    if (!availableModels) return [];
    return availableModels.available_models.map(model => ({
      value: model,
      label: availableModels.models_details[model]?.description || model
    }));
  }, [availableModels]);

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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateForm = useCallback((): string | null => {
    if (!formData.meshFile) {
      return 'Please select a mesh file';
    }

    if (formData.meshFile.size > 100 * 1024 * 1024) {
      return 'Mesh file must be smaller than 100MB';
    }

    if (formData.targetVertexCount && isNaN(parseInt(formData.targetVertexCount))) {
      return 'Target vertex count must be a number';
    }

    if (formData.seed && isNaN(parseInt(formData.seed))) {
      return 'Seed must be a number';
    }

    return null;
  }, [formData]);

  const handleProcess = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      addNotification({
        type: 'warning',
        title: 'Invalid Input',
        message: validationError,
        duration: 4000
      });
      return;
    }

    setIsProcessing(true);
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
      
      // Upload mesh if not already uploaded or if file changed
      if (!meshFileId || !isSameMesh) {
        const uploadResponse = await apiClient.uploadMeshFile(
          formData.meshFile!,
          (progress) => setUploadProgress(progress * 0.5)
        );
        meshFileId = uploadResponse.file_id;
        uploadedMeshIdRef.current = meshFileId; // Store in ref for immediate reuse
        currentMeshFileRef.current = formData.meshFile;
        handleInputChange('uploadedMeshId', meshFileId); // Also update state for UI
      }

      // Submit retopology job
      const request: MeshRetopologyRequest = {
        mesh_file_id: meshFileId,
        output_format: formData.outputFormat,
        poly_type: formData.polyType,
        model_preference: formData.modelPreference,
        ...(formData.targetVertexCount && { target_vertex_count: parseInt(formData.targetVertexCount) }),
        ...(formData.seed && { seed: parseInt(formData.seed) }),
        model_parameters: advancedParams // Model-specific parameters wrapped in model_parameters
      };

      console.log('[DEBUG] Mesh retopology request:', request);
      const response = await apiClient.retopologizeMesh(request);

      if (!response.job_id) {
        throw new Error('Failed to start mesh retopology job');
      }

      setUploadProgress(100);

      // Create task to track the job
      const task = {
        id: `task-${Date.now()}`,
        jobId: response.job_id,
        type: 'mesh-retopo' as TaskType,
        name: `${formData.meshFile!.name.substring(0, 20)}`,
        status: response.status as JobStatus,
        createdAt: new Date(),
        progress: 0,
        inputData: {
          files: [{
            id: meshFileId,
            name: formData.meshFile!.name,
            type: formData.meshFile!.type,
            size: formData.meshFile!.size
          }],
          parameters: {
            outputFormat: formData.outputFormat,
            polyType: formData.polyType,
            targetVertexCount: formData.targetVertexCount,
            seed: formData.seed,
            modelPreference: formData.modelPreference
          }
        }
      };

      addTask(task);

      addNotification({
        type: 'success',
        title: 'Retopology Started',
        message: `Mesh retopology job submitted successfully. Job ID: ${response.job_id}`,
        duration: 5000
      });

      setIsProcessing(false);
      setUploadProgress(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process mesh retopology');
      setIsProcessing(false);
      setUploadProgress(0);
      
      addNotification({
        type: 'error',
        title: 'Retopology Failed',
        message: err instanceof Error ? err.message : 'Failed to process mesh retopology. Please try again.',
        duration: 5000
      });
    }
  }, [validateForm, formData, addTask, addNotification, handleInputChange, advancedParams]);

  return (
    <PanelContainer>
      <Header>
        <Title>Mesh Retopology</Title>
        <Description>
          Optimize mesh topology by reducing polygon count while preserving shape quality.
          Perfect for game assets and real-time applications.
        </Description>
      </Header>

      {loadingModels ? (
        <FormSection>
          <InfoBox style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LoadingSpinner />
            Loading available models...
          </InfoBox>
        </FormSection>
      ) : !availableModels || availableModels.available_models.length === 0 ? (
        <FormSection>
          <ErrorMessage>
            No retopology models available. Please check your API connection.
          </ErrorMessage>
        </FormSection>
      ) : (
        <>
          <FormSection>
            <Label>Mesh Upload</Label>
            {isDownloading && (
              <InfoBox style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid #4a9eff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Downloading mesh from task result...
              </InfoBox>
            )}
            <MeshFileUploadWithPreview
              value={formData.meshFile}
              uploadedMeshId={formData.uploadedMeshId}
              onChange={handleMeshChange}
              acceptedFormats={['.obj', '.glb', '.fbx', '.ply', '.stl']}
              maxSizeMB={100}
              showYUpHint={true}
            />
          </FormSection>

          <FormSection>
            <Label>Model Preference</Label>
            <Select
              options={modelPreferenceOptions}
              value={formData.modelPreference}
              onChange={(value) => handleInputChange('modelPreference', value)}
              placeholder="Select retopology model"
            />
            {formData.modelPreference && availableModels.models_details[formData.modelPreference] && (
              <InfoBox style={{ marginTop: '8px' }}>
                <strong>Target Vertices:</strong> ~{availableModels.models_details[formData.modelPreference].target_vertices}
                <br />
                {/* <strong>Recommended for:</strong> {availableModels.models_details[formData.modelPreference].recommended_for} */}
              </InfoBox>
            )}
          </FormSection>

          {formData.modelPreference && modelParameters && (
            <AdvancedParameters
              parameters={modelParameters.schema.parameters}
              values={advancedParams}
              onChange={setAdvancedParams}
            />
          )}

          <FormSection>
            <Label>Parameters</Label>
            <ParameterGrid>
              <div>
                <Label htmlFor="outputFormat">Output Format</Label>
                <Select
                  options={outputFormatOptions}
                  value={formData.outputFormat}
                  onChange={(value) => handleInputChange('outputFormat', value)}
                  placeholder="Select output format"
                />
              </div>
              <div>
                <Label htmlFor="polyType">Polygon Type</Label>
                <Select
                  options={polyTypeOptions}
                  value={formData.polyType}
                  onChange={(value) => handleInputChange('polyType', value)}
                  placeholder="Select polygon type"
                />
              </div>
              <div>
                <Label htmlFor="seed">Seed (Optional)</Label>
                <TextInput
                  id="seed"
                  type="number"
                  placeholder="42"
                  value={formData.seed}
                  onChange={(e) => handleInputChange('seed', e.target.value)}
                />
              </div>
            </ParameterGrid>
          </FormSection>

          <FormSection>
            <Label htmlFor="targetVertexCount">Target Vertex Count (Optional)</Label>
            <TextInput
              id="targetVertexCount"
              type="number"
              placeholder="Leave empty to use model default"
              value={formData.targetVertexCount}
              onChange={(e) => handleInputChange('targetVertexCount', e.target.value)}
            />
          </FormSection>

          <FormSection>
            <ProcessButton
              disabled={isProcessing || isDownloading || !formData.meshFile || !formData.modelPreference}
              onClick={handleProcess}
            >
              {isDownloading ? 'Downloading...' :
               isProcessing ? 'Processing...' : 
               !formData.meshFile ? 'Select Mesh File' :
               !formData.modelPreference ? 'Select Model' :
               'Start Retopology'}
            </ProcessButton>
            
            {isProcessing && (
              <ProgressBar progress={uploadProgress} />
            )}
            
            {error && (
              <ErrorMessage>{error}</ErrorMessage>
            )}
          </FormSection>
        </>
      )}
    </PanelContainer>
  );
};

export default MeshRetopologyPanel;

