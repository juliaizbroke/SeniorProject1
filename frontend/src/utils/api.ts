import { UploadResponse, GenerateRequest, GenerateResponse } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

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

export async function uploadExcel(file: File): Promise<UploadResponse> {
  console.log("uploadExcel called with file:", file.name, "API_BASE_URL:", API_BASE_URL);
  const formData = new FormData();
  formData.append('file', file);
  console.log("FormData created, about to fetch:", `${API_BASE_URL}/upload`);

  try {
    console.log("About to start fetch call...");
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log("Fetch response received:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed:', response.status, errorText);
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Network error during upload:', error);
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout: Request took longer than 30 seconds');
      }
      console.error('Error details:', error.message, error.stack);
    }
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

  return response.json();
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