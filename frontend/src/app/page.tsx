'use client';

import { useState } from 'react';
import Logo from '../components/Logo';
import FileUpload from '../components/FileUpload';
import QuestionEditor from '../components/QuestionEditor';
import { Question, ExamMetadata, UploadResponse, GenerateResponse } from '../types';
import { uploadExcel, generateExam, getDownloadUrl } from '../utils/api';

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [metadata, setMetadata] = useState<ExamMetadata | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [downloadLinks, setDownloadLinks] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      setError('');
      const response: UploadResponse = await uploadExcel(file);
      setQuestions(response.questions);
      setMetadata(response.metadata);
      setSessionId(response.session_id);
    } catch (err) {
      setError('Failed to upload file. Please make sure it follows the correct format.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!metadata || !sessionId) return;

    try {
      setLoading(true);
      setError('');
      const response = await generateExam({
        session_id: sessionId,
        questions,
        metadata,
        settings: {} // Add settings if needed
      });
      setDownloadLinks(response);
    } catch (err) {
      setError('Failed to generate exam documents.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Logo />
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {!questions.length ? (
          <div className="max-w-2xl mx-auto">
            <FileUpload onUpload={handleFileUpload} />
          </div>
        ) : (
          <div className="space-y-8">
            {metadata && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">Exam Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-medium">{metadata.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lecturer</p>
                    <p className="font-medium">{metadata.lecturer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{metadata.date}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{metadata.duration}</p>
                  </div>
                </div>
              </div>
            )}

            <QuestionEditor
              questions={questions}
              onQuestionsChange={setQuestions}
            />

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setQuestions([]);
                  setMetadata(null);
                  setSessionId('');
                  setDownloadLinks(null);
                }}
                className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
              >
                Start Over
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Generating...' : 'Generate Exam'}
              </button>
            </div>

            {downloadLinks && (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-medium text-green-800 mb-4">
                  Documents Generated Successfully!
                </h3>
                <div className="space-y-2">
                  <a
                    href={getDownloadUrl(downloadLinks.exam_url)}
                    className="block px-4 py-2 text-blue-600 bg-white border rounded-lg hover:bg-blue-50"
                    download
                  >
                    Download Exam Paper
                  </a>
                  <a
                    href={getDownloadUrl(downloadLinks.key_url)}
                    className="block px-4 py-2 text-blue-600 bg-white border rounded-lg hover:bg-blue-50"
                    download
                  >
                    Download Answer Key
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
