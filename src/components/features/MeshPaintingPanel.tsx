import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store';
import { getApiClient } from '../../api/client';
import ImagePreview from '../ui/ImagePreview';
import MeshFileUploadWithPreview from '../ui/MeshFileUploadWithPreview';
import Select, { SelectOption } from '../ui/Select';
import { TaskType } from '../../types/state';
import { JobStatus, MeshPaintingRequest } from '../../types/api';
import { cleanModelName } from '../../utils/modelNames';
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

const TabContainer = styled.div`
  display: flex;
  margin-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
`;

const Tab = styled.button<{ active: boolean }>`
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  color: ${props => props.active ? props.theme.colors.primary[500] : props.theme.colors.text.secondary};
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary[500] : 'transparent'};
  cursor: pointer;
  font-weight: ${props => props.active ? props.theme.typography.fontWeight.medium : props.theme.typography.fontWeight.normal};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    color: ${props => props.theme.colors.primary[400]};
  }
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

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
  }
`;

// Select options
const textureResolutionOptions: SelectOption[] = [
  { value: '512', label: '512x512' },
  { value: '1024', label: '1024x1024' },
  { value: '2048', label: '2048x2048' },
  { value: '4096', label: '4096x4096' }
];

const outputFormatOptions: SelectOption[] = [
  { value: 'glb', label: 'GLB' },
  { value: 'obj', label: 'OBJ' },
  { value: 'fbx', label: 'FBX' },
  { value: 'ply', label: 'PLY' }
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

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
`;

const PaintButton = styled.button<{ disabled: boolean }>`
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

type PaintingMode = 'text' | 'image';

interface FormData {
  // Common
  meshFile: File | null;
  uploadedMeshId: string | null;
  paintingMode: PaintingMode;
  
  // Text painting
  textPrompt: string;
  
  // Image painting  
  referenceImage: File | null;
  uploadedImageId: string | null;
  
  // Parameters (only those supported by the API)
  textureResolution: number;
  outputFormat: 'glb' | 'obj' | 'fbx' | 'ply';
  modelPreference?: string;
}

const MeshPaintingPanel: React.FC = () => {
  const { addTask, addNotification, ui, clearTaskResultAsInput, tasks, settings } = useStore();
  const [formData, setFormData] = useState<FormData>({
    meshFile: null,
    uploadedMeshId: null,
    paintingMode: 'text',
    textPrompt: '',
    referenceImage: null,
    uploadedImageId: null,
    textureResolution: 1024,
    outputFormat: 'glb',
    modelPreference: undefined
  });
  const [imageDragOver, setImageDragOver] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
    setError(null);
  }, []);

  const handleImageDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setImageDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleInputChange('referenceImage', imageFile);
      handleInputChange('uploadedImageId', null); // Reset uploaded ID
    } else {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
    }
  }, [handleInputChange]);

  const handleMeshSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('meshFile', file);
      handleInputChange('uploadedMeshId', null); // Reset uploaded ID
    }
  }, [handleInputChange]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('referenceImage', file);
      handleInputChange('uploadedImageId', null); // Reset uploaded ID
    }
  }, [handleInputChange]);

  const handleRemoveImage = useCallback(() => {
    handleInputChange('referenceImage', null);
    handleInputChange('uploadedImageId', null);
  }, [handleInputChange]);

  const validateForm = useCallback((): string | null => {
    let errorMessage: string | null = null;
    
    if (!formData.meshFile) {
      errorMessage = 'Please select a 3D mesh file';
    } else if (formData.meshFile.size > 200 * 1024 * 1024) { // 200MB limit from API docs
      errorMessage = 'Mesh file must be smaller than 200MB';
    } else if (formData.paintingMode === 'text') {
      if (!formData.textPrompt.trim()) {
        errorMessage = 'Please enter a texture description';
      } else if (formData.textPrompt.length < 3) {
        errorMessage = 'Texture description must be at least 3 characters long';
      }
    } else {
      if (!formData.referenceImage) {
        errorMessage = 'Please select a reference image';
      } else if (formData.referenceImage.size > 50 * 1024 * 1024) { // 50MB limit from API docs
        errorMessage = 'Image file must be smaller than 50MB';
      }
    }
    
    // Show notification for validation errors
    if (errorMessage) {
      addNotification({
        type: 'warning',
        title: 'Invalid Input',
        message: errorMessage,
        duration: 4000,
      });
    }
    
    return errorMessage;
  }, [formData, addNotification]);

  const handlePaint = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsPainting(true);
    setUploadProgress(0);
    setError(null);

    try {
      const apiClient = getApiClient();
      let response;
      let taskName: string;
      let taskType: TaskType;

      // Upload mesh file if not already uploaded
      let meshFileId = formData.uploadedMeshId;
      if (!meshFileId) {
        const meshUploadResponse = await apiClient.uploadMeshFile(
          formData.meshFile!,
          (progress) => setUploadProgress(progress * 0.4) // 40% for mesh upload
        );
        meshFileId = meshUploadResponse.file_id;
        handleInputChange('uploadedMeshId', meshFileId);
      }

      if (formData.paintingMode === 'text') {
        // Text mesh painting
        taskName = `Text Painting: "${formData.textPrompt.substring(0, 30)}${formData.textPrompt.length > 30 ? '...' : ''}"`;
        
        const request: MeshPaintingRequest = {
          text_prompt: formData.textPrompt,
          mesh_file_id: meshFileId,
          texture_resolution: formData.textureResolution,
          output_format: formData.outputFormat,
          model_preference: formData.modelPreference
        };

        console.log("sending mesh painting request", request);

        response = await apiClient.textMeshPainting(request);
        taskType = 'text-mesh-painting' as TaskType;
      } else {
        // Image mesh painting
        taskName = `Image Painting: ${formData.referenceImage!.name}`;
        
        // Upload image file if not already uploaded
        let imageFileId = formData.uploadedImageId;
        if (!imageFileId) {
          const imageUploadResponse = await apiClient.uploadImageFile(
            formData.referenceImage!,
            (progress) => setUploadProgress(40 + progress * 0.4) // 40-80% for image upload
          );
          imageFileId = imageUploadResponse.file_id;
          handleInputChange('uploadedImageId', imageFileId);
        }

        const request: MeshPaintingRequest = {
          image_file_id: imageFileId,
          mesh_file_id: meshFileId,
          texture_resolution: formData.textureResolution,
          output_format: formData.outputFormat,
          model_preference: formData.modelPreference
        };

        response = await apiClient.imageMeshPainting(request);
        taskType = 'image-mesh-painting' as TaskType;
      }

      if (!response.job_id) {
        throw new Error('Failed to start mesh painting job');
      }

      setUploadProgress(100); // Complete progress after successful request

      // Create task to track the job
      const task = {
        id: `task-${Date.now()}`,
        jobId: response.job_id,
        type: taskType,
        name: taskName,
        status: response.status as JobStatus,
        createdAt: new Date(),
        progress: 0,
        inputData: {
          textPrompt: formData.textPrompt,
          files: [
            {
              id: formData.uploadedMeshId || `mesh-${Date.now()}`,
              name: formData.meshFile!.name,
              type: formData.meshFile!.type,
              size: formData.meshFile!.size
            },
            ...(formData.referenceImage ? [{
              id: formData.uploadedImageId || `ref-${Date.now()}`,
              name: formData.referenceImage.name,
              type: formData.referenceImage.type,
              size: formData.referenceImage.size,
              url: URL.createObjectURL(formData.referenceImage) // Store blob URL for thumbnail
            }] : [])
          ],
          parameters: {
            paintingMode: formData.paintingMode,
            textureResolution: formData.textureResolution,
            outputFormat: formData.outputFormat,
            modelPreference: formData.modelPreference
          }
        }
      };

      addTask(task);

      addNotification({
        type: 'success',
        title: 'Painting Started',
        message: `Mesh painting job submitted successfully. Job ID: ${response.job_id}`, 
        duration: 5000,
      });

      setIsPainting(false);
      setUploadProgress(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to paint mesh');
      setIsPainting(false);
      setUploadProgress(0);
      
      addNotification({
        type: 'error',
        title: 'Painting Failed',
        message: err instanceof Error ? err.message : 'Failed to paint mesh texture. Please try again.',
        duration: 5000,
      });
    }
  }, [validateForm, formData, addTask, addNotification, handleInputChange]);

  return (
    <PanelContainer>
      <Header>
        <Title>Mesh Painting</Title>
        <Description>
          Paint textures on existing 3D meshes using text descriptions or reference images.
        </Description>
      </Header>

      <FormSection>
        <Label>3D Mesh Upload (Required)</Label>
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
          acceptedFormats={['.glb', '.obj', '.fbx', '.ply']}
          maxSizeMB={200}
        />
      </FormSection>

      <TabContainer>
        <Tab active={formData.paintingMode === 'text'} onClick={() => handleInputChange('paintingMode', 'text')}>
          Text to Texture
        </Tab>
        <Tab active={formData.paintingMode === 'image'} onClick={() => handleInputChange('paintingMode', 'image')}>
          Image to Texture
        </Tab>
      </TabContainer>

      {formData.paintingMode === 'text' ? (
        <FormSection>
          <Label htmlFor="textPrompt">Texture Description</Label>
          <TextArea
            id="textPrompt"
            placeholder="Describe the texture you want to paint... (e.g., 'Weathered metal with rust stains and scratches')"
            value={formData.textPrompt}
            onChange={(e) => handleInputChange('textPrompt', e.target.value)}
          />
        </FormSection>
      ) : (
        <FormSection>
          <Label>Reference Image</Label>
          {!formData.referenceImage ? (
            <DropZone
              isDragOver={imageDragOver}
              hasFile={!!formData.referenceImage}
              onDragOver={(e) => {
                e.preventDefault();
                setImageDragOver(true);
              }}
              onDragLeave={() => setImageDragOver(false)}
              onDrop={handleImageDrop}
              onClick={() => document.getElementById('imageInput')?.click()}
            >
              <DropZoneText>
                Drag & drop a reference image here, or click to select
              </DropZoneText>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Supported: PNG, JPG, JPEG, WEBP (max 50MB)
              </div>
            </DropZone>
          ) : (
            <ImagePreview
              file={formData.referenceImage}
              onRemove={handleRemoveImage}
            />
          )}
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageSelect}
          />
        </FormSection>
      )}

      <FormSection>
        <Label>Parameters</Label>
        <ParameterGrid>
          <div>
            <Label htmlFor="textureResolution">Texture Resolution</Label>
            <Select
              options={textureResolutionOptions}
              value={formData.textureResolution.toString()}
              onChange={(value) => handleInputChange('textureResolution', parseInt(value))}
              placeholder="Select texture resolution"
            />
          </div>
          <div>
            <Label htmlFor="outputFormat">Output Format</Label>
            <Select
              options={outputFormatOptions}
              value={formData.outputFormat}
              onChange={(value) => handleInputChange('outputFormat', value)}
              placeholder="Select output format"
            />
          </div>
        </ParameterGrid>
      </FormSection>

      <FormSection>
        <PaintButton
          disabled={isPainting || isDownloading}
          onClick={handlePaint}
        >
          {isPainting ? 'Processing...' : isDownloading ? 'Downloading...' : 'Paint Mesh Texture'}
        </PaintButton>
        
        {isPainting && (
          <ProgressBar progress={uploadProgress} />
        )}
        
        {error && (
          <ErrorMessage>{error}</ErrorMessage>
        )}
      </FormSection>
    </PanelContainer>
  );
};

export default MeshPaintingPanel; 