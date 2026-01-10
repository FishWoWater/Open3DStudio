import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiClient } from '../api/client';
import { ModelParametersResponse } from '../types/api';

// Cache to store fetched parameters
const parametersCache = new Map<string, ModelParametersResponse>();

interface UseModelParametersResult {
  parameters: ModelParametersResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch and cache model-specific parameters
 * @param modelId - The model ID to fetch parameters for
 * @returns Object containing parameters, loading state, error, and refetch function
 */
export const useModelParameters = (modelId: string | undefined): UseModelParametersResult => {
  const [parameters, setParameters] = useState<ModelParametersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastModelIdRef = useRef<string | undefined>(undefined);

  const fetchParameters = useCallback(async (id: string) => {
    // Check cache first
    if (parametersCache.has(id)) {
      setParameters(parametersCache.get(id)!);
      setLoading(false);
      setError(null);
      return;
    }

    // Abort previous request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const apiClient = getApiClient();
      const result = await apiClient.getModelParameters(id);
      
      // Cache the result
      parametersCache.set(id, result);
      
      setParameters(result);
      setError(null);
    } catch (err: any) {
      // Handle 404 gracefully - model has no specific parameters
      if (err.status === 404) {
        setParameters(null);
        setError(null);
      } else {
        const errorMessage = err.message || 'Failed to fetch model parameters';
        setError(errorMessage);
        console.error('[useModelParameters] Error fetching parameters:', errorMessage);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const refetch = useCallback(() => {
    if (modelId) {
      // Clear cache for this model
      parametersCache.delete(modelId);
      fetchParameters(modelId);
    }
  }, [modelId, fetchParameters]);

  useEffect(() => {
    // Only fetch if modelId changed
    if (modelId && modelId !== lastModelIdRef.current) {
      lastModelIdRef.current = modelId;
      fetchParameters(modelId);
    } else if (!modelId) {
      // Reset state if no modelId
      setParameters(null);
      setLoading(false);
      setError(null);
      lastModelIdRef.current = undefined;
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [modelId, fetchParameters]);

  return {
    parameters,
    loading,
    error,
    refetch
  };
};
