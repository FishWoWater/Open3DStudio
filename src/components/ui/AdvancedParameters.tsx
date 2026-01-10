import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { ParameterSchema } from '../../types/api';
import Select, { SelectOption } from './Select';

const Container = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.tertiary};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  transition: all ${props => props.theme.transitions.fast};

  &:hover {
    background: ${props => props.theme.colors.background.secondary};
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const ExpandIcon = styled.span<{ expanded: boolean }>`
  font-size: ${props => props.theme.typography.fontSize.sm};
  transition: transform ${props => props.theme.transitions.fast};
  transform: ${props => props.expanded ? 'rotate(90deg)' : 'rotate(0deg)'};
`;

const Badge = styled.span`
  background: ${props => props.theme.colors.primary[500]}30;
  color: ${props => props.theme.colors.primary[400]};
  padding: 2px ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSize.xs};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
`;

const Content = styled.div<{ expanded: boolean }>`
  display: ${props => props.expanded ? 'block' : 'none'};
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.primary};
`;

const ParameterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.md};
`;

const ParameterItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const Label = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-weight: ${props => props.theme.typography.fontWeight.medium};
  font-size: ${props => props.theme.typography.fontSize.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const Description = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-top: 2px;
`;

const TextInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NumberInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.primary};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Checkbox = styled.input`
  accent-color: ${props => props.theme.colors.primary[500]};
  width: 18px;
  height: 18px;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckboxLabel = styled.label`
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  cursor: pointer;
`;

interface AdvancedParametersProps {
  parameters: Record<string, ParameterSchema> | null | undefined;
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  defaultExpanded?: boolean;
}

const AdvancedParameters: React.FC<AdvancedParametersProps> = ({
  parameters,
  values,
  onChange,
  defaultExpanded = false
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Initialize values with defaults when parameters change
  useEffect(() => {
    if (parameters && Object.keys(values).length === 0) {
      const defaults: Record<string, any> = {};
      Object.entries(parameters).forEach(([key, schema]) => {
        if (schema.default !== undefined && schema.default !== null) {
          defaults[key] = schema.default;
        }
      });
      if (Object.keys(defaults).length > 0) {
        onChange(defaults);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parameters]);

  const handleValueChange = useCallback((key: string, value: any) => {
    onChange({
      ...values,
      [key]: value
    });
  }, [values, onChange]);

  // Don't render if no parameters
  if (!parameters || Object.keys(parameters).length === 0) {
    return null;
  }

  const paramCount = Object.keys(parameters).length;

  const renderParameterInput = (key: string, schema: ParameterSchema) => {
    const currentValue = values[key] !== undefined ? values[key] : schema.default;

    switch (schema.type) {
      case 'boolean':
        return (
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id={`param-${key}`}
              checked={currentValue || false}
              onChange={(e) => handleValueChange(key, e.target.checked)}
            />
            <CheckboxLabel htmlFor={`param-${key}`}>
              {schema.description || key}
            </CheckboxLabel>
          </CheckboxContainer>
        );

      case 'integer':
      case 'number':
        return (
          <>
            <NumberInput
              type="number"
              value={currentValue ?? ''}
              onChange={(e) => {
                const val = e.target.value === '' ? null : 
                  schema.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value);
                handleValueChange(key, val);
              }}
              min={schema.minimum}
              max={schema.maximum}
              step={schema.type === 'integer' ? 1 : 'any'}
              placeholder={`Default: ${schema.default}`}
            />
            {schema.description && <Description>{schema.description}</Description>}
            {(schema.minimum !== undefined || schema.maximum !== undefined) && (
              <Description>
                Range: {schema.minimum ?? '∞'} - {schema.maximum ?? '∞'}
              </Description>
            )}
          </>
        );

      case 'string':
        // Check if it has enum values (should use Select)
        if (schema.enum && schema.enum.length > 0) {
          const options: SelectOption[] = schema.enum.map(val => ({
            value: String(val),
            label: String(val)
          }));
          return (
            <>
              <Select
                options={options}
                value={currentValue ? String(currentValue) : ''}
                onChange={(val) => handleValueChange(key, val)}
                placeholder={`Default: ${schema.default}`}
              />
              {schema.description && <Description>{schema.description}</Description>}
            </>
          );
        }
        
        return (
          <>
            <TextInput
              type="text"
              value={currentValue || ''}
              onChange={(e) => handleValueChange(key, e.target.value)}
              placeholder={`Default: ${schema.default}`}
            />
            {schema.description && <Description>{schema.description}</Description>}
          </>
        );

      default:
        // For enum types with specific values
        if (schema.enum && schema.enum.length > 0) {
          const options: SelectOption[] = schema.enum.map(val => ({
            value: String(val),
            label: String(val)
          }));
          return (
            <>
              <Select
                options={options}
                value={currentValue ? String(currentValue) : ''}
                onChange={(val) => {
                  // Try to convert back to original type
                  const originalType = typeof schema.enum![0];
                  let convertedVal: any = val;
                  if (originalType === 'number') {
                    convertedVal = Number(val);
                  } else if (originalType === 'boolean') {
                    convertedVal = val === 'true';
                  }
                  handleValueChange(key, convertedVal);
                }}
                placeholder={`Default: ${schema.default}`}
              />
              {schema.description && <Description>{schema.description}</Description>}
            </>
          );
        }
        
        return (
          <>
            <TextInput
              type="text"
              value={currentValue || ''}
              onChange={(e) => handleValueChange(key, e.target.value)}
              placeholder={`Default: ${schema.default}`}
            />
            {schema.description && <Description>{schema.description}</Description>}
          </>
        );
    }
  };

  return (
    <Container>
      <Header onClick={() => setExpanded(!expanded)}>
        <HeaderTitle>
          <ExpandIcon expanded={expanded}>▶</ExpandIcon>
          Advanced Parameters
          <Badge>{paramCount}</Badge>
        </HeaderTitle>
      </Header>
      
      <Content expanded={expanded}>
        <ParameterGrid>
          {Object.entries(parameters).map(([key, schema]) => (
            <ParameterItem key={key}>
              {schema.type !== 'boolean' && (
                <Label htmlFor={`param-${key}`}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  {schema.required && <span style={{ color: '#ef4444' }}>*</span>}
                </Label>
              )}
              {renderParameterInput(key, schema)}
            </ParameterItem>
          ))}
        </ParameterGrid>
      </Content>
    </Container>
  );
};

export default AdvancedParameters;
