/**
 * Condition Node - Branches logic based on conditions
 */

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styled from 'styled-components';

const NodeContainer = styled.div`
  padding: 12px 16px;
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  border-radius: 8px;
  min-width: 180px;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
`;

const NodeTitle = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`;

const NodeCondition = styled.div`
  font-size: 12px;
  opacity: 0.9;
  font-family: monospace;
`;

const OutputsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
  font-size: 11px;
`;

export const ConditionNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <NodeContainer>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#fff', width: 10, height: 10 }}
      />
      <NodeTitle>{data.label || 'Condition'}</NodeTitle>
      <NodeCondition>{data.condition || 'true'}</NodeCondition>
      <OutputsContainer>
        <div>True</div>
        <div>False</div>
      </OutputsContainer>
      <Handle
        type="source"
        position={Position.Right}
        id="true"
        style={{ background: '#4CAF50', width: 10, height: 10, top: 'calc(100% - 20px)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="false"
        style={{ background: '#F44336', width: 10, height: 10, top: 'calc(100% - 5px)' }}
      />
    </NodeContainer>
  );
};
