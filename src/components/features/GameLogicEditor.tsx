/**
 * Game Logic Visual Editor using React Flow
 * Provides a visual programming interface similar to Unreal Blueprints
 * for creating game logic without coding
 */

import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styled from 'styled-components';

// Custom node types for game logic
import { GameEventNode } from './nodes/GameEventNode';
import { ActionNode } from './nodes/ActionNode';
import { ConditionNode } from './nodes/ConditionNode';
import { VariableNode } from './nodes/VariableNode';

const EditorContainer = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.theme.colors.background.primary};
  position: relative;

  .react-flow {
    background: ${props => props.theme.colors.background.primary};
  }

  .react-flow__node {
    background: ${props => props.theme.colors.background.secondary};
    border: 1px solid ${props => props.theme.colors.border.primary};
    border-radius: 8px;
    padding: 12px;
    color: ${props => props.theme.colors.text.primary};
    font-size: 14px;
  }

  .react-flow__edge-path {
    stroke: ${props => props.theme.colors.accent.primary};
    stroke-width: 2;
  }

  .react-flow__controls {
    button {
      background: ${props => props.theme.colors.background.secondary};
      border: 1px solid ${props => props.theme.colors.border.primary};
      color: ${props => props.theme.colors.text.primary};

      &:hover {
        background: ${props => props.theme.colors.background.tertiary};
      }
    }
  }
`;

const Toolbar = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
  padding: 12px;
  background: ${props => props.theme.colors.background.secondary}cc;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 8px;
  backdrop-filter: blur(12px);
`;

const ToolButton = styled.button`
  padding: 8px 16px;
  background: ${props => props.theme.colors.background.tertiary};
  color: ${props => props.theme.colors.text.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.primary};
    transform: translateY(-1px);
  }
`;

// Node types configuration
const nodeTypes = {
  gameEvent: GameEventNode,
  action: ActionNode,
  condition: ConditionNode,
  variable: VariableNode,
};

// Initial nodes for demonstration
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'gameEvent',
    position: { x: 100, y: 100 },
    data: { label: 'On Game Start', eventType: 'gameStart' },
  },
  {
    id: '2',
    type: 'action',
    position: { x: 400, y: 100 },
    data: { label: 'Spawn Player', actionType: 'spawnPlayer' },
  },
  {
    id: '3',
    type: 'condition',
    position: { x: 400, y: 250 },
    data: { label: 'Score > 100', condition: 'score > 100' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
];

interface GameLogicEditorProps {
  projectId?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

export const GameLogicEditor: React.FC<GameLogicEditorProps> = ({
  projectId,
  onSave,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(4);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${nodeIdCounter}`,
        type,
        position: { x: 250, y: 250 + nodeIdCounter * 50 },
        data: { 
          label: `New ${type}`,
          ...(type === 'gameEvent' && { eventType: 'custom' }),
          ...(type === 'action' && { actionType: 'custom' }),
          ...(type === 'condition' && { condition: 'true' }),
          ...(type === 'variable' && { variableName: 'value', variableValue: 0 }),
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setNodeIdCounter((c) => c + 1);
    },
    [nodeIdCounter, setNodes]
  );

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
    console.log('Game logic saved:', { nodes, edges });
  }, [nodes, edges, onSave]);

  const handleExport = useCallback(() => {
    // Export logic as executable code
    const logic = {
      nodes,
      edges,
      projectId,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(logic, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-logic-${projectId || 'untitled'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, projectId]);

  return (
    <EditorContainer>
      <Toolbar>
        <ToolButton onClick={() => addNode('gameEvent')}>
          + Event
        </ToolButton>
        <ToolButton onClick={() => addNode('action')}>
          + Action
        </ToolButton>
        <ToolButton onClick={() => addNode('condition')}>
          + Condition
        </ToolButton>
        <ToolButton onClick={() => addNode('variable')}>
          + Variable
        </ToolButton>
        <div style={{ width: '1px', height: '100%', background: '#444', margin: '0 8px' }} />
        <ToolButton onClick={handleSave}>
          💾 Save
        </ToolButton>
        <ToolButton onClick={handleExport}>
          📥 Export
        </ToolButton>
      </Toolbar>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Controls />
        <MiniMap 
          style={{
            background: 'rgba(30, 30, 30, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          nodeColor={(node) => {
            switch (node.type) {
              case 'gameEvent':
                return '#4CAF50';
              case 'action':
                return '#2196F3';
              case 'condition':
                return '#FF9800';
              case 'variable':
                return '#9C27B0';
              default:
                return '#666';
            }
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="rgba(255, 255, 255, 0.1)"
        />
      </ReactFlow>
    </EditorContainer>
  );
};

export default GameLogicEditor;
