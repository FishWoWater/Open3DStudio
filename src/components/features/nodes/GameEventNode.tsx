/**
 * Game Event Node - Triggers when specific game events occur
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styled from 'styled-components';

const NodeContainer = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  border-radius: 8px;
  min-width: 180px;
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
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

export const GameEventNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <NodeContainer>
      <NodeTitle>{data.label || 'Game Event'}</NodeTitle>
      <NodeSubtitle>{data.eventType || 'custom'}</NodeSubtitle>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#fff', width: 10, height: 10 }}
      />
    </NodeContainer>
  );
};
