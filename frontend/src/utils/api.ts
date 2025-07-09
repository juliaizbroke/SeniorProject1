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

export async function uploadExcel(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

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

    return response.json();
  } catch (error) {
    console.error('Network error during upload:', error);
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateExam(data: GenerateRequest): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
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