import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store';
import { getApiClient } from '../../api/client';
import ImagePreview from '../ui/ImagePreview';
import Select, { SelectOption } from '../ui/Select';
import { useFeatureAvailability } from '../../hooks/useFeatureAvailability';
import { TaskType } from '../../types/state';
import { JobStatus, TextToMeshRequest, TextToTexturedMeshRequest, ImageToMeshRequest, ImageToTexturedMeshRequest } from '../../types/api';
import { cleanModelName, isPartPackerAvailable } from '../../utils/modelNames';

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

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Checkbox = styled.input`
  accent-color: ${props => props.theme.colors.primary[500]};
`;

const CheckboxLabel = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
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

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
`;

const GenerateButton = styled.button<{ disabled: boolean }>`
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

const WarningBox = styled.div`
  color: ${props => props.theme.colors.warning};
  background: ${props => `${props.theme.colors.warning}15`};
  border: 1px solid ${props => `${props.theme.colors.warning}30`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const InfoBox = styled.div`
  color: ${props => props.theme.colors.primary[400]};
  background: ${props => `${props.theme.colors.primary[500]}15`};
  border: 1px solid ${props => `${props.theme.colors.primary[500]}30`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
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

type GenerationMode = 'text' | 'image';

interface FormData {
  // Text-to-mesh
  textPrompt: string;
  texturePrompt: string;
  // Image-to-mesh
  imageFile: File | null;
  uploadedImageId: string | null;
  // Common parameters
  outputFormat: 'glb' | 'obj' | 'fbx' | 'ply';
  textureResolution: number;
  enableTexture: boolean;
  modelPreference?: string;
}

// Select options
const outputFormatOptions: SelectOption[] = [
  { value: 'glb', label: 'GLB' },
  { value: 'obj', label: 'OBJ' },
  { value: 'fbx', label: 'FBX' },
  { value: 'ply', label: 'PLY' }
];

const textureResolutionOptions: SelectOption[] = [
  { value: '512', label: '512x512' },
  { value: '1024', label: '1024x1024' },
  { value: '2048', label: '2048x2048' },
  { value: '4096', label: '4096x4096' }
];

const MeshGenerationPanel: React.FC = () => {
  const { addTask, addNotification } = useStore();
  const { features, loading: featuresLoading, checkFeature, getModelsForFeature, refetch } = useFeatureAvailability();
  const [mode, setMode] = useState<GenerationMode>('text');
  const [formData, setFormData] = useState<FormData>({
    textPrompt: '',
    texturePrompt: '',
    imageFile: null,
    uploadedImageId: null,
    outputFormat: 'glb',
    textureResolution: 1024,
    enableTexture: true,
    modelPreference: '' // Will be set based on available models
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to store uploaded file ID persistently across renders
  const uploadedImageIdRef = React.useRef<string | null>(null);
  const currentImageFileRef = React.useRef<File | null>(null);

  // Get feature availability status
  const textToMeshAvailable = checkFeature(formData.enableTexture ? 'text-to-textured-mesh' : 'text-to-raw-mesh');
  const imageToMeshAvailable = checkFeature(formData.enableTexture ? 'image-to-textured-mesh' : 'image-to-raw-mesh');
  const currentFeatureAvailable = mode === 'text' ? textToMeshAvailable : imageToMeshAvailable;

  // Get available models for current feature  
  const availableModels = useMemo(() => {
    const featureName = mode === 'text' ? (formData.enableTexture ? 'text-to-textured-mesh' : 'text-to-raw-mesh') : (formData.enableTexture ? 'image-to-textured-mesh' : 'image-to-raw-mesh');
    return getModelsForFeature(featureName);
  }, [mode, getModelsForFeature]);

  // Check for PartPacker availability
  const partPackerAvailable = useMemo(() => {
    return isPartPackerAvailable(availableModels);
  }, [availableModels]);

  // Dynamic model preference options
  const modelPreferenceOptions: SelectOption[] = useMemo(() => {
    if (availableModels.length === 0) {
      return [{ value: '', label: 'No models available' }];
    }
    return availableModels.map(model => ({
      value: model,
      label: cleanModelName(model).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  }, [availableModels]);

  // Update model preference when available models change
  React.useEffect(() => {
    if (availableModels.length > 0 && !formData.modelPreference) {
      handleInputChange('modelPreference', availableModels[0]);
    }
  }, [availableModels, formData.modelPreference]);

  // Refetch models when mode or enableTexture changes
  React.useEffect(() => {
    refetch();
  }, [mode, formData.enableTexture, refetch]);

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleInputChange('imageFile', imageFile);
      handleInputChange('uploadedImageId', null); // Reset uploaded ID
      uploadedImageIdRef.current = null; // Reset ref
      currentImageFileRef.current = imageFile;
    } else {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP)');
    }
  }, [handleInputChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('imageFile', file);
      handleInputChange('uploadedImageId', null); // Reset uploaded ID
      uploadedImageIdRef.current = null; // Reset ref
      currentImageFileRef.current = file;
    }
  }, [handleInputChange]);

  const handleRemoveImage = useCallback(() => {
    handleInputChange('imageFile', null);
    handleInputChange('uploadedImageId', null);
    uploadedImageIdRef.current = null; // Reset ref
    currentImageFileRef.current = null;
  }, [handleInputChange]);

  const validateForm = useCallback((): string | null => {
    let errorMessage: string | null = null;
    
    if (mode === 'text') {
      if (!formData.textPrompt.trim()) {
        errorMessage = 'Please enter a text prompt';
      } else if (formData.textPrompt.length < 3) {
        errorMessage = 'Text prompt must be at least 3 characters long';
      }
    } else {
      if (!formData.imageFile) {
        errorMessage = 'Please select an image file';
      } else if (!formData.imageFile.type.startsWith('image/')) {
        errorMessage = 'Please select a valid image file';
      } else if (formData.imageFile.size > 50 * 1024 * 1024) { // 50MB limit from API docs
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
  }, [mode, formData, addNotification]);

  const handleGenerate = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsGenerating(true);
    setUploadProgress(0);
    setError(null);

    try {
      const apiClient = getApiClient();
      let response;
      let taskName: string;
      let taskType: TaskType;

      if (mode === 'text') {
        taskName = `"${formData.textPrompt.substring(0, 20)}${formData.textPrompt.length > 20 ? '...' : ''}"`;
        // taskName = `Text to Mesh`;

        if (formData.enableTexture) {
          // Text to textured mesh
          const request: TextToTexturedMeshRequest = {
            text_prompt: formData.textPrompt,
            texture_prompt: formData.texturePrompt,
            texture_resolution: formData.textureResolution,
            output_format: formData.outputFormat,
            model_preference: formData.modelPreference || availableModels[0]
          };
          console.log('[DEBUG] Text to textured mesh request:', request);
          response = await apiClient.textToTexturedMesh(request);
          taskType = 'text-to-mesh' as TaskType;
        } else {
          // Text to raw mesh
          const request: TextToMeshRequest = {
            text_prompt: formData.textPrompt,
            output_format: formData.outputFormat,
            model_preference: formData.modelPreference || availableModels[0]
          };
          console.log('[DEBUG] Text to raw mesh request:', request);
          response = await apiClient.textToRawMesh(request);
          taskType = 'text-to-mesh' as TaskType;
        }
      } else {
        // Image to mesh - NEW WORKFLOW: Upload file first, then use file_id
        taskName = `${formData.imageFile!.name.substring(0, 15)}`;
        
        // Check if we have a cached file ID for the current image file
        let imageFileId = uploadedImageIdRef.current;
        // Compare files by properties instead of reference to handle file object recreation
        const isSameFile = currentImageFileRef.current && formData.imageFile &&
          currentImageFileRef.current.name === formData.imageFile.name &&
          currentImageFileRef.current.size === formData.imageFile.size &&
          currentImageFileRef.current.lastModified === formData.imageFile.lastModified;
        
        // Upload image if not already uploaded or if file changed
        if (!imageFileId || !isSameFile) {
          const uploadResponse = await apiClient.uploadImageFile(
            formData.imageFile!,
            (progress) => setUploadProgress(progress * 0.5) // Use 50% of progress for upload
          );
          imageFileId = uploadResponse.file_id;
          uploadedImageIdRef.current = imageFileId; // Store in ref for immediate reuse
          currentImageFileRef.current = formData.imageFile;
          handleInputChange('uploadedImageId', imageFileId); // Also update state for UI
        }

        if (formData.enableTexture) {
          console.log("[Debug] using ImageFileID in image2textured-mesh", imageFileId);
          // Image to textured mesh
          const request: ImageToTexturedMeshRequest = {
            image_file_id: imageFileId,
            texture_resolution: formData.textureResolution,
            output_format: formData.outputFormat,
            model_preference: formData.modelPreference || availableModels[0]
          };
          console.log('[DEBUG] Image to textured mesh request:', request);
          response = await apiClient.imageToTexturedMesh(request);
          taskType = 'image-to-mesh' as TaskType;
        } else {
          console.log("[Debug] using ImageFileID in image2raw-mesh", imageFileId);
          // Image to raw mesh
          const request: ImageToMeshRequest = {
            image_file_id: imageFileId,
            output_format: formData.outputFormat,
            model_preference: formData.modelPreference || availableModels[0]
          };
          // console.log('[DEBUG] Image to raw mesh request:', request);
          response = await apiClient.imageToRawMesh(request);
          taskType = 'image-to-mesh' as TaskType;
        }
        
        setUploadProgress(100); // Complete progress after successful request
      }

      if (!response.job_id) {
        throw new Error('Failed to start mesh generation job');
      }

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
          texturePrompt: formData.texturePrompt,
          files: formData.imageFile ? [{
            id: formData.uploadedImageId || `file-${Date.now()}`,
            name: formData.imageFile.name,
            type: formData.imageFile.type,
            size: formData.imageFile.size,
            url: URL.createObjectURL(formData.imageFile) // Store blob URL for thumbnail
          }] : undefined,
          parameters: {
            mode,
            outputFormat: formData.outputFormat,
            textureResolution: formData.textureResolution,
            enableTexture: formData.enableTexture,
            modelPreference: formData.modelPreference
          }
        }
      };

      addTask(task);

      addNotification({
        type: 'success',
        title: 'Generation Started',
        message: `Mesh generation job submitted successfully. Job ID: ${response.job_id}`,
        duration: 5000,
      });

      setIsGenerating(false);
      setUploadProgress(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate mesh');
      setIsGenerating(false);
      setUploadProgress(0);
      
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: err instanceof Error ? err.message : 'Failed to generate 3D mesh. Please try again.', 
        duration: 5000,
      });
    }
  }, [validateForm, mode, formData, addTask, addNotification, handleInputChange]);

  return (
    <PanelContainer>
      <Header>
        <Title>Mesh Generation</Title>
        <Description>
          Generate 3D meshes from text descriptions or images using AI-powered tools.
        </Description>
      </Header>

      <TabContainer>
        <Tab active={mode === 'text'} onClick={() => setMode('text')}>
          Text to Mesh
        </Tab>
        <Tab active={mode === 'image'} onClick={() => setMode('image')}>
          Image to Mesh
        </Tab>
      </TabContainer>

      {mode === 'text' ? (
        <>
          <FormSection>
            <Label htmlFor="textPrompt">Text Prompt</Label>
            <TextArea
              id="textPrompt"
              placeholder="Describe the 3D object you want to generate... (e.g., 'A red sports car with sleek curves')"
              value={formData.textPrompt}
              onChange={(e) => handleInputChange('textPrompt', e.target.value)}
            />
          </FormSection>

          {formData.enableTexture && (
            <FormSection>
              <Label htmlFor="texturePrompt">Texture Prompt (Optional)</Label>
              <TextInput
                id="texturePrompt"
                placeholder="Describe the texture/material..."
                value={formData.texturePrompt}
                onChange={(e) => handleInputChange('texturePrompt', e.target.value)}
              />
            </FormSection>
          )}
        </>
      ) : (
        <FormSection>
          <Label>Image Upload</Label>
          {!formData.imageFile ? (
            <DropZone
              isDragOver={isDragOver}
              hasFile={!!formData.imageFile}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('imageInput')?.click()}
            >
              <DropZoneText>
                Drag & drop an image here, or click to select
              </DropZoneText>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Supported: PNG, JPG, JPEG, WEBP (max 50MB)
              </div>
            </DropZone>
          ) : (
            <ImagePreview
              file={formData.imageFile}
              onRemove={handleRemoveImage}
            />
          )}
          <input
            id="imageInput"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </FormSection>
      )}

      <FormSection>
        <CheckboxContainer>
          <Checkbox
            id="enableTexture"
            type="checkbox"
            checked={formData.enableTexture}
            onChange={(e) => handleInputChange('enableTexture', e.target.checked)}
          />
          <CheckboxLabel htmlFor="enableTexture">
            Generate with texture/material
          </CheckboxLabel>
        </CheckboxContainer>
      </FormSection>

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
          {formData.enableTexture && (
            <div>
              <Label htmlFor="textureResolution">Texture Resolution</Label>
              <Select
                options={textureResolutionOptions}
                value={formData.textureResolution.toString()}
                onChange={(value) => handleInputChange('textureResolution', parseInt(value))}
                placeholder="Select texture resolution"
              />
            </div>
          )}
        </ParameterGrid>
      </FormSection>

      {featuresLoading && (
        <FormSection>
          <WarningBox>
            <LoadingSpinner />
            Checking feature availability...
          </WarningBox>
        </FormSection>
      )}

      {!featuresLoading && !currentFeatureAvailable && (
        <FormSection>
          <WarningBox>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            {mode === 'text' ? 'Text-to-mesh' : 'Image-to-mesh'} feature is currently unavailable. 
            {features[mode === 'text' ? 'text-to-mesh' : 'image-to-mesh']?.error && (
              <> Reason: {features[mode === 'text' ? 'text-to-mesh' : 'image-to-mesh']?.error}</>
            )}
          </WarningBox>
        </FormSection>
      )}

      {!featuresLoading && currentFeatureAvailable && partPackerAvailable && (
        <FormSection>
          <InfoBox>
            <span style={{ fontSize: '16px' }}>✨</span>
            PartPacker model is available! It supports Part-Level mesh generation.
          </InfoBox>
        </FormSection>
      )}

      {!featuresLoading && currentFeatureAvailable && availableModels.length > 0 && (
        <FormSection>
          <Label>Model Preference</Label>
          <Select
            options={modelPreferenceOptions}
            value={formData.modelPreference}
            onChange={(value) => handleInputChange('modelPreference', value)}
            placeholder="Select model"
          />
        </FormSection>
      )}

      <FormSection>
        <GenerateButton
          disabled={isGenerating || !currentFeatureAvailable || availableModels.length === 0}
          onClick={handleGenerate}
        >
          {isGenerating ? 'Processing...' : 
           !currentFeatureAvailable ? 'Feature Unavailable' :
           availableModels.length === 0 ? 'No Models Available' :
           'Generate 3D Mesh'}
        </GenerateButton>
        
        {isGenerating && (
          <ProgressBar progress={uploadProgress} />
        )}
        
        {error && (
          <ErrorMessage>{error}</ErrorMessage>
        )}
      </FormSection>
    </PanelContainer>
  );
};

export default MeshGenerationPanel; 