import { Task, TaskType } from '../types/state';
import { HistoricalJob, JobsHistoryParams } from '../types/api';
import { getApiClient } from '../api/client';

const STORAGE_KEY = 'minimal3d_tasks';
const STORAGE_VERSION = '1.1';

interface StoredTaskData {
  version: string;
  tasks: Task[];
  lastSync: string;
  userId?: string; // Track which user these tasks belong to
}

/**
 * Task Persistence Service
 * Handles saving/loading tasks from localStorage and syncing with backend history
 */
export class TaskPersistenceService {
  private static instance: TaskPersistenceService;

  static getInstance(): TaskPersistenceService {
    if (!TaskPersistenceService.instance) {
      TaskPersistenceService.instance = new TaskPersistenceService();
    }
    return TaskPersistenceService.instance;
  }

  /**
   * Save tasks to localStorage
   */
  saveTasks(tasks: Task[], userId?: string): void {
    try {
      const data: StoredTaskData = {
        version: STORAGE_VERSION,
        tasks: tasks.map(task => ({
          ...task,
          createdAt: task.createdAt.toISOString(),
          completedAt: task.completedAt?.toISOString(),
        } as any)),
        lastSync: new Date().toISOString(),
        userId // Store the user ID to verify ownership later
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }

  /**
   * Load tasks from localStorage
   * @param currentUserId - The currently logged in user ID. If provided, only load tasks for this user.
   *                        If undefined, load tasks regardless of user (anonymous mode).
   */
  loadTasks(currentUserId?: string): Task[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const data: StoredTaskData = JSON.parse(stored);
      
      // Check version compatibility
      if (data.version !== STORAGE_VERSION) {
        console.warn('Task storage version mismatch, clearing stored tasks');
        this.clearTasks();
        return [];
      }

      // In authenticated mode, verify user ownership
      if (currentUserId !== undefined) {
        // If we have a currentUserId (authenticated mode) but cached tasks belong to different user
        if (data.userId && data.userId !== currentUserId) {
          console.warn(`Cached tasks belong to different user (${data.userId}), clearing...`);
          this.clearTasks();
          return [];
        }
      }

      return data.tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt as any),
        completedAt: task.completedAt ? new Date(task.completedAt as any) : undefined,
      }));
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
      return [];
    }
  }

  /**
   * Get the user ID associated with cached tasks
   */
  getCachedUserId(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: StoredTaskData = JSON.parse(stored);
      return data.userId || null;
    } catch (error) {
      console.error('Failed to get cached user ID:', error);
      return null;
    }
  }

  /**
   * Clear all stored tasks
   */
  clearTasks(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored tasks:', error);
    }
  }

  /**
   * Get the last sync timestamp
   */
  getLastSyncTime(): Date | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: StoredTaskData = JSON.parse(stored);
      return new Date(data.lastSync);
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  /**
   * Fetch historical jobs from backend
   */
  async fetchHistoricalJobs(params?: JobsHistoryParams): Promise<HistoricalJob[]> {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.getJobsHistory({
        limit: 100,
        offset: 0,
        ...params
      });
      return response.jobs;
    } catch (error) {
      console.error('Failed to fetch historical jobs:', error);
      return [];
    }
  }

  /**
   * Convert historical job to Task format
   */
  private convertHistoricalJobToTask(job: HistoricalJob): Task {
    // Map backend feature types to frontend task types
    const featureToTaskType: Record<string, TaskType> = {
      'text_to_raw_mesh': 'text-to-mesh',
      'text_to_textured_mesh': 'text-to-textured-mesh',
      'image_to_raw_mesh': 'image-to-mesh',
      'image_to_textured_mesh': 'image-to-textured-mesh',
      'text_mesh_painting': 'text-mesh-painting',
      'image_mesh_painting': 'image-mesh-painting',
      'mesh_segmentation': 'mesh-segmentation',
      'part_completion': 'part-completion',
      'auto_rig': 'auto-rigging'
    };

    const taskType = featureToTaskType[job.feature] || 'text-to-mesh' as TaskType;

    console.log("job", job);
    
    return {
      id: `backend_${job.job_id}`,
      jobId: job.job_id,
      type: taskType,
      name: this.generateTaskName(job.feature, job.job_id),
      status: job.status,
      createdAt: new Date(job.created_at),
      completedAt: job.completed_at ? new Date(job.completed_at) : undefined,
      processingTime: job.processing_time,
      inputData: {
        // We don't have detailed input data from history, so we'll leave it minimal
        parameters: {
          model_preference: job.model_preference
        }
      },
      result: job.status === 'completed' ? {
        outputPath: job.output_mesh_path,
        downloadUrl: job.mesh_url 
          ? job.mesh_url
          : undefined,
        previewImageUrl: job.thumbnail_url  
          ? job.thumbnail_url
          : undefined
      } : undefined
    };
  }

  /**
   * Generate a human-readable task name from feature and job ID
   */
  private generateTaskName(feature: string, jobId: string): string {
    const featureNames: Record<string, string> = {
      'text_to_raw_mesh': 'Text to 3D',
      'text_to_textured_mesh': 'Text to Textured 3D',
      'image_to_raw_mesh': 'Image to 3D',
      'image_to_textured_mesh': 'Image to Textured 3D',
      'text_mesh_painting': 'Text Mesh Painting',
      'image_mesh_painting': 'Image Mesh Painting',
      'mesh_segmentation': 'Mesh Segmentation',
      'part_completion': 'Part Completion',
      'auto_rig': 'Auto Rigging'
    };

    const friendlyName = featureNames[feature] || '3D Generation';
    return `${friendlyName} (${jobId.split('_').pop()?.slice(-6) || 'unknown'})`;
  }

  /**
   * Merge local tasks with historical backend tasks
   */
  async mergeTasks(localTasks: Task[]): Promise<Task[]> {
    try {
      // Get historical jobs from backend
      const historicalJobs = await this.fetchHistoricalJobs({
        limit: 100,
        status: undefined // Get all statuses
      });

      // Convert historical jobs to Task format
      const historicalTasks = historicalJobs.map(job => this.convertHistoricalJobToTask(job));

      // Create a map of existing local tasks by jobId
      const localTasksByJobId = new Map<string, Task>();
      localTasks.forEach(task => {
        if (task.jobId) {
          localTasksByJobId.set(task.jobId, task);
        }
      });

      // Merge historical tasks with local tasks
      const mergedTasks: Task[] = [];
      const addedJobIds = new Set<string>();

      // Add all local tasks first (they have priority and more complete data)
      localTasks.forEach(task => {
        mergedTasks.push(task);
        if (task.jobId) {
          addedJobIds.add(task.jobId);
        }
      });

      // Add historical tasks that don't exist locally
      historicalTasks.forEach(historicalTask => {
        if (historicalTask.jobId && !addedJobIds.has(historicalTask.jobId)) {
          mergedTasks.push(historicalTask);
          addedJobIds.add(historicalTask.jobId);
        }
      });

      // Sort by creation date (newest first)
      mergedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return mergedTasks;
    } catch (error) {
      console.error('Failed to merge tasks with backend history:', error);
      return localTasks; // Return local tasks as fallback
    }
  }

  /**
   * Initialize task persistence for the app
   * @param userId - Current user ID (if authenticated)
   */
  async initializeAndSync(userId?: string): Promise<Task[]> {
    // Load local tasks first, verifying user ownership if in auth mode
    const localTasks = this.loadTasks(userId);
    
    // Merge with backend historical data
    const mergedTasks = await this.mergeTasks(localTasks);
    
    // Save the merged result back to localStorage with user ID
    this.saveTasks(mergedTasks, userId);
    
    return mergedTasks;
  }
}

// Export singleton instance
export const taskPersistence = TaskPersistenceService.getInstance(); 