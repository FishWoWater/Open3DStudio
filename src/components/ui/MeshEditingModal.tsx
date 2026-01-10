import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { Task } from '../../types/state';
import { useStore, useSettings } from '../../store';
import { getApiClient } from '../../api/client';
import { getFullApiUrl } from '../../utils/url';
import MeshEditingViewport from './MeshEditingViewport';
import MeshEditingSidebar from './MeshEditingSidebar';

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
  padding: ${props => props.theme.spacing.xl};
`;

const ModalContainer = styled.div`
  width: 90vw;
  height: 85vh;
  max-width: 1400px;
  background: ${props => props.theme.colors.background.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.xl};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
  background: ${props => props.theme.colors.background.secondary};
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  padding: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${props => props.theme.transitions.fast};
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    transform: scale(1.1);
  }
`;

const ModalBody = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const ViewportContainer = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.md};
  overflow: hidden;
`;

interface MeshEditingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

const MeshEditingModal: React.FC<MeshEditingModalProps> = ({ isOpen, onClose, task }) => {
  const { addTask, addNotification } = useStore();
  const settings = useSettings();
  
  // Get mesh URL from task
  const meshUrl = task.result?.downloadUrl ? getFullApiUrl(task.result.downloadUrl, settings.apiEndpoint) : '';
  
  // State for bounding box
  const [bboxCenter, setBboxCenter] = useState<[number, number, number]>([0, 0, 0]);
  const [bboxDimensions, setBboxDimensions] = useState<[number, number, number]>([1, 1, 1]);
  const [bboxInitialized, setBboxInitialized] = useState(false);
  
  // State for editing mode
  const [mode, setMode] = useState<'text' | 'image'>('text');
  
  // State for text mode
  const [sourcePrompt, setSourcePrompt] = useState('');
  const [targetPrompt, setTargetPrompt] = useState('');
  
  // State for image mode
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [maskImage, setMaskImage] = useState<File | null>(null);
  
  // State for common parameters
  const [selectedModel, setSelectedModel] = useState('');
  const [numViews, setNumViews] = useState(150);
  const [resolution, setResolution] = useState(512);
  const [advancedParams, setAdvancedParams] = useState<Record<string, any>>({});
  
  // State for submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchMeshAndCalculateBBox = useCallback(async (url: string) => {
    try {
      // Load mesh and calculate bounding box
      // For simplicity, we'll set a default bbox here
      // In a real implementation, you'd load the mesh and calculate its actual bbox
      setBboxCenter([0, 0, 0]);
      setBboxDimensions([1, 1, 1]);
      setBboxInitialized(true);
    } catch (error) {
      console.error('Error calculating bbox:', error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load mesh for editing',
        duration: 5000
      });
    }
  }, [addNotification]);
  
  // Initialize bbox from mesh URL when modal opens
  useEffect(() => {
    if (isOpen && meshUrl && !bboxInitialized) {
      // Download and calculate bbox
      fetchMeshAndCalculateBBox(meshUrl);
    }
  }, [isOpen, meshUrl, bboxInitialized, fetchMeshAndCalculateBBox]);
  
  const handleBBoxChange = useCallback((newCenter: [number, number, number], newDimensions: [number, number, number]) => {
    setBboxCenter(newCenter);
    setBboxDimensions(newDimensions);
  }, []);
  
  const handleSubmit = async () => {
    if (isSubmitting || !meshUrl) return;
    
    setIsSubmitting(true);
    
    try {
      const apiClient = getApiClient();
      
      // First, upload the mesh to get file_id
      let meshFileId: string;
      
      // Download the mesh and re-upload it
      const meshResponse = await fetch(meshUrl);
      const meshBlob = await meshResponse.blob();
      const meshFile = new File([meshBlob], 'mesh.glb', { type: 'model/gltf-binary' });
      
      const meshUploadResponse = await apiClient.uploadMeshFile(meshFile);
      meshFileId = meshUploadResponse.file_id;
      
      let response;
      let taskName: string;
      
      if (mode === 'text') {
        // Text-guided mesh editing
        const request = {
          mesh_file_id: meshFileId,
          mask_bbox: {
            center: bboxCenter,
            dimensions: bboxDimensions
          },
          source_prompt: sourcePrompt,
          target_prompt: targetPrompt,
          num_views: numViews,
          resolution: resolution,
          output_format: 'glb' as const,
          model_preference: selectedModel,
          ...advancedParams
        };
        
        response = await apiClient.textMeshEditing(request);
        taskName = `Edit: "${targetPrompt.substring(0, 20)}${targetPrompt.length > 20 ? '...' : ''}"`;
      } else {
        // Image-guided mesh editing
        // Upload images
        const sourceImageUpload = await apiClient.uploadImageFile(sourceImage!);
        const targetImageUpload = await apiClient.uploadImageFile(targetImage!);
        let maskImageFileId: string | undefined;
        
        if (maskImage) {
          const maskImageUpload = await apiClient.uploadImageFile(maskImage);
          maskImageFileId = maskImageUpload.file_id;
        }
        
        const request = {
          mesh_file_id: meshFileId,
          source_image_file_id: sourceImageUpload.file_id,
          target_image_file_id: targetImageUpload.file_id,
          mask_image_file_id: maskImageFileId,
          mask_bbox: {
            center: bboxCenter,
            dimensions: bboxDimensions
          },
          num_views: numViews,
          resolution: resolution,
          output_format: 'glb' as const,
          model_preference: selectedModel,
          ...advancedParams
        };
        
        response = await apiClient.imageMeshEditing(request);
        taskName = `Edit: ${sourceImage!.name.substring(0, 15)} → ${targetImage!.name.substring(0, 15)}`;
      }
      
      if (!response.job_id) {
        throw new Error('Failed to start mesh editing job');
      }
      
      // Create task
      const newTask = {
        id: `task-${Date.now()}`,
        jobId: response.job_id,
        type: mode === 'text' ? 'text-mesh-painting' : 'image-mesh-painting',
        name: taskName,
        status: response.status,
        createdAt: new Date(),
        progress: 0,
        inputData: {
          textPrompt: mode === 'text' ? targetPrompt : undefined,
          files: mode === 'image' ? [
            {
              id: `source-${Date.now()}`,
              name: sourceImage!.name,
              type: sourceImage!.type,
              size: sourceImage!.size,
              url: URL.createObjectURL(sourceImage!)
            },
            {
              id: `target-${Date.now()}`,
              name: targetImage!.name,
              type: targetImage!.type,
              size: targetImage!.size,
              url: URL.createObjectURL(targetImage!)
            }
          ] : undefined,
          parameters: {
            mode,
            numViews,
            resolution,
            modelPreference: selectedModel,
            bboxCenter,
            bboxDimensions
          }
        }
      } as any;
      
      addTask(newTask);
      
      addNotification({
        type: 'success',
        title: 'Mesh Editing Started',
        message: `Job submitted successfully. Job ID: ${response.job_id}`,
        duration: 5000
      });
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error submitting mesh editing job:', error);
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit mesh editing job',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!meshUrl) {
    return null;
  }
  
  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Mesh Editing - {task.name}</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <ViewportContainer>
            <MeshEditingViewport
              meshUrl={meshUrl}
              format={task.result?.format}
              bboxCenter={bboxCenter}
              bboxDimensions={bboxDimensions}
              onBBoxChange={handleBBoxChange}
            />
          </ViewportContainer>
          
          <MeshEditingSidebar
            mode={mode}
            onModeChange={setMode}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            sourcePrompt={sourcePrompt}
            targetPrompt={targetPrompt}
            onSourcePromptChange={setSourcePrompt}
            onTargetPromptChange={setTargetPrompt}
            sourceImage={sourceImage}
            targetImage={targetImage}
            maskImage={maskImage}
            onSourceImageChange={setSourceImage}
            onTargetImageChange={setTargetImage}
            onMaskImageChange={setMaskImage}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            numViews={numViews}
            resolution={resolution}
            onNumViewsChange={setNumViews}
            onResolutionChange={setResolution}
            advancedParams={advancedParams}
            onAdvancedParamsChange={setAdvancedParams}
          />
        </ModalBody>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default MeshEditingModal;
