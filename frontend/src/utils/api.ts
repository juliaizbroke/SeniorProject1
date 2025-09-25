import { UploadResponse, GenerateRequest, GenerateResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function testApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

export async function uploadExcel(
  file: File,
  options?: {
    enableDuplicateDetection?: boolean;
    enableGrammarChecking?: boolean;
  }
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  // Add processing options if provided
  if (options) {
    formData.append('checkDuplicates', options.enableDuplicateDetection ? 'true' : 'false');
    formData.append('checkGrammar', options.enableGrammarChecking ? 'true' : 'false');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
    }

    // Get the response as text first to handle potential NaN values
    const responseText = await response.text();
    
    try {
      // Replace any NaN values with null before parsing
      const sanitizedText = responseText.replace(/:\s*NaN/g, ': null');
      return JSON.parse(sanitizedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('Network error during upload:', error);
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateExam(data: GenerateRequest): Promise<GenerateResponse> {
  // Include template choice from localStorage
  const selectedTemplate = localStorage.getItem("selectedTemplate") || "default";
  const selectedWordTemplate = localStorage.getItem("selectedWordTemplate") || "default";
  const requestData = {
    ...data,
    selectedTemplate,
    selectedWordTemplate
  };

  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    throw new Error('Failed to generate exam');
  }

  // Get the response as text first to handle potential NaN values
  const responseText = await response.text();
  
  try {
    // Replace any NaN values with null before parsing
    const sanitizedText = responseText.replace(/:\s*NaN/g, ': null');
    return JSON.parse(sanitizedText);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Response text:', responseText);
    throw new Error('Invalid response format from server');
  }
}

export function getDownloadUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function getPreviewUrl(path: string): string {
  // Convert download path to preview path
  const previewPath = path.replace('/download/', '/preview/');
  return `${API_BASE_URL}${previewPath}`;
}

export async function cleanupSessionFiles(sessionId: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/cleanup/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to cleanup files');
    }
  } catch (error) {
    console.error('Error cleaning up files:', error);
    throw error;
  }
}

export async function triggerManualCleanup(): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/cleanup`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to trigger cleanup');
    }
  } catch (error) {
    console.error('Error triggering cleanup:', error);
    throw error;
  }
}