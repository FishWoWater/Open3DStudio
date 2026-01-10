import React, { useState } from 'react';
import styled from 'styled-components';
import { Task } from '../../types/state';
import TaskItem from './TaskItem';
import ModelViewerModal from '../ui/ModelViewerModal';
import { useSettings, useStore } from '../../store';
import { getFullApiUrl } from '../../utils/url';

const TaskListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.muted};
`;

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskRetry: (taskId: string) => void;
  onMeshEditing?: (taskId: string) => void;
  onClearCompleted: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onTaskClick, 
  onTaskDelete, 
  onTaskRetry,
  onMeshEditing,
  onClearCompleted 
}) => {
  const { addModel } = require('../../store').useStoreActions();
  const { addNotification } = require('../../store').useStoreActions();
  const { setTaskResultAsInput } = useStore();
  const settings = useSettings();
  const [importingTaskId, setImportingTaskId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<number>(0);

  // Sort tasks by createdAt (newest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });

  const handleDownload = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task?.result?.downloadUrl) {
      const url = getFullApiUrl(task.result.downloadUrl, settings.apiEndpoint);
      // Use a temporary <a> element to trigger the download without opening a new window/tab
      const link = document.createElement('a');
      link.href = url || '';
      link.download = '';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
    }
  };

  // Import to Scene logic
  const handleImportToScene = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.result?.downloadUrl) return;
    setImportingTaskId(taskId);
    setImportProgress(0);
    const fullDownloadUrl = getFullApiUrl(task.result.downloadUrl, settings.apiEndpoint);
    if (!fullDownloadUrl) {
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Invalid download URL',
        duration: 4000
      });
      setImportingTaskId(null);
      setImportProgress(0);
      return;
    }

    try {
      // Dynamically import Three.js loaders
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader');
      const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader');
      const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader');

      // Progress callback
      const onProgress = (event: ProgressEvent) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setImportProgress(percentComplete);
        } else {
          // If we can't compute progress, show indeterminate progress
          setImportProgress(50); // Show halfway as an indication of activity
        }
      };

      // Determine format from URL or task result
      let format = (task.result.format || 'glb').toLowerCase();
      // Try to infer from URL if format not available
      if (!task.result.format) {
        const urlPath = task.result.downloadUrl.split('?')[0];
        const extension = urlPath.split('.').pop()?.toLowerCase();
        if (extension && ['glb', 'gltf', 'obj', 'fbx', 'ply'].includes(extension)) {
          format = extension;
        }
      }

      let loader: any;
      let object: any;

      switch (format) {
        case 'glb':
        case 'gltf':
          loader = new GLTFLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(
              fullDownloadUrl,
              (gltf: any) => resolve(gltf.scene),
              onProgress,
              (error: any) => {
                console.error('GLTF load error:', error);
                reject(new Error(`Failed to load GLTF: ${error.message || 'Unknown error'}`));
              }
            );
          });
          break;
        case 'obj':
          loader = new OBJLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(
              fullDownloadUrl,
              (obj: any) => resolve(obj),
              onProgress,
              (error: any) => {
                console.error('OBJ load error:', error);
                reject(new Error(`Failed to load OBJ: ${error.message || 'Unknown error'}`));
              }
            );
          });
          break;
        case 'fbx':
          loader = new FBXLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(
              fullDownloadUrl,
              (fbx: any) => resolve(fbx),
              onProgress,
              (error: any) => {
                console.error('FBX load error:', error);
                reject(new Error(`Failed to load FBX: ${error.message || 'Unknown error'}`));
              }
            );
          });
          break;
        case 'ply':
          loader = new PLYLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(
              fullDownloadUrl,
              (geometry: any) => {
                // Ensure geometry has proper normals for lighting
                if (!geometry.attributes.normal) {
                  geometry.computeVertexNormals();
                }
                const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
                const mesh = new THREE.Mesh(geometry, material);
                resolve(mesh);
              },
              onProgress,
              (error: any) => {
                console.error('PLY load error:', error);
                reject(new Error(`Failed to load PLY: ${error.message || 'Unknown error'}`));
              }
            );
          });
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Ensure all geometries have proper normals for lighting
      object.traverse((child: any) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          if (!child.geometry.attributes.normal) {
            child.geometry.computeVertexNormals();
          }
        }
      });

      // Add to scene via store
      addModel({
        id: `imported_${task.id}_${Date.now()}`,
        name: task.name,
        url: fullDownloadUrl,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        visible: true,
        selected: false,
        metadata: { source: 'task', taskId: task.id },
        object3D: object // Optionally store the loaded object for direct scene use
      });
      addNotification({
        type: 'success',
        title: 'Model Imported',
        message: `${task.name} imported to scene.`,
        duration: 3000
      });
    } catch (err) {
      console.error('Import error:', err);
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: err instanceof Error ? err.message : 'Failed to import model',
        duration: 4000
      });
    } finally {
      setImportingTaskId(null);
      setImportProgress(0);
    }
  };

  const handleUseAsInput = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.result?.downloadUrl) {
      addNotification({
        type: 'error',
        title: 'Cannot Use Result',
        message: 'Task result is not available',
        duration: 3000
      });
      return;
    }

    // Set the task result as input for the currently active panel
    setTaskResultAsInput(taskId);

    // addNotification({
    //   type: 'success',
    //   title: 'Result Loaded',
    //   message: `Task result loaded as input for current panel`,
    //   duration: 3000
    // });
  };

  if (tasks.length === 0) {
    return (
      <TaskListContainer>
        <EmptyState>
          <i className="fas fa-tasks" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}></i>
          <p>No tasks yet</p>
          <small>Generated models and tasks will appear here</small>
        </EmptyState>
      </TaskListContainer>
    );
  }

  return (
    <TaskListContainer>
      {sortedTasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onClick={onTaskClick}
          onDelete={onTaskDelete}
          onRetry={onTaskRetry}
          onDownload={handleDownload}
          isImporting={importingTaskId === task.id}
          importProgress={importingTaskId === task.id ? importProgress : 0}
          onImportToScene={handleImportToScene}
          onUseAsInput={handleUseAsInput}
          onMeshEditing={onMeshEditing}
        />
      ))}
    </TaskListContainer>
  );
};

export default TaskList; 