// Example usage in your upload component or main page

import React, { useState } from 'react';
import ProcessingModal from '../components/ProcessingModal';
import { useProcessing } from '../hooks/useProcessing';

export const ExampleUsage = () => {
  const { processingState, startProcessing, stopProcessing } = useProcessing();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      // Start the processing modal
      startProcessing(
        'Processing Excel File', 
        'Analyzing questions and generating exam papers...'
      );

      // Your existing upload logic
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      
      // Stop processing when done
      stopProcessing();
      
      // Handle success
      console.log('Upload successful:', result);
      
    } catch (error) {
      // Stop processing on error
      stopProcessing();
      console.error('Upload failed:', error);
    }
  };

  const handleExamGeneration = async (examData: Record<string, unknown>) => {
    try {
      // Note: In the actual app, exam generation doesn't use the processing modal
      // This is just for demonstration purposes
      startProcessing(
        'Demo: Generating Exam Paper', 
        'This is just an example - actual exam generation uses regular loading...'
      );

      const response = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData)
      });

      if (!response.ok) throw new Error('Generation failed');

      await response.json();
      stopProcessing();
      
      // Handle success - maybe redirect to download page
      window.location.href = '/download';
      
    } catch (error) {
      stopProcessing();
      console.error('Generation failed:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      handleFileUpload(selectedFile);
    } else {
      alert('Please select a file first');
    }
  };

  const handleGenerateClick = () => {
    const examData = {
      session_id: 'example-session',
      questions: [],
      metadata: { department: 'AU' }
    };
    handleExamGeneration(examData);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Processing Modal Example</h2>
      
      {/* File Upload Section */}
      <div style={{ marginBottom: '20px' }}>
        <input type="file" accept=".xlsx" onChange={handleFileSelect} />
        <button 
          onClick={handleUploadClick}
          disabled={!selectedFile}
          style={{ marginLeft: '10px' }}
        >
          Upload File
        </button>
      </div>
      
      {/* Exam Generation Section */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={handleGenerateClick}>
          Generate Exam
        </button>
      </div>

      {/* Processing Modal */}
      <ProcessingModal 
        isVisible={processingState.isProcessing}
        title={processingState.title}
        subtitle={processingState.subtitle}
      />
    </div>
  );
};

export default ExampleUsage;
