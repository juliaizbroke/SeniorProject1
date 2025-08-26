"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Alert,
  Link,
  Button,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import FileUpload from "../../components/FileUpload";
import Navbar from "../../components/Navbar";
import { uploadExcel } from "../../utils/api";
import { UploadResponse } from "../../types";

export default function HomePage() {
  const [error, setError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [templateUploadStatus, setTemplateUploadStatus] = useState<"success" | "error" | "">("");
  const [selectedTemplate, setSelectedTemplate] = useState<"default" | "uploaded">("default");
  const [uploadedTemplateName, setUploadedTemplateName] = useState<string>("");
  const [uploadedTemplateExists, setUploadedTemplateExists] = useState<boolean>(false);
  const router = useRouter();

  // Check if uploaded template exists on component mount
  useEffect(() => {
    checkUploadedTemplate();
  }, []);

  const checkUploadedTemplate = async () => {
    try {
      const response = await fetch('http://localhost:5000/check-template');
      if (response.ok) {
        const data = await response.json();
        setUploadedTemplateExists(data.exists);
        if (data.exists && data.filename) {
          setUploadedTemplateName(data.filename);
        }
      }
    } catch (error) {
      console.error('Error checking template:', error);
    }
  };

  const deleteUploadedTemplate = async () => {
    try {
      const response = await fetch('http://localhost:5000/delete-template', {
        method: 'DELETE',
      });
      if (response.ok) {
        setUploadedTemplateExists(false);
        setUploadedTemplateName("");
        setSelectedTemplate("default");
        setTemplateUploadStatus("");
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  // Handle file upload with progress
  const handleFileUpload = async (file: File): Promise<void> => {
    // This is just for the progress display
    // The actual upload happens when user clicks "Upload and Process" button
    // So we'll just simulate success here
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`File ${file.name} ready for processing`);
        resolve();
      }, 500);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setLoading(true);
      setError("");
      const response: UploadResponse = await uploadExcel(selectedFile);
      localStorage.setItem("questions", JSON.stringify(response.questions));
      localStorage.setItem("metadata", JSON.stringify(response.metadata));
      localStorage.setItem("sessionId", response.session_id);
      localStorage.setItem("selectedTemplate", selectedTemplate); // Store template choice
      router.push("/category");
    } catch (err) {
      setError(
        "Failed to upload file. Please make sure it follows the correct format."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('http://localhost:5000/download-template');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'question-bank-template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download template');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  return (
    <Box minHeight="100vh" sx={{ bgcolor: "#e3e9f7", color: "#222", position: "relative", overflow: "hidden" }}>
      <Navbar />
      <Box py={6} sx={{ position: "relative", zIndex: 1, px:10 }}>
        <Container maxWidth="xl" sx={{ px: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={4} sx={{ minHeight: '60vh' }}>
            {/* Left Half - Main Upload Section */}
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ color: "#1a1a1a", fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.5, mb: 1 }}>
                Upload Excel File
              </Typography>
              <Typography sx={{ fontSize: "15px", color: "#333", fontWeight: 400, lineHeight: 1.5, mb: 3 }}>
                Upload your Excel file containing exam data
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                sx={{ 
                  color: "#1e40af", 
                  borderColor: "#1e40af",
                  fontWeight: 600, 
                  fontSize: "14px",
                  textTransform: 'none',
                  mb: 3,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: "#1e40af",
                    color: "white",
                    borderColor: "#1e40af",
                  }
                }}
              >
                Download Excel Template
              </Button>

              {/* Requirements Section */}
              <Box mb={3}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "#1a1a1a" }}>
                  Requirements
                </Typography>
                <ul style={{ marginLeft: "1rem", fontSize: "0.875rem" }}>
                  <li>Sheet 1: Exam metadata (subject, lecturer, date, etc.)</li>
                  <li>Sheet 2: Multiple Choice Questions</li>
                  <li>Sheet 3: True/False</li>
                  <li>Sheet 4: Matching</li>
                  <li>Sheet 5: Short/Long Questions</li>
                </ul>
              </Box>

              {/* File Upload */}
              <Box mb={3}>
                <FileUpload 
                  onFileSelect={setSelectedFile} 
                  onFileUpload={handleFileUpload}
                  showProgress={true}
                />
              </Box>

              {/* Upload Button */}
              <Box textAlign="center">
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ height: "48px", textTransform: "none", bgcolor: "#1e3a8a", color: "#fff", fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: "#12264a" } }}
                  disabled={!selectedFile || loading}
                  onClick={handleUpload}
                >
                  {loading ? "Processing..." : "Upload and Process"}
                </Button>
              </Box>
            </Grid>

            {/* Right Half - Template Management */}
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ color: "#1a1a1a", fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.5, mb: 1 }}>
                Exam Paper Template
              </Typography>
              <Typography sx={{ fontSize: "15px", color: "#333", fontWeight: 400, lineHeight: 1.5, mb: 3 }}>
                Upload and manage your custom exam paper template
              </Typography>

              {/* Upload Exam Paper Template Button */}
              <Box sx={{ mb: 3 }}>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                  sx={{ height: "48px", textTransform: "none", bgcolor: "#059669", color: "#fff", fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: "#047857" } }}
                >
                  Upload Exam Paper Template
                  <input
                    type="file"
                    accept=".docx"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('template', file);
                      // Send to Flask backend API endpoint
                      const res = await fetch('http://localhost:5000/upload-template', {
                        method: 'POST',
                        body: formData,
                      });
                      if (res.ok) {
                        const response = await res.json();
                        setTemplateUploadStatus('success');
                        setUploadedTemplateName(response.filename || file.name);
                        setSelectedTemplate('uploaded'); // Auto-select uploaded template
                        setUploadedTemplateExists(true); // Update exists status
                      } else {
                        setTemplateUploadStatus('error');
                      }
                    }}
                  />
                </Button>
                
                {templateUploadStatus === 'success' && (
                  <Typography sx={{ mt: 2, color: 'green', fontWeight: 500, textAlign: 'center' }}>
                    Template uploaded: {uploadedTemplateName}
                  </Typography>
                )}
                {templateUploadStatus === 'error' && (
                  <Typography sx={{ mt: 2, color: 'red', fontWeight: 500, textAlign: 'center' }}>
                    Failed to upload template.
                  </Typography>
                )}
              </Box>
              
              {/* Show uploaded template status */}
              {uploadedTemplateExists && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <Typography sx={{ color: '#059669', fontWeight: 600, textAlign: 'center' }}>
                    ✓ Uploaded template exists: {uploadedTemplateName || "uploaded_template.docx"}
                  </Typography>
                </Box>
              )}
              
              {/* Template Selection */}
              {uploadedTemplateExists && (
                <Box sx={{ mb: 3 }}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ fontWeight: 'bold', color: '#1a1a1a', mb: 2 }}>
                      Choose Template:
                    </FormLabel>
                    <RadioGroup
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value as "default" | "uploaded")}
                    >
                      <FormControlLabel 
                        value="default" 
                        control={<Radio />} 
                        label="Default Template" 
                      />
                      <FormControlLabel 
                        value="uploaded" 
                        control={<Radio />} 
                        label={`Uploaded: ${uploadedTemplateName || "uploaded_template.docx"}`} 
                      />
                    </RadioGroup>
                  </FormControl>
                  
                  {/* Delete Template Button */}
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={deleteUploadedTemplate}
                    sx={{ mt: 2, textTransform: "none" }}
                  >
                    Delete Uploaded Template
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}