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
  Download as DownloadIcon,
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
      const response = await fetch('http://localhost:5001/api/similarity/create-session', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
      } else {
        setError('Failed to create analysis session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to connect to server');
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

    if (!sessionId) {
      setError('No active session. Please refresh the page.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setError('');
      
      // Step 1: Upload files
      setAnalysisStep('Uploading documents...');
      const formData = new FormData();
      uploadedFiles.forEach(item => {
        formData.append('files', item.file);
      });

      const uploadResponse = await fetch(`http://localhost:5001/api/similarity/upload/${sessionId}`, {
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
      
      const analyzeResponse = await fetch(`http://localhost:5001/api/similarity/analyze/${sessionId}`, {
        method: 'POST'
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      // Step 3: Get results
      setAnalysisStep('Generating similarity matrix...');
      
      const resultsResponse = await fetch(`http://localhost:5001/api/similarity/results/${sessionId}`);
      
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

  const downloadResults = async () => {
    if (!analysisResults) return;
    
    const dataStr = JSON.stringify(analysisResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `similarity_analysis_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

    return (
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Similarity Matrix
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  {filenames.map((name, index) => (
                    <TableCell key={index} align="center">
                      <Typography variant="caption" sx={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
                        {name}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {matrix.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell component="th" scope="row">
                      <Typography variant="caption">{filenames[rowIndex]}</Typography>
                    </TableCell>
                    {row.map((score, colIndex) => (
                      <TableCell 
                        key={colIndex} 
                        align="center"
                        sx={{ 
                          backgroundColor: rowIndex === colIndex ? '#f5f5f5' : getSimilarityColor(score) + '20',
                          cursor: rowIndex !== colIndex ? 'pointer' : 'default'
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
                            fontWeight: rowIndex === colIndex ? 'bold' : 'normal',
                            color: rowIndex === colIndex ? '#666' : '#000'
                          }}
                        >
                          {score.toFixed(3)}
                        </Typography>
                        {rowIndex !== colIndex && (
                          <Typography variant="caption" display="block" sx={{ color: getSimilarityColor(score) }}>
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
      <Box minHeight="100vh" sx={{ bgcolor: "#e3e9f7", color: "#222" }}>
        <Navbar />
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Similarity Analysis Results
            </Typography>
            <Box>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadResults}
                sx={{ mr: 2 }}
              >
                Export Results
              </Button>
              <Button
                variant="contained"
                onClick={resetAnalysis}
              >
                New Analysis
              </Button>
            </Box>
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
    <Box minHeight="100vh" sx={{ bgcolor: "#e3e9f7", color: "#222" }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Document Similarity Checker
        </Typography>
        <Typography variant="body1" sx={{ color: "#666", mb: 4 }}>
          Upload multiple Word documents to analyze similarity between exam papers and detect potential duplicates.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Upload Area */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? '#2196f3' : '#ddd',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? '#f3f9ff' : '#fafafa',
                transition: 'all 0.3s ease',
                minHeight: '160px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <input {...getInputProps()} />
              <UploadIcon sx={{ fontSize: 48, color: '#666', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                {isDragActive ? 'Drop documents here' : 'Drag & drop Word documents (.docx)'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Or click to select files • At least 2 documents required
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Uploaded Documents ({uploadedFiles.length})
              </Typography>
              <Grid container spacing={2}>
                {uploadedFiles.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <Paper sx={{ p: 2, position: 'relative' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <FileIcon sx={{ mr: 1, color: '#1976d2' }} />
                        <Typography variant="body2" sx={{ flexGrow: 1, wordBreak: 'break-word' }}>
                          {item.file.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => removeFile(item.id, e)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      {item.status === 'uploading' && (
                        <LinearProgress variant="determinate" value={item.progress} sx={{ mb: 1 }} />
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          icon={item.status === 'completed' ? <CheckCircleIcon /> : undefined}
                          label={item.status === 'completed' ? 'Ready' : 'Uploading...'}
                          color={item.status === 'completed' ? 'success' : 'default'}
                          size="small"
                        />
                        <Typography variant="caption" color="textSecondary">
                          {(item.file.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        )}

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
  );
}
