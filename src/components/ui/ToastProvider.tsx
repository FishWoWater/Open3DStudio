/**
 * Toast Notification System using Sonner
 * Provides beautiful, minimal toast notifications with promise support
 */

import React from 'react';
import { Toaster, toast } from 'sonner';
import styled from 'styled-components';

// Styled wrapper to position and theme the toaster
const ToasterWrapper = styled.div`
  /* Ensure toasts appear above other content */
  z-index: 9999;
`;

/**
 * Toast Provider Component
 * Wrap your app with this to enable toast notifications
 */
export const ToastProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <>
      {children}
      <ToasterWrapper>
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            style: {
              background: 'rgba(30, 30, 30, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              color: '#fff',
            },
          }}
        />
      </ToasterWrapper>
    </>
  );
};

/**
 * Hook for using toast notifications throughout the app
 */
export const useToast = () => {
  const showSuccess = (message: string, description?: string) => {
    toast.success(message, { description });
  };

  const showError = (message: string, description?: string) => {
    toast.error(message, { description });
  };

  const showInfo = (message: string, description?: string) => {
    toast.info(message, { description });
  };

  const showWarning = (message: string, description?: string) => {
    toast.warning(message, { description });
  };

  const showLoading = (message: string, description?: string) => {
    return toast.loading(message, { description });
  };

  const dismiss = (toastId?: string | number) => {
    toast.dismiss(toastId);
  };

  /**
   * Show toast with promise handling
   * Automatically shows loading, success, and error states
   * Returns the original promise result
   */
  const showAsyncTask = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> => {
    toast.promise(promise, {
      loading: messages.loading,
      success: (data) => {
        return typeof messages.success === 'function' 
          ? messages.success(data) 
          : messages.success;
      },
      error: (error) => {
        return typeof messages.error === 'function'
          ? messages.error(error)
          : messages.error;
      }
    });
    return promise;
  };

  /**
   * Show a custom toast with action buttons
   */
  const showAction = (
    message: string,
    action: {
      label: string;
      onClick: () => void;
    },
    options?: {
      description?: string;
      duration?: number;
    }
  ) => {
    toast(message, {
      description: options?.description,
      duration: options?.duration,
      action: {
        label: action.label,
        onClick: action.onClick
      }
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    showAsyncTask,
    showAction,
    dismiss,
    // Also expose raw toast for advanced usage
    toast
  };
};

// Export toast directly for usage outside of React components
export { toast };

export default ToastProvider;
