import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  ApiConfig, 
  BaseApiResponse, 
  HealthStatus,
  SystemStatus,
  SchedulerStatus,
  AvailableModels,
  FeaturesResponse,
  JobInfo,
  JobResultInfo,
  JobsHistoryResponse,
  JobsHistoryParams,
  TextToMeshRequest,
  TextToTexturedMeshRequest,
  ImageToMeshRequest,
  ImageToTexturedMeshRequest,
  MeshPaintingRequest,
  PartCompletionRequest,
  MeshSegmentationRequest,
  AutoRiggingRequest,
  FileUploadResponse,
  FileMetadata,
  SupportedFormats,
  ApiError
} from '../types/api';

class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        const apiError = this.handleError(error);
        console.error('[API] Response error:', apiError);
        return Promise.reject(apiError);
      }
    );
  }

  private handleError(error: AxiosError): ApiError {
    const apiError = new Error() as ApiError;
    
    if (error.response) {
      // Server responded with error status
      const errorData = error.response.data as any; // Use any to handle different error response formats
      
      // Extract error message with priority: detail > message > default
      let errorMessage = 'An error occurred';
      let errorCode = 'API_ERROR';
      
      if (errorData) {
        // Handle FastAPI style errors with detail field
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        // Extract error code
        if (errorData.error) {
          errorCode = errorData.error;
        } else if (errorData.code) {
          errorCode = errorData.code;
        }
      }
      
      // Fallback to HTTP status text if no detailed message
      if (errorMessage === 'An error occurred' && error.response.statusText) {
        errorMessage = `${error.response.status} ${error.response.statusText}`;
      }
      
      apiError.message = errorMessage;
      apiError.code = errorCode;
      apiError.status = error.response.status;
      apiError.response = errorData;
    } else if (error.request) {
      // Request was made but no response received
      apiError.message = 'No response from server. Please check your internet connection and try again.';
      apiError.code = 'NETWORK_ERROR';
    } else {
      // Something else happened
      apiError.message = error.message || 'Unknown error occurred';
      apiError.code = 'UNKNOWN_ERROR';
    }

    return apiError;
  }

  private async retry<T>(
    operation: () => Promise<T>,
    retries: number = this.config.retries || 2
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        console.log(`[API] Retrying... ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.retry(operation, retries - 1);
      }
      throw error;
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<ApiConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Update base URL if changed
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = newConfig.baseURL;
    }
    
    // Update auth header if API key changed
    if (newConfig.apiKey !== undefined) {
      if (newConfig.apiKey) {
        this.client.defaults.headers['Authorization'] = `Bearer ${newConfig.apiKey}`;
      } else {
        delete this.client.defaults.headers['Authorization'];
      }
    }
  }

  // System Management Endpoints
  async getHealthStatus(): Promise<HealthStatus> {
    const response = await this.retry(() => 
      this.client.get<HealthStatus>('/health')
    );
    return response.data;
  }

  async getSystemStatus(): Promise<SystemStatus> {
    const response = await this.retry(() => 
      this.client.get<SystemStatus>('/api/v1/system/status')
    );
    return response.data;
  }

  async getSchedulerStatus(): Promise<SchedulerStatus> {
    const response = await this.retry(() => 
      this.client.get<SchedulerStatus>('/api/v1/system/scheduler-status')
    );
    return response.data;
  }

  async getAvailableModels(feature?: string): Promise<AvailableModels> {
    const params = feature ? { feature } : {};
    const response = await this.retry(() => 
      this.client.get<AvailableModels>('/api/v1/system/models', { params })
    );
    return response.data;
  }

  async getAvailableFeatures(): Promise<FeaturesResponse> {
    const response = await this.retry(() => 
      this.client.get<FeaturesResponse>('/api/v1/system/features')
    );
    return response.data;
  }

  // Job Management Endpoints
  async getJobStatus(jobId: string): Promise<JobInfo> {
    const response = await this.retry(() => 
      this.client.get<JobInfo>(`/api/v1/system/jobs/${jobId}`)
    );
    return response.data;
  }

  async getJobResultInfo(jobId: string): Promise<JobResultInfo> {
    const response = await this.retry(() => 
      this.client.get<JobResultInfo>(`/api/v1/system/jobs/${jobId}/info`)
    );
    return response.data;
  }

  async downloadJobResult(jobId: string, format: 'file' | 'base64' = 'file', filename?: string): Promise<Blob | string> {
    const params: any = { format };
    if (filename) params.filename = filename;

    const response = await this.retry(() => 
      this.client.get(`/api/v1/system/jobs/${jobId}/download`, {
        params,
        responseType: format === 'file' ? 'blob' : 'json'
      })
    );

    return response.data;
  }

  async getJobsHistory(params?: JobsHistoryParams): Promise<JobsHistoryResponse> {
    const response = await this.retry(() => 
      this.client.get<JobsHistoryResponse>('/api/v1/system/jobs/history', { params })
    );
    return response.data;
  }

  // NEW File Upload Endpoints
  async uploadImageFile(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<FileUploadResponse>(
      '/api/v1/file-upload/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
        }
      }
    );
    return response.data;
  }

  async uploadMeshFile(file: File, onProgress?: (progress: number) => void): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<FileUploadResponse>(
      '/api/v1/file-upload/mesh',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            onProgress(progress);
          }
        }
      }
    );
    return response.data;
  }

  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const response = await this.retry(() => 
      this.client.get<FileMetadata>(`/api/v1/file-upload/metadata/${fileId}`)
    );
    return response.data;
  }

  // Mesh Generation Endpoints
  async textToRawMesh(request: TextToMeshRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/mesh-generation/text-to-raw-mesh',
      request
    );
    return response.data;
  }

  async textToTexturedMesh(request: TextToTexturedMeshRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/mesh-generation/text-to-textured-mesh',
      request
    );
    return response.data;
  }

  async imageToRawMesh(request: ImageToMeshRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/mesh-generation/image-to-raw-mesh',
      request
    );
    return response.data;
  }

  async imageToTexturedMesh(request: ImageToTexturedMeshRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/mesh-generation/image-to-textured-mesh',
      request
    );
    return response.data;
  }

  async textMeshPainting(request: MeshPaintingRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/mesh-generation/text-mesh-painting',
      request
    );
    return response.data;
  }

  async imageMeshPainting(request: MeshPaintingRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/mesh-generation/image-mesh-painting',
      request
    );
    return response.data;
  }

  async partCompletion(request: PartCompletionRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/mesh-generation/part-completion',
      request
    );
    return response.data;
  }


  // Mesh Segmentation Endpoints
  async segmentMesh(request: MeshSegmentationRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/mesh-segmentation/segment-mesh',
      request
    );
    return response.data;
  }


  // Auto Rigging Endpoints
  async generateRig(request: AutoRiggingRequest): Promise<BaseApiResponse> {
    const response = await this.client.post<BaseApiResponse>(
      '/api/v1/auto-rigging/generate-rig',
      request
    );
    return response.data;
  }


  // Supported Formats Endpoints
  async getMeshGenerationSupportedFormats(): Promise<SupportedFormats> {
    const response = await this.retry(() => 
      this.client.get<SupportedFormats>('/api/v1/mesh-generation/supported-formats')
    );
    return response.data;
  }

  async getMeshSegmentationSupportedFormats(): Promise<SupportedFormats> {
    const response = await this.retry(() => 
      this.client.get<SupportedFormats>('/api/v1/mesh-segmentation/supported-formats')
    );
    return response.data;
  }

  async getAutoRiggingSupportedFormats(): Promise<SupportedFormats> {
    const response = await this.retry(() => 
      this.client.get<SupportedFormats>('/api/v1/auto-rigging/supported-formats')
    );
    return response.data;
  }

  // Utility methods
  async checkConnection(): Promise<boolean> {
    try {
      await this.getHealthStatus();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fast health check with minimal timeout and retries for app initialization
   */
  async quickHealthCheck(): Promise<boolean> {
    try {
      // Create a quick health check with minimal timeout and no retries
      const response = await this.client.get<HealthStatus>('/health', {
        timeout: 5000, // 5 second timeout
        // No retry wrapper - fail fast
      });
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }
}

// Create singleton instance
let apiClient: ApiClient;

export const createApiClient = (config: ApiConfig): ApiClient => {
  apiClient = new ApiClient(config);
  return apiClient;
};

export const getApiClient = (): ApiClient => {
  if (!apiClient) {
    throw new Error('API client not initialized. Call createApiClient() first.');
  }
  return apiClient;
};

export default ApiClient; 