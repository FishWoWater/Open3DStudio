import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SelectButton = styled.button<{ isOpen: boolean; hasError?: boolean }>`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => {
    if (props.hasError) return props.theme.colors.error;
    if (props.isOpen) return props.theme.colors.primary[500];
    return props.theme.colors.border.default;
  }};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  text-align: left;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.sm};

  &:hover {
    border-color: ${props => props.hasError ? props.theme.colors.error : props.theme.colors.primary[400]};
    background: ${props => props.theme.colors.background.secondary};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary[500]}20;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: ${props => props.theme.colors.gray[800]};
  }
`;

const SelectValue = styled.span<{ isPlaceholder?: boolean }>`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${props => props.isPlaceholder ? props.theme.colors.text.muted : props.theme.colors.text.primary};
`;

const SelectIcon = styled.div<{ isOpen: boolean }>`
  color: ${props => props.theme.colors.text.secondary};
  transition: transform ${props => props.theme.transitions.fast};
  transform: ${props => props.isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
`;

const DropdownContainer = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  z-index: 1000;
  max-height: 240px;
  overflow-y: auto;
  animation: ${fadeIn} 0.2s ease-out;
  display: ${props => props.isOpen ? 'block' : 'none'};

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background.primary};
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border.default};
    border-radius: 3px;
  }
`;

const OptionItem = styled.button<{ isSelected?: boolean; isHighlighted?: boolean }>`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => {
    if (props.isSelected) return props.theme.colors.primary[500];
    if (props.isHighlighted) return `${props.theme.colors.primary[500]}20`;
    return 'transparent';
  }};
  border: none;
  color: ${props => props.isSelected ? 'white' : props.theme.colors.text.primary};
  font-size: ${props => props.theme.typography.fontSize.sm};
  text-align: left;
  cursor: pointer;
  transition: all ${props => props.theme.transitions.fast};
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: ${props => props.isSelected ? props.theme.colors.primary[600] : `${props.theme.colors.primary[500]}20`};
  }

  &:first-child {
    border-top-left-radius: ${props => props.theme.borderRadius.md};
    border-top-right-radius: ${props => props.theme.borderRadius.md};
  }

  &:last-child {
    border-bottom-left-radius: ${props => props.theme.borderRadius.md};
    border-bottom-right-radius: ${props => props.theme.borderRadius.md};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SelectedIcon = styled.div`
  color: currentColor;
  font-size: ${props => props.theme.typography.fontSize.sm};
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSize.xs};
  margin-top: ${props => props.theme.spacing.xs};
`;

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  onChange?: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({
  options,
  value,
  placeholder = 'Select an option...',
  disabled = false,
  error,
  className,
  onChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && !options[highlightedIndex].disabled) {
            handleOptionSelect(options[highlightedIndex].value);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, options]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setHighlightedIndex(-1);
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <SelectContainer ref={containerRef} className={className}>
      <SelectButton
        ref={buttonRef}
        type="button"
        isOpen={isOpen}
        hasError={!!error}
        disabled={disabled}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <SelectValue isPlaceholder={!selectedOption}>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
        <SelectIcon isOpen={isOpen}>
          <i className="fas fa-chevron-down" />
        </SelectIcon>
      </SelectButton>

      <DropdownContainer isOpen={isOpen} role="listbox">
        {options.map((option, index) => (
          <OptionItem
            key={option.value}
            type="button"
            isSelected={option.value === value}
            isHighlighted={index === highlightedIndex}
            disabled={option.disabled}
            onClick={() => handleOptionSelect(option.value)}
            onMouseEnter={() => setHighlightedIndex(index)}
            role="option"
            aria-selected={option.value === value}
          >
            <span>{option.label}</span>
            {option.value === value && (
              <SelectedIcon>
                <i className="fas fa-check" />
              </SelectedIcon>
            )}
          </OptionItem>
        ))}
      </DropdownContainer>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </SelectContainer>
  );
};

export default Select; 