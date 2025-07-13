import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store';
import { getApiClient } from '../../api/client';
import Select, { SelectOption } from '../ui/Select';
import { TaskType } from '../../types/state';
import { JobStatus, MeshSegmentationRequest } from '../../types/api';

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
  { value: 'json', label: 'JSON (Metadata only)' }
];

const modelPreferenceOptions: SelectOption[] = [
  { value: 'partfield_mesh_segmentation', label: 'PartField (Default)' }
];

const NumberInput = styled.input`
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

const FileInfo = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  margin-top: ${props => props.theme.spacing.sm};
`;

const SegmentButton = styled.button<{ disabled: boolean }>`
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
  numParts: number;
  outputFormat: 'glb' | 'json';
  modelPreference?: string;
}

const MeshSegmentationPanel: React.FC = () => {
  const { addTask, addNotification } = useStore();
  const [formData, setFormData] = useState<FormData>({
    meshFile: null,
    uploadedMeshId: null,
    numParts: 5,
    outputFormat: 'glb',
    modelPreference: 'partfield_mesh_segmentation'
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSegmenting, setIsSegmenting] = useState(false);
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
      return 'Please select a 3D mesh file';
    }
    
    if (formData.meshFile.size > 200 * 1024 * 1024) { // 200MB limit from API docs
      return 'Mesh file must be smaller than 200MB';
    }
    
    if (formData.numParts < 2 || formData.numParts > 32) {
      return 'Number of parts must be between 2 and 32';
    }
    
    return null;
  }, [formData]);

  const handleSegment = useCallback(async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSegmenting(true);
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

      // Create segmentation request
      const request: MeshSegmentationRequest = {
        mesh_file_id: meshFileId,
        num_parts: formData.numParts,
        output_format: formData.outputFormat,
        model_preference: formData.modelPreference
      };

      // Start segmentation job
      const response = await apiClient.segmentMesh(request);

      if (!response.job_id) {
        throw new Error('Failed to start segmentation job');
      }

      setUploadProgress(100); // Complete progress after successful request

      // Create task to track the job
      const task = {
        id: `task-${Date.now()}`,
        jobId: response.job_id,
        type: 'mesh-segmentation' as TaskType,
        name: `Mesh Segmentation: ${formData.meshFile!.name} (${formData.numParts} parts)`,
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
            numParts: formData.numParts,
            outputFormat: formData.outputFormat,
            modelPreference: formData.modelPreference
          }
        }
      };

      addTask(task);

      addNotification({
        type: 'success',
        title: 'Segmentation Started',
        message: `Mesh segmentation job submitted successfully. Job ID: ${response.job_id}`,
        duration: 5000,
      });

      setIsSegmenting(false);
      setUploadProgress(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to segment mesh');
      setIsSegmenting(false);
      setUploadProgress(0);
      
      addNotification({
        type: 'error',
        title: 'Segmentation Failed',
        message: err instanceof Error ? err.message : 'Failed to segment mesh. Please try again.', 
        duration: 5000,
      });
    }
  }, [validateForm, formData, addTask, addNotification, handleInputChange]);

  return (
    <PanelContainer>
      <Header>
        <Title>Mesh Segmentation</Title>
        <Description>
          Automatically segment 3D meshes into meaningful parts using AI algorithms.
        </Description>
      </Header>

      <FormSection>
        <Label>3D Mesh Upload (Required)</Label>
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
              : 'Drag & drop a 3D mesh here, or click to select'
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
        <Label>Number of Parts</Label>
        <NumberInput
          type="number"
          min="2"
          max="32"
          value={formData.numParts}
          onChange={(e) => handleInputChange('numParts', parseInt(e.target.value))}
        />
        <InfoBox>
          Specify how many parts you want the mesh to be segmented into (2-32).
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

      <FormSection>
        <SegmentButton
          disabled={isSegmenting}
          onClick={handleSegment}
        >
          {isSegmenting ? 'Processing...' : 'Segment Mesh'}
        </SegmentButton>
        
        {isSegmenting && (
          <ProgressBar progress={uploadProgress} />
        )}
        
        {error && (
          <ErrorMessage>{error}</ErrorMessage>
        )}
      </FormSection>
    </PanelContainer>
  );
};

export default MeshSegmentationPanel; 