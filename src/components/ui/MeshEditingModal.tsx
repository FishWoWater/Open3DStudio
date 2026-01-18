import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { Task } from '../../types/state';
import { useStore, useSettings } from '../../store';
import { getApiClient } from '../../api/client';
import { getFullApiUrl } from '../../utils/url';
import MeshEditingViewport from './MeshEditingViewport';
import MeshEditingSidebar from './MeshEditingSidebar';
import MeshFileUploadWithPreview from './MeshFileUploadWithPreview';

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

const UploadContainer = styled.div`
  flex: 1;
  padding: ${props => props.theme.spacing.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background.tertiary};
`;

const UploadPrompt = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
  
  h3 {
    color: ${props => props.theme.colors.text.primary};
    font-size: ${props => props.theme.typography.fontSize.lg};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSize.sm};
  }
`;

const UploadSection = styled.div`
  width: 100%;
  max-width: 500px;
`;

interface MeshEditingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
}

const MeshEditingModal: React.FC<MeshEditingModalProps> = ({ isOpen, onClose, task }) => {
  const { addTask, addNotification } = useStore();
  const settings = useSettings();
  
  // State for mesh upload (when task is null)
  const [uploadedMesh, setUploadedMesh] = useState<File | null>(null);
  const [uploadedMeshId, setUploadedMeshId] = useState<string | null>(null);
  const [meshFormat, setMeshFormat] = useState<string>('glb');
  
  // Get mesh URL - from task or from uploaded file (memoized to prevent recreation)
  const meshUrl = useMemo(() => {
    if (task?.result?.downloadUrl) {
      return getFullApiUrl(task.result.downloadUrl, settings.apiEndpoint) || '';
    }
    if (uploadedMesh) {
      return URL.createObjectURL(uploadedMesh);
    }
    return '';
  }, [task?.result?.downloadUrl, settings.apiEndpoint, uploadedMesh]);
  
  // Cleanup object URL when mesh changes or component unmounts
  useEffect(() => {
    const currentUrl = meshUrl;
    return () => {
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [meshUrl]);
  
  // State for bounding box
  const [bboxCenter, setBboxCenter] = useState<[number, number, number]>([0, 0, 0]);
  const [bboxDimensions, setBboxDimensions] = useState<[number, number, number]>([1, 1, 1]);
  const [bboxInitialized, setBboxInitialized] = useState(false);
  const bboxInitializedRef = useRef(false);
  
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
  
  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUploadedMesh(null);
      setUploadedMeshId(null);
      setBboxInitialized(false);
      bboxInitializedRef.current = false;
    }
  }, [isOpen]);
  
  // When modal opens with a task, upload the task's mesh to get file_id
  useEffect(() => {
    if (!isOpen || !task?.result?.downloadUrl || uploadedMeshId) {
      return;
    }
    
    const uploadTaskMesh = async () => {
      try {
        const apiClient = getApiClient();
        const fullMeshUrl = getFullApiUrl(task.result?.downloadUrl || '', settings.apiEndpoint);
        if (!fullMeshUrl) {
          throw new Error('Invalid mesh URL from task');
        }
        
        const meshResponse = await fetch(fullMeshUrl);
        const meshBlob = await meshResponse.blob();
        const meshFile = new File([meshBlob], 'mesh.glb', { type: 'model/gltf-binary' });
        
        const meshUploadResponse = await apiClient.uploadMeshFile(meshFile);
        setUploadedMeshId(meshUploadResponse.file_id);
      } catch (error) {
        console.error('Failed to upload task mesh:', error);
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: 'Failed to prepare mesh from task for editing',
          duration: 5000
        });
      }
    };
    
    uploadTaskMesh();
  }, [isOpen, task, uploadedMeshId, settings.apiEndpoint, addNotification]);
  
  const handleBBoxInitialized = useCallback((center: [number, number, number], dimensions: [number, number, number]) => {
    // Only initialize if not already initialized
    if (!bboxInitializedRef.current) {
      setBboxCenter(center);
      setBboxDimensions(dimensions);
      setBboxInitialized(true);
      bboxInitializedRef.current = true;
    }
  }, []);
  
  // Reset bbox when mesh URL changes
  useEffect(() => {
    setBboxInitialized(false);
    bboxInitializedRef.current = false;
  }, [meshUrl]);
  
  const handleBBoxChange = useCallback((newCenter: [number, number, number], newDimensions: [number, number, number]) => {
    setBboxCenter(newCenter);
    setBboxDimensions(newDimensions);
  }, []);
  
  const handleMeshUpload = useCallback(async (file: File | null, fileId: string | null) => {
    setUploadedMesh(file);
    setUploadedMeshId(null); // Reset first
    
    if (file) {
      // Extract format from file name
      const extension = file.name.split('.').pop()?.toLowerCase() || 'glb';
      setMeshFormat(extension);
      // Reset bbox when new mesh is uploaded
      setBboxInitialized(false);
      bboxInitializedRef.current = false;
      
      // Upload file immediately to get file_id
      try {
        const apiClient = getApiClient();
        const uploadResponse = await apiClient.uploadMeshFile(file);
        setUploadedMeshId(uploadResponse.file_id);
      } catch (error) {
        console.error('Failed to upload mesh:', error);
        addNotification({
          type: 'error',
          title: 'Upload Failed',
          message: error instanceof Error ? error.message : 'Failed to upload mesh file',
          duration: 5000
        });
        // Clear the mesh since upload failed
        setUploadedMesh(null);
      }
    }
  }, [addNotification]);
  
  const handleSubmit = async () => {
    if (isSubmitting || !meshUrl) return;
    
    // Validate that we have a mesh file_id
    if (!uploadedMeshId) {
      addNotification({
        type: 'warning',
        title: 'Upload Required',
        message: 'Please wait for mesh upload to complete',
        duration: 3000
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const apiClient = getApiClient();
      const meshFileId = uploadedMeshId;
      
      let response;
      let taskName: string;
      
      // Filter out any file input params from advancedParams to avoid conflicts
      // Backend only accepts one type of input per file (path/base64/file_id/upload_file)
      const { 
        mesh_path, mesh_base64, mesh_file_id, upload_file,
        source_image_path, source_image_base64, source_image_file_id,
        target_image_path, target_image_base64, target_image_file_id,
        mask_image_path, mask_image_base64, mask_image_file_id,
        file_store, // Also filter out any internal backend objects
        ...cleanAdvancedParams 
      } = advancedParams || {};
      
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
          ...cleanAdvancedParams
        };
        
        console.log('Text mesh editing request:', request);
        response = await apiClient.textMeshEditing(request);
        taskName = task ? `Edit: ${task.name}` : `Edit: "${targetPrompt.substring(0, 20)}${targetPrompt.length > 20 ? '...' : ''}"`;
      } else {
        // Image-guided mesh editing
        // Upload images
        const sourceImageUpload = await apiClient.uploadImageFile(sourceImage!);
        const targetImageUpload = await apiClient.uploadImageFile(targetImage!);
        let uploadedMaskImageFileId: string | undefined;
        
        if (maskImage) {
          const maskImageUpload = await apiClient.uploadImageFile(maskImage);
          uploadedMaskImageFileId = maskImageUpload.file_id;
        }
        
        const request = {
          mesh_file_id: meshFileId,
          source_image_file_id: sourceImageUpload.file_id,
          target_image_file_id: targetImageUpload.file_id,
          mask_image_file_id: uploadedMaskImageFileId,
          mask_bbox: {
            center: bboxCenter,
            dimensions: bboxDimensions
          },
          num_views: numViews,
          resolution: resolution,
          output_format: 'glb' as const,
          model_preference: selectedModel,
          ...cleanAdvancedParams
        };
        
        console.log('Image mesh editing request:', request);
        response = await apiClient.imageMeshEditing(request);
        taskName = task ? `Edit: ${task.name}` : `Edit: ${sourceImage!.name.substring(0, 15)} → ${targetImage!.name.substring(0, 15)}`;
      }
      
      if (!response.job_id) {
        throw new Error('Failed to start mesh editing job');
      }
      
      // Create task
      const newTask = {
        id: `task-${Date.now()}`,
        jobId: response.job_id,
        type: mode === 'text' ? 'text-mesh-editing' : 'image-mesh-editing',
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
  
  return (
    <ModalOverlay isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {task ? `Mesh Editing - ${task.name}` : 'Mesh Editing'}
          </ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          {/* Show upload UI if no mesh loaded yet */}
          {!meshUrl ? (
            <UploadContainer>
              <UploadPrompt>
                <h3>Upload Mesh for Editing</h3>
                <p>Upload a 3D mesh file to start editing</p>
              </UploadPrompt>
              <UploadSection>
                <MeshFileUploadWithPreview
                  value={uploadedMesh}
                  uploadedMeshId={uploadedMeshId}
                  onChange={handleMeshUpload}
                  acceptedFormats={['.glb', '.obj', '.fbx', '.ply']}
                  maxSizeMB={200}
                  showYUpHint={true}
                />
              </UploadSection>
            </UploadContainer>
          ) : (
            <ViewportContainer>
              <MeshEditingViewport
                meshUrl={meshUrl}
                format={task?.result?.format || meshFormat}
                bboxCenter={bboxCenter}
                bboxDimensions={bboxDimensions}
                onBBoxChange={handleBBoxChange}
                onBBoxInitialized={handleBBoxInitialized}
              />
            </ViewportContainer>
          )}
          
          <MeshEditingSidebar
            mode={mode}
            onModeChange={setMode}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            canSubmit={!!meshUrl}
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
