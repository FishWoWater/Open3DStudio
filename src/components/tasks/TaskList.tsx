import React, { useState } from 'react';
import styled from 'styled-components';
import { Task } from '../../types/state';
import TaskItem from './TaskItem';
import ModelViewerModal from '../ui/ModelViewerModal';
import { useSettings } from '../../store';
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
  onClearCompleted: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onTaskClick, 
  onTaskDelete, 
  onTaskRetry, 
  onClearCompleted 
}) => {
  const { addModel } = require('../../store').useStoreActions();
  const { addNotification } = require('../../store').useStoreActions();
  const settings = useSettings();
  const [importingTaskId, setImportingTaskId] = useState<string | null>(null);

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
    try {
      // Dynamically import Three.js loaders
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader');
      const { OBJLoader } = await import('three/examples/jsm/loaders/OBJLoader');
      const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader');
      const { PLYLoader } = await import('three/examples/jsm/loaders/PLYLoader');

      const downloadUrl = getFullApiUrl(task.result.downloadUrl, settings.apiEndpoint);
      // Download the model file
      const response = await fetch(downloadUrl || '');
      if (!response.ok) throw new Error('Failed to download model');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const format = (task.result.format || 'glb').toLowerCase();

      let loader: any;
      let object: any;
      switch (format) {
        case 'glb':
        case 'gltf':
          loader = new GLTFLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(url, (gltf: any) => resolve(gltf.scene), undefined, reject);
          });
          break;
        case 'obj':
          loader = new OBJLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(url, (obj: any) => resolve(obj), undefined, reject);
          });
          break;
        case 'fbx':
          loader = new FBXLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(url, (fbx: any) => resolve(fbx), undefined, reject);
          });
          break;
        case 'ply':
          loader = new PLYLoader();
          object = await new Promise((resolve, reject) => {
            loader.load(url, (geometry: any) => {
              const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
              const mesh = new THREE.Mesh(geometry, material);
              resolve(mesh);
            }, undefined, reject);
          });
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Add to scene via store
      addModel({
        id: `imported_${task.id}_${Date.now()}`,
        name: task.name,
        url: task.result.downloadUrl,
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
      addNotification({
        type: 'error',
        title: 'Import Failed',
        message: err instanceof Error ? err.message : 'Failed to import model',
        duration: 4000
      });
    } finally {
      setImportingTaskId(null);
    }
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
          onImportToScene={handleImportToScene}
        />
      ))}
    </TaskListContainer>
  );
};

export default TaskList; 