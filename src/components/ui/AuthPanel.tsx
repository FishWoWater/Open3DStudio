import React, { useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../../store';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
`;

const Panel = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  margin: 0 0 32px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
`;

const Input = styled.input`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.default};
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  color: ${props => props.theme.colors.text.primary};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary[500]};
  }

  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${props => props.variant === 'primary' ? `
    background: ${props.theme.colors.primary[500]};
    color: white;
    
    &:hover:not(:disabled) {
      background: ${props.theme.colors.primary[600]};
    }
  ` : `
    background: transparent;
    color: ${props.theme.colors.text.secondary};
    
    &:hover:not(:disabled) {
      background: ${props.theme.colors.background.primary};
      color: ${props.theme.colors.text.primary};
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.error}20;
  border: 1px solid ${props => props.theme.colors.error};
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 13px;
  color: ${props => props.theme.colors.error};
  margin-bottom: 8px;
`;

const SwitchMode = styled.div`
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: ${props => props.theme.colors.text.secondary};
`;

const SwitchLink = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary[500]};
  cursor: pointer;
  font-weight: 500;
  padding: 0;
  margin-left: 4px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  height: 1px;
  background: ${props => props.theme.colors.border.default};
  margin: 24px 0;
`;

const InfoBox = styled.div`
  background: ${props => props.theme.colors.primary[500]}10;
  border: 1px solid ${props => props.theme.colors.primary[500]}40;
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 16px;
`;

interface AuthPanelProps {
  onAuthComplete?: () => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!username || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (mode === 'register' && !email) {
      setError('Please provide an email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, email, password);
      }
      
      // Auth successful
      if (onAuthComplete) {
        onAuthComplete();
      }
    } catch (err: any) {
      setError(err.message || `${mode === 'login' ? 'Login' : 'Registration'} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <Overlay>
      <Panel>
        <Title>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</Title>
        <Subtitle>
          {mode === 'login' 
            ? 'Sign in to access your 3D projects' 
            : 'Register to start creating 3D content'}
        </Subtitle>

        <InfoBox>
          Authentication is enabled on this server. Please {mode === 'login' ? 'sign in' : 'register'} to continue.
        </InfoBox>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </FormGroup>

          {mode === 'register' && (
            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </FormGroup>

          <Button 
            type="submit" 
            variant="primary" 
            disabled={isLoading}
            style={{ marginTop: '8px' }}
          >
            {isLoading 
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>
        </Form>

        <SwitchMode>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <SwitchLink onClick={switchMode} disabled={isLoading}>
            {mode === 'login' ? 'Register' : 'Sign In'}
          </SwitchLink>
        </SwitchMode>
      </Panel>
    </Overlay>
  );
};

export default AuthPanel;

