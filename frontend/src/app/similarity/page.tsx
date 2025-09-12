"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Alert,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
  Analytics as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import Navbar from '../../components/Navbar';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

interface SimilarityMatrix {
  filenames: string[];
  matrix: number[][];
}

interface ComparisonDetail {
  similarity_score: number;
  tfidf_score: number;
  semantic_score?: number;
  method_used: string;
  matching_questions: Array<{
    question1_index: number;
    question2_index: number;
    question1: string;
    question2: string;
    similarity: number;
  }>;
  processing_time: number;
}

interface AnalysisResults {
  session_info: {
    session_id: string;
    timestamp: string;
  };
  similarity_matrix: SimilarityMatrix;
  detailed_comparisons: { [key: string]: ComparisonDetail };
}

export default function SimilarityPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>("");

  // Create session on component mount
  useEffect(() => {
    createSession();
    
    // Cleanup on unmount
    return () => {
      if (sessionId) {
        cleanupSession(sessionId);
      }
    };
  }, [sessionId]);

  const createSession = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/similarity/create-session`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        return data.session_id;
      } else {
        setError('Failed to create analysis session');
        return null;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to connect to server');
      return null;
    }
  };

  const cleanupSession = async (id: string) => {
    try {
      await fetch(`http://localhost:5001/api/similarity/cleanup/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error cleaning up session:', error);
    }
  };

  // File upload simulation
  const simulateUpload = useCallback(async (file: File) => {
    const id = `${file.name}-${Date.now()}`;
    
    const newItem: UploadedFile = {
      id,
      file,
      progress: 0,
      status: 'uploading'
    };
    
    setUploadedFiles(prev => [...prev, newItem]);

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadedFiles(prev => 
        prev.map(item => 
          item.id === id ? { ...item, progress } : item
        )
      );
    }

    // Mark as completed
    setUploadedFiles(prev => 
      prev.map(item => 
        item.id === id ? { ...item, status: 'completed' } : item
      )
    );
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await simulateUpload(file);
    }
  }, [simulateUpload]);

  const removeFile = useCallback((fileId: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setUploadedFiles(prev => prev.filter(item => item.id !== fileId));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return '#f44336'; // High similarity - Red
    if (score >= 0.6) return '#ff9800'; // Medium similarity - Orange  
    if (score >= 0.4) return '#ffeb3b'; // Low-medium similarity - Yellow
    return '#4caf50'; // Low similarity - Green
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    if (score >= 0.4) return 'Low-Medium';
    return 'Low';
  };

  const analyzeDocuments = async () => {
    if (uploadedFiles.length < 2) {
      setError('At least 2 documents are required for comparison');
      return;
    }

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      setError('No active session. Creating new session...');
      currentSessionId = await createSession();
      if (!currentSessionId) {
        setError('Failed to create session. Please refresh the page.');
        return;
      }
    }

    try {
      setIsAnalyzing(true);
      setError('');
      
      console.log('Starting analysis with session ID:', currentSessionId);
      
      // Step 1: Upload files
      setAnalysisStep('Uploading documents...');
      const formData = new FormData();
      uploadedFiles.forEach(item => {
        formData.append('files', item.file);
      });

      const uploadResponse = await fetch(`http://localhost:5001/api/similarity/upload/${currentSessionId}`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Step 2: Analyze
      setAnalysisStep('Extracting questions from documents...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // UI feedback delay

      setAnalysisStep('Running TF-IDF similarity analysis...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAnalysisStep('Performing semantic analysis...');
      
      const analyzeResponse = await fetch(`http://localhost:5001/api/similarity/analyze/${currentSessionId}`, {
        method: 'POST'
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      // Step 3: Get results
      setAnalysisStep('Generating similarity matrix...');
      
      const resultsResponse = await fetch(`http://localhost:5001/api/similarity/results/${currentSessionId}`);
      
      if (!resultsResponse.ok) {
        const errorData = await resultsResponse.json();
        throw new Error(errorData.error || 'Failed to get results');
      }

      const resultsData = await resultsResponse.json();
      setAnalysisResults(resultsData.results);
      setShowResults(true);

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const resetAnalysis = () => {
    setUploadedFiles([]);
    setAnalysisResults(null);
    setShowResults(false);
    setSelectedComparison(null);
    setError('');
    createSession(); // Create new session
  };

  const renderSimilarityMatrix = () => {
    if (!analysisResults?.similarity_matrix) return null;

    const { filenames, matrix } = analysisResults.similarity_matrix;

    const getDisplayName = (filename: string) => {
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
      return nameWithoutExt.length > 25 ? nameWithoutExt.substring(0, 22) + "..." : nameWithoutExt;
    };

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Similarity Matrix
          </Typography>
          
          <TableContainer component={Paper} sx={{ 
            maxHeight: 600,
            overflowX: 'auto',
            '&::-webkit-scrollbar': {
              height: 8,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: '#f5f5f5',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#bdbdbd',
              borderRadius: 4,
            }
          }}>
            <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, backgroundColor: '#f9f9f9' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Documents
                    </Typography>
                  </TableCell>
                  {filenames.map((name, index) => (
                    <TableCell 
                      key={index} 
                      align="center"
                      sx={{ 
                        fontWeight: 500,
                        backgroundColor: '#f9f9f9',
                        minWidth: 120,
                        maxWidth: 200,
                        px: 1
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 500,
                          wordBreak: 'break-word',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          maxWidth: 150, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          // Use vertical text only on smaller screens
                          '@media (max-width: 900px)': {
                            writingMode: 'vertical-lr',
                            textOrientation: 'mixed',
                          }
                        }}
                        title={name}
                      >
                        {getDisplayName(name)}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {matrix.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell 
                      component="th" 
                      scope="row"
                      align="center"
                      sx={{ 
                        fontWeight: 500,
                        backgroundColor: '#f9f9f9',
                        position: 'sticky',
                        left: 0,
                        zIndex: 1
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        title={filenames[rowIndex]}
                        sx={{ 
                          maxWidth: 150, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          textAlign: 'center'
                        }}
                      >
                        {getDisplayName(filenames[rowIndex])}
                      </Typography>
                    </TableCell>
                    {row.map((score, colIndex) => (
                      <TableCell 
                        key={colIndex} 
                        align="center"
                        sx={{ 
                          backgroundColor: rowIndex === colIndex 
                            ? '#e8f4f8' 
                            : `${getSimilarityColor(score)}20`,
                          cursor: rowIndex !== colIndex ? 'pointer' : 'default',
                          '&:hover': rowIndex !== colIndex ? {
                            backgroundColor: `${getSimilarityColor(score)}40`,
                          } : {},
                          borderLeft: rowIndex !== colIndex ? `3px solid ${getSimilarityColor(score)}` : 'none'
                        }}
                        onClick={() => {
                          if (rowIndex !== colIndex) {
                            const comparisonKey = `${filenames[rowIndex]}_vs_${filenames[colIndex]}`;
                            const reverseKey = `${filenames[colIndex]}_vs_${filenames[rowIndex]}`;
                            const key = analysisResults.detailed_comparisons[comparisonKey] ? comparisonKey : reverseKey;
                            setSelectedComparison(key);
                          }
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: rowIndex === colIndex ? 'bold' : 600,
                            color: rowIndex === colIndex ? '#666' : '#000',
                            mb: 0.5
                          }}
                        >
                          {score.toFixed(3)}
                        </Typography>
                        {rowIndex !== colIndex && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: getSimilarityColor(score),
                              fontWeight: 500,
                              fontSize: '0.7rem'
                            }}
                          >
                            {getSimilarityLabel(score)}
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: '#666', fontWeight: 500 }}>
              Similarity levels:
            </Typography>
            {[
              { label: 'Low', color: '#4caf50' },
              { label: 'Medium', color: '#ff9800' },
              { label: 'High', color: '#f44336' }
            ].map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{
                  width: 12,
                  height: 12,
                  backgroundColor: item.color,
                  borderRadius: 1
                }} />
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderComparisonDetails = () => {
    if (!selectedComparison || !analysisResults?.detailed_comparisons[selectedComparison]) {
      return null;
    }

    const comparison = analysisResults.detailed_comparisons[selectedComparison];
    const [file1, file2] = selectedComparison.split('_vs_');

    return (
      <Dialog open={!!selectedComparison} onClose={() => setSelectedComparison(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detailed Comparison: {file1} vs {file2}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: getSimilarityColor(comparison.similarity_score) }}>
                  {(comparison.similarity_score * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2">Overall Similarity</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2"><strong>Method:</strong> {comparison.method_used}</Typography>
                <Typography variant="body2"><strong>TF-IDF Score:</strong> {(comparison.tfidf_score * 100).toFixed(1)}%</Typography>
                {comparison.semantic_score && (
                  <Typography variant="body2"><strong>Semantic Score:</strong> {(comparison.semantic_score * 100).toFixed(1)}%</Typography>
                )}
                <Typography variant="body2"><strong>Processing Time:</strong> {comparison.processing_time}s</Typography>
              </Paper>
            </Grid>
          </Grid>

          {comparison.matching_questions.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Matching Questions ({comparison.matching_questions.length})</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {comparison.matching_questions.map((match, index) => (
                  <Paper key={index} sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Chip 
                          label={`${(match.similarity * 100).toFixed(1)}% match`} 
                          size="small" 
                          sx={{ backgroundColor: getSimilarityColor(match.similarity) + '40' }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Question from {file1}:</Typography>
                        <Typography variant="body2">{match.question1}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Question from {file2}:</Typography>
                        <Typography variant="body2">{match.question2}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </AccordionDetails>
            </Accordion>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedComparison(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (showResults && analysisResults) {
    return (
      <Box minHeight="100vh" sx={{ bgcolor: "#f8fafc", color: "#222" }}>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Similarity Analysis Results
            </Typography>
            <Button
              variant="contained"
              onClick={resetAnalysis}
              sx={{ px: 3, py: 1 }}
            >
              New Analysis
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Analysis completed for {analysisResults.similarity_matrix.filenames.length} documents. 
              Click on any cell in the matrix to view detailed comparison results.
            </Typography>
          </Alert>

          {renderSimilarityMatrix()}
          {renderComparisonDetails()}
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', color: '#222' }}>
      <Navbar />
      <Box 
        sx={{ 
          backgroundColor: 'white',
          minHeight: 'calc(100vh - 96px)',
        }}
      >
        <Container maxWidth="md" sx={{ pt: 6, pb: 8 }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <AnalyticsIcon sx={{ fontSize: 64, color: "#1e3a8a", mb: 2 }} />
            <Typography variant="h3" fontWeight={600} sx={{ mb: 2, color: "#1a1a1a" }}>
              Exam Papers Similarity Checker
            </Typography>
            <Typography variant="body1" sx={{ color: "#666", maxWidth: 700, mx: "auto", lineHeight: 1.6 }}>
              Upload multiple Word documents (.docx) to analyze content similarity between exam papers.
              Our system will compare the documents and identify potential duplicates or overlapping content.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Upload Area */}
          <Paper
            {...getRootProps()}
            sx={{
              bgcolor: uploadedFiles.length > 0 ? '#f8fafc' : 
                       isDragActive ? '#dcfce7' : '#eff6ff',
              border: uploadedFiles.length > 0 ? '2px solid #e2e8f0' :
                      isDragActive ? '2px dashed #059669' : '2px dashed #1e3a8a',
              borderRadius: 3,
              p: 4,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: isDragActive ? '#059669' : '#1e3a8a',
                backgroundColor: isDragActive ? '#dcfce7' : '#f0f9ff',
              },
              minHeight: uploadedFiles.length > 0 ? 'auto' : '300px',
              display: 'flex',
              flexDirection: 'column',
              mb: 4
            }}
          >
            <input {...getInputProps()} />
            
            {/* Empty State */}
            {uploadedFiles.length === 0 && (
              <Box sx={{ 
                textAlign: 'center',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <UploadIcon sx={{ fontSize: 64, mb: 3, color: isDragActive ? '#059669' : '#1e3a8a' }} />
                {isDragActive ? (
                  <Typography variant="h5" sx={{ color: '#059669', fontWeight: 600 }}>
                    Drop your Word files here...
                  </Typography>
                ) : (
                  <Box>
                    <Typography variant="h4" sx={{ color: "#1a1a1a", fontWeight: 600, mb: 2 }}>
                      Upload Exam Papers
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2, color: "#666", fontWeight: 500 }}>
                      Drag and drop your Word documents here
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#888" }}>
                      or click to browse your files
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#888", mt: 1 }}>
                      (Only .docx files are accepted)
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 3, color: '#1a1a1a', fontWeight: 600, textAlign: 'center' }}>
                  Uploaded Files ({uploadedFiles.length})
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {uploadedFiles.map((item) => (
                    <Card
                      key={item.id}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.9)',
                        border: '1px solid #e2e8f0',
                        borderRadius: 2,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                            <FileIcon sx={{ color: '#1e3a8a', mr: 2, fontSize: 32 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 0.5 }}>
                                {item.file.name}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#666' }}>
                                {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                              </Typography>
                              
                              {item.status === 'uploading' && (
                                <Box sx={{ mt: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={item.progress} 
                                    sx={{ height: 6, borderRadius: 3 }}
                                  />
                                  <Typography variant="caption" sx={{ color: '#666', mt: 0.5 }}>
                                    {item.progress}% uploaded
                                  </Typography>
                                </Box>
                              )}
                              
                              {item.status === 'completed' && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 16, mr: 0.5 }} />
                                  <Typography variant="caption" sx={{ color: '#16a34a' }}>
                                    Upload completed
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                          
                          <IconButton 
                            onClick={(event) => removeFile(item.id, event)}
                            sx={{ color: '#ef4444' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

        {/* Analysis Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
            onClick={analyzeDocuments}
            disabled={uploadedFiles.length < 2 || isAnalyzing || uploadedFiles.some(f => f.status !== 'completed')}
            sx={{ px: 4, py: 1.5 }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Similarity'}
          </Button>
          {isAnalyzing && analysisStep && (
            <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
              {analysisStep}
            </Typography>
          )}
        </Box>

        {uploadedFiles.length < 2 && uploadedFiles.length > 0 && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Upload at least one more document to start similarity analysis.
            </Typography>
          </Alert>
        )}
      </Container>
      </Box>
    </Box>
  );
}
