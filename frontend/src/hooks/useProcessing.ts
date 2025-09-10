import { useState, useCallback } from 'react';

export interface ProcessingState {
  isProcessing: boolean;
  title?: string;
  subtitle?: string;
}

export const useProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    title: 'Processing...',
    subtitle: 'Please wait while we process your file'
  });

  const startProcessing = useCallback((title?: string, subtitle?: string) => {
    setProcessingState({
      isProcessing: true,
      title: title || 'Processing...',
      subtitle: subtitle || 'Please wait while we process your file'
    });
  }, []);

  const stopProcessing = useCallback(() => {
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false
    }));
  }, []);

  const updateProcessing = useCallback((updates: Partial<ProcessingState>) => {
    setProcessingState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  return {
    processingState,
    startProcessing,
    stopProcessing,
    updateProcessing,
    isProcessing: processingState.isProcessing
  };
};

export default useProcessing;
