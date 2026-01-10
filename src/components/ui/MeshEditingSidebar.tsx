import React, { useState, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import Select, { SelectOption } from './Select';
import ImagePreview from './ImagePreview';
import AdvancedParameters from './AdvancedParameters';
import { useModelParameters } from '../../hooks/useModelParameters';
import { useFeatureAvailability } from '../../hooks/useFeatureAvailability';
import { cleanModelName } from '../../utils/modelNames';

const SidebarContainer = styled.div`
  width: 320px;
  height: 100%;
  background: ${props => props.theme.colors.background.secondary};
  border-left: 1px solid ${props => props.theme.colors.border.default};
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const SidebarContent = styled.div`
  padding: ${props => props.theme.spacing.md};
  flex: 1;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  background: none;
  border: none;
  padding: ${props => props.theme.spacing.sm};
  color: ${props => props.active ? props.theme.colors.primary[500] : props.theme.colors.text.secondary};
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary[500] : 'transparent'};
  cursor: pointer;
  font-weight: ${props => props.active ? props.theme.typography.fontWeight.medium : props.theme.typography.fontWeight.normal};
  font-size: ${props => props.theme.typography.fontSize.sm};
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
  padding: ${props => props.theme.spacing.lg};
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
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const SubmitButton = styled.button<{ disabled: boolean }>`
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

const InfoBox = styled.div`
  color: ${props => props.theme.colors.primary[400]};
  background: ${props => `${props.theme.colors.primary[500]}15`};
  border: 1px solid ${props => `${props.theme.colors.primary[500]}30`};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-top: ${props => props.theme.spacing.sm};
`;

interface MeshEditingSidebarProps {
  mode: 'text' | 'image';
  onModeChange: (mode: 'text' | 'image') => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  // Text mode props
  sourcePrompt: string;
  targetPrompt: string;
  onSourcePromptChange: (value: string) => void;
  onTargetPromptChange: (value: string) => void;
  // Image mode props
  sourceImage: File | null;
  targetImage: File | null;
  maskImage: File | null;
  onSourceImageChange: (file: File | null) => void;
  onTargetImageChange: (file: File | null) => void;
  onMaskImageChange: (file: File | null) => void;
  // Common props
  selectedModel: string;
  onModelChange: (model: string) => void;
  numViews: number;
  resolution: number;
  onNumViewsChange: (value: number) => void;
  onResolutionChange: (value: number) => void;
  advancedParams: Record<string, any>;
  onAdvancedParamsChange: (params: Record<string, any>) => void;
}

const MeshEditingSidebar: React.FC<MeshEditingSidebarProps> = ({
  mode,
  onModeChange,
  onSubmit,
  isSubmitting,
  sourcePrompt,
  targetPrompt,
  onSourcePromptChange,
  onTargetPromptChange,
  sourceImage,
  targetImage,
  maskImage,
  onSourceImageChange,
  onTargetImageChange,
  onMaskImageChange,
  selectedModel,
  onModelChange,
  numViews,
  resolution,
  onNumViewsChange,
  onResolutionChange,
  advancedParams,
  onAdvancedParamsChange
}) => {
  const [sourceDragOver, setSourceDragOver] = useState(false);
  const [targetDragOver, setTargetDragOver] = useState(false);
  const [maskDragOver, setMaskDragOver] = useState(false);

  // Fetch available models for mesh editing
  const { getModelsForFeature } = useFeatureAvailability();
  const availableModels = useMemo(() => {
    const featureName = mode === 'text' ? 'text-mesh-editing' : 'image-mesh-editing';
    return getModelsForFeature(featureName);
  }, [mode, getModelsForFeature]);

  // Fetch model-specific parameters
  const { parameters: modelParameters } = useModelParameters(selectedModel);

  // Update selectedModel when available models change
  useEffect(() => {
    if (availableModels.length > 0 && !selectedModel) {
      onModelChange(availableModels[0]);
    }
  }, [availableModels, selectedModel, onModelChange]);

  // Model options
  const modelOptions: SelectOption[] = useMemo(() => {
    if (availableModels.length === 0) {
      return [{ value: '', label: 'No models available' }];
    }
    return availableModels.map(model => ({
      value: model,
      label: cleanModelName(model).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }));
  }, [availableModels]);

  // Number of views options
  const numViewsOptions: SelectOption[] = [
    { value: '50', label: '50 views' },
    { value: '100', label: '100 views' },
    { value: '150', label: '150 views (default)' },
    { value: '200', label: '200 views' },
    { value: '300', label: '300 views' }
  ];

  // Resolution options
  const resolutionOptions: SelectOption[] = [
    { value: '256', label: '256' },
    { value: '512', label: '512 (default)' },
    { value: '768', label: '768' },
    { value: '1024', label: '1024' }
  ];

  const handleFileDrop = (e: React.DragEvent, type: 'source' | 'target' | 'mask') => {
    e.preventDefault();
    if (type === 'source') setSourceDragOver(false);
    else if (type === 'target') setTargetDragOver(false);
    else setMaskDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      if (type === 'source') onSourceImageChange(imageFile);
      else if (type === 'target') onTargetImageChange(imageFile);
      else onMaskImageChange(imageFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'source' | 'target' | 'mask') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'source') onSourceImageChange(file);
      else if (type === 'target') onTargetImageChange(file);
      else onMaskImageChange(file);
    }
  };

  const canSubmit = () => {
    if (mode === 'text') {
      return sourcePrompt.trim() && targetPrompt.trim() && selectedModel && !isSubmitting;
    } else {
      return sourceImage && targetImage && selectedModel && !isSubmitting;
    }
  };

  return (
    <SidebarContainer>
      <SidebarContent>
        {/* Mode Selector */}
        <TabContainer>
          <Tab active={mode === 'text'} onClick={() => onModeChange('text')}>
            Text-Guided
          </Tab>
          <Tab active={mode === 'image'} onClick={() => onModeChange('image')}>
            Image-Guided
          </Tab>
        </TabContainer>

        {/* Model Selector */}
        <FormSection>
          <Label>Model</Label>
          <Select
            options={modelOptions}
            value={selectedModel}
            onChange={onModelChange}
            placeholder="Select model"
          />
        </FormSection>

        {/* Text Mode Inputs */}
        {mode === 'text' && (
          <>
            <FormSection>
              <Label htmlFor="sourcePrompt">Source Prompt</Label>
              <TextArea
                id="sourcePrompt"
                placeholder="Describe the current appearance of the region..."
                value={sourcePrompt}
                onChange={(e) => onSourcePromptChange(e.target.value)}
              />
              <InfoBox>
                Describe what the current mesh region looks like
              </InfoBox>
            </FormSection>

            <FormSection>
              <Label htmlFor="targetPrompt">Target Prompt</Label>
              <TextArea
                id="targetPrompt"
                placeholder="Describe the desired appearance..."
                value={targetPrompt}
                onChange={(e) => onTargetPromptChange(e.target.value)}
              />
              <InfoBox>
                Describe how you want the region to look after editing
              </InfoBox>
            </FormSection>
          </>
        )}

        {/* Image Mode Inputs */}
        {mode === 'image' && (
          <>
            <FormSection>
              <Label>Source Image</Label>
              {!sourceImage ? (
                <>
                  <DropZone
                    isDragOver={sourceDragOver}
                    hasFile={!!sourceImage}
                    onDragOver={(e) => { e.preventDefault(); setSourceDragOver(true); }}
                    onDragLeave={() => setSourceDragOver(false)}
                    onDrop={(e) => handleFileDrop(e, 'source')}
                    onClick={() => document.getElementById('sourceImageInput')?.click()}
                  >
                    <DropZoneText>Drop source image or click to select</DropZoneText>
                    <div style={{ fontSize: '11px', color: '#888' }}>PNG, JPG, WEBP</div>
                  </DropZone>
                  <input
                    id="sourceImageInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, 'source')}
                  />
                </>
              ) : (
                <ImagePreview file={sourceImage} onRemove={() => onSourceImageChange(null)} />
              )}
              <InfoBox>Reference image showing original appearance</InfoBox>
            </FormSection>

            <FormSection>
              <Label>Target Image</Label>
              {!targetImage ? (
                <>
                  <DropZone
                    isDragOver={targetDragOver}
                    hasFile={!!targetImage}
                    onDragOver={(e) => { e.preventDefault(); setTargetDragOver(true); }}
                    onDragLeave={() => setTargetDragOver(false)}
                    onDrop={(e) => handleFileDrop(e, 'target')}
                    onClick={() => document.getElementById('targetImageInput')?.click()}
                  >
                    <DropZoneText>Drop target image or click to select</DropZoneText>
                    <div style={{ fontSize: '11px', color: '#888' }}>PNG, JPG, WEBP</div>
                  </DropZone>
                  <input
                    id="targetImageInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, 'target')}
                  />
                </>
              ) : (
                <ImagePreview file={targetImage} onRemove={() => onTargetImageChange(null)} />
              )}
              <InfoBox>Reference image showing desired appearance</InfoBox>
            </FormSection>

            <FormSection>
              <Label>Mask Image (Optional)</Label>
              {!maskImage ? (
                <>
                  <DropZone
                    isDragOver={maskDragOver}
                    hasFile={!!maskImage}
                    onDragOver={(e) => { e.preventDefault(); setMaskDragOver(true); }}
                    onDragLeave={() => setMaskDragOver(false)}
                    onDrop={(e) => handleFileDrop(e, 'mask')}
                    onClick={() => document.getElementById('maskImageInput')?.click()}
                  >
                    <DropZoneText>Drop mask image or click to select</DropZoneText>
                    <div style={{ fontSize: '11px', color: '#888' }}>PNG, JPG, WEBP</div>
                  </DropZone>
                  <input
                    id="maskImageInput"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileSelect(e, 'mask')}
                  />
                </>
              ) : (
                <ImagePreview file={maskImage} onRemove={() => onMaskImageChange(null)} />
              )}
              <InfoBox>Optional 2D mask to refine the editing region</InfoBox>
            </FormSection>
          </>
        )}

        {/* Common Parameters */}
        <FormSection>
          <Label>Number of Views</Label>
          <Select
            options={numViewsOptions}
            value={numViews.toString()}
            onChange={(value) => onNumViewsChange(parseInt(value))}
            placeholder="Select number of views"
          />
        </FormSection>

        <FormSection>
          <Label>Resolution</Label>
          <Select
            options={resolutionOptions}
            value={resolution.toString()}
            onChange={(value) => onResolutionChange(parseInt(value))}
            placeholder="Select resolution"
          />
        </FormSection>

        {/* Advanced Parameters */}
        {selectedModel && modelParameters && (
          <AdvancedParameters
            parameters={modelParameters.schema.parameters}
            values={advancedParams}
            onChange={onAdvancedParamsChange}
          />
        )}

        {/* Submit Button */}
        <FormSection>
          <SubmitButton disabled={!canSubmit()} onClick={onSubmit}>
            {isSubmitting ? 'Submitting...' : 'Start Mesh Editing'}
          </SubmitButton>
        </FormSection>
      </SidebarContent>
    </SidebarContainer>
  );
};

export default MeshEditingSidebar;
