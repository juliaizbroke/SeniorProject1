"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Alert,
  Card,
  CardContent,
  Link,
  Button,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
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

  return (
    <Box minHeight="100vh" sx={{ bgcolor: "#e3e9f7", color: "#222", position: "relative", overflow: "hidden" }}>
      <Navbar />
      <Box py={6} sx={{ position: "relative", zIndex: 1 }}>
        <Box sx={{ px: 13 }}>
          <Grid container justifyContent="space-between" alignItems="center" mb={2}>
            <Grid item>
              <Typography variant="h4" sx={{ color: "#1a1a1a", fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.5 }}>
                Upload Excel File
              </Typography>
              <Typography sx={{ fontSize: "15px", color: "#333", fontWeight: 400, lineHeight: 1.5 }}>
                Upload your Excel file containing exam data
              </Typography>
            </Grid>
            <Grid item>
              <Link href="/template.xlsx" underline="hover" fontWeight="bold" sx={{ color: "#1a1a1a", fontWeight: 700, lineHeight: 1.5, letterSpacing: 0.5 }}>
                Download Excel Template
              </Link>
              {/* Upload Exam Paper Template Button */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                  variant="contained"
                  component="label"
                  sx={{ ml: 2 }}
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
                  <Typography sx={{ ml: 2, color: 'green', fontWeight: 500 }}>
                    Template uploaded: {uploadedTemplateName}
                  </Typography>
                )}
                {templateUploadStatus === 'error' && (
                  <Typography sx={{ ml: 2, color: 'red', fontWeight: 500 }}>
                    Failed to upload template.
                  </Typography>
                )}
              </Box>
              
              {/* Show uploaded template status */}
              {uploadedTemplateExists && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: 'green', fontWeight: 500 }}>
                    ✓ Uploaded template exists: {uploadedTemplateName || "uploaded_template.docx"}
                  </Typography>
                </Box>
              )}
              
              {/* Template Selection */}
              {uploadedTemplateExists && (
                <Box sx={{ mt: 2 }}>
                  <FormControl component="fieldset">
                    <FormLabel component="legend" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                      Choose Template:
                    </FormLabel>
                    <RadioGroup
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value as "default" | "uploaded")}
                      row
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
                    size="small"
                    onClick={deleteUploadedTemplate}
                    sx={{ ml: 2 }}
                  >
                    Delete Uploaded Template
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Card className="glassy-card"
          sx={{
            background: 'rgba(255,255,255,0.12)',
            boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderRadius: 2,
            border: '1px solid rgba(255,255,255,0.18)',
            p: 4,
            mb: 6,
          }}>
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
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
                <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />
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
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
}