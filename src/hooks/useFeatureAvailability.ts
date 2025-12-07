import { useState, useEffect, useCallback } from 'react';
import { getApiClient } from '../api/client';
import { FeatureInfo, AvailableModels } from '../types/api';

export interface FeatureAvailability {
  [featureName: string]: {
    available: boolean;
    models: string[];
    error?: string;
  };
}

export interface UseFeatureAvailabilityReturn {
  features: FeatureAvailability;
  loading: boolean;
  error: string | null;
  checkFeature: (featureName: string) => boolean;
  getModelsForFeature: (featureName: string) => string[];
  refetch: () => Promise<void>;
}

const FEATURE_NAME_MAPPING: Record<string, string> = {
  'text-to-mesh': 'text_to_mesh',
  'image-to-mesh': 'image_to_mesh', 
  'text-to-raw-mesh': 'text_to_raw_mesh',
  'text-to-textured-mesh': 'text_to_textured_mesh',
  'image-to-raw-mesh': 'image_to_raw_mesh',
  'image-to-textured-mesh': 'image_to_textured_mesh',
  'mesh-painting': 'mesh_painting',
  'text-mesh-painting': 'text_mesh_painting',
  'image-mesh-painting': 'image_mesh_painting',
  'mesh-segmentation': 'mesh_segmentation',
  'auto-rigging': 'auto_rigging',
  'part-completion': 'part_completion'
};

export const useFeatureAvailability = (): UseFeatureAvailabilityReturn => {
  const [features, setFeatures] = useState<FeatureAvailability>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatureAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const apiClient = getApiClient();
      
      // Get available features and models in parallel
      const [featuresResponse, modelsResponse] = await Promise.all([
        apiClient.getAvailableFeatures(),
        apiClient.getAvailableModels()
      ]);

      // Build feature availability map
      const featureAvailability: FeatureAvailability = {};

      // Initialize all known features as unavailable
      Object.keys(FEATURE_NAME_MAPPING).forEach(key => {
        featureAvailability[key] = {
          available: false,
          models: [],
          error: 'Feature not available'
        };
      });

      // Update with actual available features
      if (featuresResponse.features) {
        featuresResponse.features.forEach((feature: FeatureInfo) => {
          // Find the UI feature name that maps to this API feature
          const uiFeatureName = Object.keys(FEATURE_NAME_MAPPING).find(
            key => FEATURE_NAME_MAPPING[key] === feature.name
          );

          if (uiFeatureName) {
            featureAvailability[uiFeatureName] = {
              available: feature.model_count > 0,
              models: feature.models || [],
              error: feature.model_count === 0 ? 'No models available for this feature' : undefined
            };
          }
        });
      }

      // Also check models response for additional feature info
      if (modelsResponse.available_models) {
        Object.entries(modelsResponse.available_models).forEach(([apiFeatureName, models]) => {
          const uiFeatureName = Object.keys(FEATURE_NAME_MAPPING).find(
            key => FEATURE_NAME_MAPPING[key] === apiFeatureName
          );

          if (uiFeatureName && Array.isArray(models)) {
            // Merge with existing data
            const existing = featureAvailability[uiFeatureName] || { available: false, models: [] };
            featureAvailability[uiFeatureName] = {
              available: models.length > 0,
              models: Array.from(new Set([...existing.models, ...models])), // Deduplicate
              error: models.length === 0 ? 'No models available for this feature' : undefined
            };
          }
        });
      }

      setFeatures(featureAvailability);
      console.log('[FeatureAvailability] Loaded features:', featureAvailability);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check feature availability';
      setError(errorMessage);
      console.error('[FeatureAvailability] Error:', err);
      
      // Set all features as unavailable with error
      const errorFeatures: FeatureAvailability = {};
      Object.keys(FEATURE_NAME_MAPPING).forEach(key => {
        errorFeatures[key] = {
          available: false,
          models: [],
          error: errorMessage
        };
      });
      setFeatures(errorFeatures);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkFeature = useCallback((featureName: string): boolean => {
    return features[featureName]?.available || false;
  }, [features]);

  const getModelsForFeature = useCallback((featureName: string): string[] => {
    return features[featureName]?.models || [];
  }, [features]);

  const refetch = useCallback(async () => {
    await fetchFeatureAvailability();
  }, [fetchFeatureAvailability]);

  useEffect(() => {
    fetchFeatureAvailability();
  }, [fetchFeatureAvailability]);

  return {
    features,
    loading,
    error,
    checkFeature,
    getModelsForFeature,
    refetch
  };
}; 