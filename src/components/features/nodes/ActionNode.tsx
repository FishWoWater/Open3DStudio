/**
 * Action Node - Executes specific game actions
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styled from 'styled-components';

const NodeContainer = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border-radius: 8px;
  min-width: 180px;
  color: white;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
`;

const NodeTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`;

const NodeSubtitle = styled.div`
  font-size: 12px;
  opacity: 0.9;
`;

export const ActionNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <NodeContainer>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#fff', width: 10, height: 10 }}
      />
      <NodeTitle>{data.label || 'Action'}</NodeTitle>
      <NodeSubtitle>{data.actionType || 'custom'}</NodeSubtitle>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#fff', width: 10, height: 10 }}
      />
    </NodeContainer>
  );
};
