/**
 * Variable Node - Stores and manipulates game variables
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styled from 'styled-components';

const NodeContainer = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
  border-radius: 8px;
  min-width: 180px;
  color: white;
  box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
`;

const NodeTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`;

const NodeValue = styled.div`
  font-size: 12px;
  opacity: 0.9;
  font-family: monospace;
`;

export const VariableNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <NodeContainer>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#fff', width: 10, height: 10 }}
      />
      <NodeTitle>{data.variableName || 'Variable'}</NodeTitle>
      <NodeValue>= {data.variableValue !== undefined ? data.variableValue : '0'}</NodeValue>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#fff', width: 10, height: 10 }}
      />
    </NodeContainer>
  );
};
