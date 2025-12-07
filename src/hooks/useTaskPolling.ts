import { useEffect, useCallback, useRef } from 'react';
import { getApiClient } from '../api/client';
import { useStore } from '../store';
import { Task } from '../types/state';
import { JobStatus, JobInfo } from '../types/api';

export interface UseTaskPollingOptions {
  pollingInterval?: number; // in milliseconds
  enabled?: boolean;
}

export const useTaskPolling = (options: UseTaskPollingOptions = {}) => {
  const { 
    pollingInterval = 5000, // Default 5 seconds
    enabled = true 
  } = options;

  const { tasks, updateTask } = useStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const pollTaskStatus = useCallback(async (task: Task) => {
    // console.log("before polling the task status is: ", task.result);
    if (!task.jobId || task.status === 'completed' || task.status === 'failed') {
      return; // Skip polling for tasks without jobId or already finished
    }

    try {
      const apiClient = getApiClient();
      const jobInfo: JobInfo = await apiClient.getJobStatus(task.jobId);
      // console.log("The task result is: ", task.result);
      
      // Check if status changed or if we need to capture the input image URL or model preference
      const needsUpdate = jobInfo.status !== task.status || 
                         (jobInfo.input_image_url && !task.inputImageUrl) ||
                         (jobInfo.model_preference && !task.modelPreference);
      
      if (needsUpdate) {
        if (jobInfo.status !== task.status) {
          console.log(`[TaskPolling] Task ${task.id} status changed: ${task.status} -> ${jobInfo.status}`);
        }
        
        const updatedTask: Partial<Task> = {
          status: jobInfo.status,
          progress: jobInfo.status === 'completed' ? 100 : 
                   jobInfo.status === 'failed' ? 0 : 
                   jobInfo.status === 'processing' ? 50 : 
                   task.progress
        };
        
        // Capture input image URL from API response (persists across sessions)
        if (jobInfo.input_image_url && !task.inputImageUrl) {
          updatedTask.inputImageUrl = jobInfo.input_image_url;
          console.log(`[TaskPolling] Captured input image URL for task ${task.id}: ${jobInfo.input_image_url}`);
        }
        
        // Capture model preference from API response
        if (jobInfo.model_preference && !task.modelPreference) {
          updatedTask.modelPreference = jobInfo.model_preference;
          console.log(`[TaskPolling] Captured model preference for task ${task.id}: ${jobInfo.model_preference}`);
        }

        // Handle completion
        if (jobInfo.status === 'completed') {
          updatedTask.completedAt = new Date();
          updatedTask.processingTime = jobInfo.processing_time;
          
          // Get result info if available
          if (jobInfo.result) {
            const apiClient = getApiClient();
            const baseURL = apiClient.getConfig().baseURL;
            
            updatedTask.result = {
              outputPath: jobInfo.result.mesh_url,
              metadata: jobInfo.result.generation_info
            };

            // Set preview image URL from thumbnail_url
            if (jobInfo.result.thumbnail_url) {
              updatedTask.result.previewImageUrl = jobInfo.result.thumbnail_url;
            }

            // Try to get additional result info for download URL
            try {
              const resultInfo = await apiClient.getJobResultInfo(task.jobId);
              console.log("The result info is: ", resultInfo);
              console.log("The file format is: ", resultInfo.file_info.file_extension);
              if (resultInfo.mesh_download_urls) {
                updatedTask.result = {
                  ...updatedTask.result,
                  downloadUrl: resultInfo.mesh_download_urls.direct_download,
                  fileSize: resultInfo.file_info.file_size_mb,
                  format: resultInfo.file_info.file_extension
                };
              }
            } catch (err) {
              console.warn('[TaskPolling] Failed to get result info:', err);
              // Fallback: create download URL from job ID
              if (jobInfo.result.mesh_url) {
                updatedTask.result.downloadUrl = `${baseURL}/api/v1/system/jobs/${task.jobId}/download`;
              }
            }
          }
        }

        // Handle failure
        if (jobInfo.status === 'failed') {
          updatedTask.error = 'Task failed during processing';
        }

        updateTask(task.id, updatedTask);
      }

    } catch (error) {
      console.error('[TaskPolling] Failed to poll task status:', error);
      // Don't update task on polling errors, just log them
    }
  }, [updateTask]);

  const pollAllActiveTasks = useCallback(async () => {
    if (isPollingRef.current) {
      return; // Prevent concurrent polling
    }

    isPollingRef.current = true;

    try {
      // Get tasks that need polling (queued or processing)
      const activeTasks = tasks.tasks.filter((task: Task) => 
        task.jobId && 
        (task.status === 'queued' || task.status === 'processing')
      );

      if (activeTasks.length === 0) {
        return;
      }

      console.log(`[TaskPolling] Polling ${activeTasks.length} active tasks`);

      // Poll all active tasks in parallel
      await Promise.allSettled(
        activeTasks.map((task: Task) => pollTaskStatus(task))
      );

    } catch (error) {
      console.error('[TaskPolling] Error during polling cycle:', error);
    } finally {
      isPollingRef.current = false;
    }
  }, [tasks, pollTaskStatus]);

  // Start/stop polling based on enabled flag
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start polling
    intervalRef.current = setInterval(pollAllActiveTasks, pollingInterval);

    // Initial poll
    pollAllActiveTasks();

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollingInterval, pollAllActiveTasks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    isPolling: isPollingRef.current,
    pollTask: pollTaskStatus,
    pollAllTasks: pollAllActiveTasks
  };
}; 