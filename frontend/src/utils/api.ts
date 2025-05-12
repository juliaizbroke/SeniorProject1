import { UploadResponse, GenerateRequest, GenerateResponse } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5000';

export async function uploadExcel(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  return response.json();
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