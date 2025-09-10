"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Container,
  Typography,
  Alert,
  Button,
  Grid,
  MenuItem,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
} from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import FileUpload from "../../components/FileUpload";
import Navbar from "../../components/Navbar";
import { uploadExcel } from "../../utils/api";
import { UploadResponse } from "../../types";

export default function HomePage() {
  const [error, setError] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Word template states
  const [wordTemplates, setWordTemplates] = useState<Array<{ id: string; name: string; isDefault: boolean }>>([]);
  const [selectedWordTemplate, setSelectedWordTemplate] = useState<string>("default");
  const [wordTemplateMenuAnchor, setWordTemplateMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedWordTemplateForMenu, setSelectedWordTemplateForMenu] = useState<string>("");
  const [isWordUploading, setIsWordUploading] = useState<boolean>(false);
  const [wordUploadProgress, setWordUploadProgress] = useState<number>(0);
  
  const router = useRouter();

  // Check if uploaded template exists on component mount
  useEffect(() => {
    loadWordTemplates();
  }, []);

  const loadWordTemplates = async () => {
    try {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/word-templates`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded word templates:', data); // Debug log
        const templates = data.templates || data; // Handle both formats
        setWordTemplates(templates);
        
        // Set default selected template to the one marked as default
        const defaultTemplate = templates.find((t: { id: string; name: string; isDefault: boolean }) => t.isDefault);
        if (defaultTemplate) {
          setSelectedWordTemplate(defaultTemplate.id);
        } else if (templates.length > 0) {
          // If no default found, use first template
          setSelectedWordTemplate(templates[0].id);
        }
      } else {
        console.error('Failed to load word templates:', response.status);
        // Add some sample templates for testing if backend is not ready
        const sampleTemplates = [
          { id: 'exam-paper-tpl_clean.docx', name: 'exam-paper-tpl_clean.docx', isDefault: true }
        ];
        setWordTemplates(sampleTemplates);
        setSelectedWordTemplate('exam-paper-tpl_clean.docx');
      }
    } catch (error) {
      console.error('Error loading word templates:', error);
      // Add some sample templates for testing if backend is not ready
      const sampleTemplates = [
        { id: 'exam-paper-tpl_clean.docx', name: 'exam-paper-tpl_clean.docx', isDefault: true }
      ];
      setWordTemplates(sampleTemplates);
      setSelectedWordTemplate('exam-paper-tpl_clean.docx');
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
      localStorage.setItem("selectedTemplate", "default"); // Store excel template choice
      localStorage.setItem("selectedWordTemplate", selectedWordTemplate); // Store word template choice
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
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/download-template`);
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

  const downloadWordTemplate = async () => {
    try {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/download-word-template`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exam-paper-template.docx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download word template');
      }
    } catch (error) {
      console.error('Error downloading word template:', error);
      alert('Failed to download word template');
    }
  };

  const handleWordTemplateUpload = async (file: File) => {
    setIsWordUploading(true);
    setWordUploadProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setWordUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const formData = new FormData();
      formData.append('file', file);
      
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload-word-template`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (response.ok) {
        setWordUploadProgress(100);
        try {
          const result = await response.json();
          console.log('Upload successful:', result);
        } catch {
          console.log('Upload successful but no JSON response');
        }
        await loadWordTemplates(); // Reload templates
        
        setTimeout(() => {
          setIsWordUploading(false);
          // Keep progress bar at 100% - don't reset to 0
        }, 1000);
      } else {
        // Get more detailed error information
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `Upload failed (${response.status})`;
        } catch {
          errorMessage = `Upload failed (${response.status}: ${response.statusText})`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error uploading word template:', error);
      
      // More specific error handling
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof TypeError && errorMessage.includes('fetch')) {
        alert('Failed to connect to server. Please make sure the backend is running.');
      } else if (errorMessage.includes('404')) {
        alert('Upload endpoint not found. The backend may not support word template uploads yet.');
      } else {
        alert(`Failed to upload word template: ${errorMessage}`);
      }
      
      setIsWordUploading(false);
      setWordUploadProgress(0);
    }
  };

  const handleWordFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      // Reset progress when starting new upload
      setWordUploadProgress(0);
      handleWordTemplateUpload(file);
    } else if (file) {
      alert('Please select a valid .docx file');
    }
    // Reset input value so same file can be selected again
    event.target.value = '';
  };

  const handleWordTemplateMenuOpen = (event: React.MouseEvent<HTMLElement>, templateId: string) => {
    setWordTemplateMenuAnchor(event.currentTarget);
    setSelectedWordTemplateForMenu(templateId);
  };

  const handleWordTemplateMenuClose = () => {
    setWordTemplateMenuAnchor(null);
    setSelectedWordTemplateForMenu("");
  };

  const makeWordTemplateDefault = async (templateId: string) => {
    try {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/word-templates/${templateId}/make-default`, {
        method: 'POST',
      });
      if (response.ok) {
        await loadWordTemplates();
        setSelectedWordTemplate(templateId);
      } else {
        alert('Failed to make template default');
      }
    } catch (error) {
      console.error('Error making template default:', error);
      alert('Failed to make template default');
    }
    handleWordTemplateMenuClose();
  };

  const deleteWordTemplate = async (templateId: string) => {
    // Prevent deletion of the origin template only
    if (templateId === 'exam-paper-tpl_clean.docx') {
      alert('Cannot delete the original template');
      return;
    }
    
    const template = wordTemplates.find(t => t.id === templateId);
    let confirmMessage = 'Are you sure you want to delete this template?';
    
    // If deleting the current default, warn user
    if (template && template.isDefault) {
      confirmMessage = 'This is the current default template. Deleting it will reset the default to the original template. Continue?';
    }
    
    if (confirm(confirmMessage)) {
      try {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/word-templates/${templateId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          await loadWordTemplates();
          if (selectedWordTemplate === templateId) {
            // Set to the default template (which will be origin after deletion)
            setSelectedWordTemplate('exam-paper-tpl_clean.docx');
          }
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to delete template');
        }
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
    handleWordTemplateMenuClose();
  };

  return (
    <Box 
      minHeight="100vh" 
      maxHeight="100vh"
      sx={{ 
        bgcolor: "#e3e9f7", 
        color: "#222", 
        position: "relative", 
        overflow: "hidden" // Prevent page scrolling
      }}
    >
      <Navbar />
      <Box 
        py={2} 
        sx={{ 
          position: "relative", 
          zIndex: 1, 
          px: 6,
          height: "calc(100vh - 64px)", // Adjust for navbar height
          overflow: "hidden" // Prevent ALL scrolling - both page and internal
        }}
      >
        <Container 
          maxWidth="xl" 
          sx={{ 
            px: 2,
            height: "100%",
            overflow: "hidden" // Prevent container from scrolling
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          <Grid 
            container 
            spacing={2} 
            sx={{ 
              height: '100%',
              overflow: 'hidden' // Prevent all overflow
            }}
          >
            {/* Left Half - Excel Upload Section */}
            <Grid 
              item 
              xs={12} 
              md={6}
              sx={{
                height: '100%',
                overflow: 'hidden', // No scrollbars
                display: 'flex',
                flexDirection: 'column',
                pr: 2 // Add padding-right to create gap from divider
              }}
            >
              <Typography variant="h4" sx={{ color: "#1a1a1a", fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.5, mb: 1 }}>
                Upload Excel File (Question Bank)
              </Typography>
              <Typography sx={{ fontSize: "15px", color: "#333", fontWeight: 400, lineHeight: 1.5, mb: 3 }}>
                Upload your Excel file containing exam data
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
                sx={{ 
                  color: "#059669", 
                  borderColor: "#059669",
                  fontWeight: 600, 
                  fontSize: "14px",
                  textTransform: 'none',
                  mb: 3,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  width: 'fit-content', // Make button fit content instead of full width
                  '&:hover': {
                    backgroundColor: "#059669",
                    color: "white",
                    borderColor: "#059669",
                  }
                }}
              >
                Download Excel Template
              </Button>

              {/* Requirements Section */}
              <Box mb={2}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "#1a1a1a" }}>
                  Excel Requirements
                </Typography>
                <ul style={{ marginLeft: "1rem", fontSize: "0.875rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                  <li>Sheet 1: Exam metadata (subject, lecturer, date, etc.)</li>
                  <li>Sheet 2: Multiple Choice Questions</li>
                  <li>Sheet 3: True/False</li>
                  <li>Sheet 4: Matching</li>
                  <li>Sheet 5: Short/Long Questions</li>
                </ul>
              </Box>

              {/* File Upload */}
              <Box mb={2}>
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
                  sx={{ height: "48px", textTransform: "none", bgcolor: "#059669", color: "#fff", fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: "#047857" } }}
                  disabled={!selectedFile || loading}
                  onClick={handleUpload}
                >
                  {loading ? "Processing..." : "Upload and Process"}
                </Button>
              </Box>
            </Grid>

            {/* Center Divider */}
            <Grid item xs={12} md={0} sx={{ display: { xs: 'block', md: 'none' } }}>
              <Divider sx={{ my: 2 }} />
            </Grid>
            <Box 
              sx={{ 
                display: { xs: 'none', md: 'block' }, 
                position: 'absolute', 
                left: '50%', 
                top: 0, 
                bottom: 0, 
                width: '1px', 
                bgcolor: '#d1d5db', 
                transform: 'translateX(-50%)',
                zIndex: 1
              }} 
            />

            {/* Right Half - Word Template Management */}
            <Grid 
              item 
              xs={12} 
              md={6}
              sx={{
                height: '100%',
                overflow: 'hidden', // No scrollbars
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ ml: 2 }}> {/* Add margin-left to create gap from divider */}
                <Typography variant="h4" sx={{ color: "#1a1a1a", fontWeight: 700, lineHeight: 1.2, letterSpacing: 0.5, mb: 1 }}>
                  Upload Word Template (Optional)
                </Typography>
                <Typography sx={{ fontSize: "15px", color: "#333", fontWeight: 400, lineHeight: 1.5, mb: 3 }}>
                  Upload your Word template containing exam paper questions
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadWordTemplate}
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
                    width: 'fit-content',
                    '&:hover': {
                      backgroundColor: "#1e40af",
                      color: "white",
                      borderColor: "#1e40af",
                    }
                  }}
                >
                  Download Word Template
                </Button>

                {/* Requirements Section */}
                <Box mb={3}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: "#1a1a1a" }}>
                    Word Template Requirements
                  </Typography>
                  <ul style={{ marginLeft: "1rem", fontSize: "0.875rem" }}>
                    <li>Edit the downloaded word template to include your specific exam details</li>
                    <li>Try not to remove Jinja codes.</li>
                  </ul>
                </Box>

                {/* Upload Word Template Button */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<UploadIcon />}
                      disabled={isWordUploading}
                      sx={{ 
                        textTransform: "none", 
                        bgcolor: "#1e40af", 
                        color: "#fff", 
                        fontWeight: 600, 
                        borderRadius: 2, 
                        px: 3,
                        py: 1,
                        fontSize: "14px",
                        minWidth: 200, // Fixed minimum width for button
                        '&:hover': { bgcolor: "#1d4ed8" },
                        '&:disabled': { bgcolor: "#9ca3af" }
                      }}
                    >
                      {isWordUploading ? "Uploading..." : "Upload Word Template"}
                      <input
                        type="file"
                        accept=".docx"
                        hidden
                        onChange={handleWordFileSelect}
                      />
                    </Button>
                    
                    {(isWordUploading || wordUploadProgress > 0) && (
                      <Box sx={{ flexGrow: 1, ml: 1, mr: 2 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={wordUploadProgress} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            bgcolor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#1e40af',
                              borderRadius: 4
                            }
                          }} 
                        />
                        <Typography variant="caption" sx={{ color: '#6b7280', mt: 0.5, display: 'block', textAlign: 'center' }}>
                          {wordUploadProgress}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Template Selection */}
                <Box mb={2}>
                {/* Title and Selected Template in Same Line */}
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mb: 2
                  }}
                >
                  <Typography sx={{ fontWeight: 'bold', color: '#1a1a1a', flexShrink: 0 }}>
                    Selected Template:
                  </Typography>
                  
                  {/* Currently Selected Template Box */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      p: 1,
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      bgcolor: '#f9fafb',
                      flexGrow: 1,
                      minWidth: 0 // Allow text truncation if needed
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      {wordTemplates.find(t => t.id === selectedWordTemplate)?.isDefault && (
                        <StarIcon sx={{ fontSize: 16, color: '#f59e0b', flexShrink: 0 }} />
                      )}
                      <Typography variant="body2" sx={{ pl: 1, fontWeight: 'medium', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {wordTemplates.find(t => t.id === selectedWordTemplate)?.name || 'No template selected'}
                        {selectedWordTemplate === 'exam-paper-tpl_clean.docx' && (
                          <span style={{ color: '#6b7280', fontWeight: 'normal' }}> (origin)</span>
                        )}
                        {wordTemplates.find(t => t.id === selectedWordTemplate)?.isDefault && selectedWordTemplate !== 'exam-paper-tpl_clean.docx' && (
                          <span style={{ color: '#6b7280', fontWeight: 'normal' }}> (default)</span>
                        )}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={(e) => handleWordTemplateMenuOpen(e, selectedWordTemplate)}
                      size="small"
                      sx={{ 
                        color: '#6b7280',
                        flexShrink: 0,
                        '&:hover': {
                          color: '#374151',
                          bgcolor: '#e5e7eb'
                        }
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Template List - Fixed Height with Scroll */}
                <Box 
                  sx={{ 
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    bgcolor: 'white',
                    height: '205px', // Reduced height
                    overflowY: 'auto' // Scrollable content
                  }}
                >
                  {wordTemplates.map((template) => (
                    <Box
                      key={template.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        borderBottom: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        bgcolor: template.id === selectedWordTemplate ? '#eff6ff' : 'transparent',
                        '&:hover': {
                          bgcolor: template.id === selectedWordTemplate ? '#dbeafe' : '#f9fafb'
                        },
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                      onClick={() => setSelectedWordTemplate(template.id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {template.isDefault && <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />}
                        <Typography variant="body2" sx={{ pl : 1 }}>
                          {template.name}
                          {template.id === 'exam-paper-tpl_clean.docx' && (
                            <span style={{ color: '#6b7280', fontWeight: 'normal' }}> (origin)</span>
                          )}
                          {template.isDefault && template.id !== 'exam-paper-tpl_clean.docx' && (
                            <span style={{ color: '#6b7280', fontWeight: 'normal' }}> (default)</span>
                          )}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWordTemplateMenuOpen(e, template.id);
                        }}
                        size="small"
                        sx={{ 
                          color: '#6b7280',
                          '&:hover': {
                            color: '#374151',
                            bgcolor: '#e5e7eb'
                          }
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Template Actions Menu */}
              <Menu
                anchorEl={wordTemplateMenuAnchor}
                open={Boolean(wordTemplateMenuAnchor)}
                onClose={handleWordTemplateMenuClose}
              >
                {/* Show "Make Default" only if template is not already default */}
                {!wordTemplates.find(t => t.id === selectedWordTemplateForMenu)?.isDefault && (
                  <MenuItem onClick={() => makeWordTemplateDefault(selectedWordTemplateForMenu)}>
                    <ListItemIcon>
                      <StarIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Make Default</ListItemText>
                  </MenuItem>
                )}
                
                {/* Show "Delete Template" only if it's not the origin template */}
                {selectedWordTemplateForMenu !== 'exam-paper-tpl_clean.docx' && (
                  <MenuItem onClick={() => deleteWordTemplate(selectedWordTemplateForMenu)}>
                    <ListItemIcon>
                      <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete Template</ListItemText>
                  </MenuItem>
                )}
                
                {/* Show message if it's the origin template */}
                {selectedWordTemplateForMenu === 'exam-paper-tpl_clean.docx' && (
                  <MenuItem disabled>
                    <ListItemText>Original template cannot be deleted</ListItemText>
                  </MenuItem>
                )}
              </Menu>
              </Box> {/* Close the ml: 2 wrapper */}
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}