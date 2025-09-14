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

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Component cleanup on unmount
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (sessionId) {
        cleanupSession(sessionId);
      }
    };
  }, [sessionId]); // Depend on sessionId so cleanup works when session changes

  const createSession = async (): Promise<string | null> => {
    if (isCreatingSession || sessionId) {
      console.log('Session creation already in progress or session already exists, skipping...');
      return sessionId || null;
    }

    try {
      setIsCreatingSession(true);
      const response = await fetch(`${API_BASE_URL}/api/similarity/create-session`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      // Handle rate limiting (429) - wait and retry ONLY ONCE
      if (response.status === 429 && data.wait_time) {
        console.log(`Rate limited, waiting ${data.wait_time} seconds...`);
        setError(`Creating session... (waiting ${data.wait_time.toFixed(1)}s)`);
        
        // Wait for the specified time and retry ONCE
        await new Promise(resolve => setTimeout(resolve, (data.wait_time + 0.1) * 1000));
        setError(''); // Clear the waiting message
        
        // Single retry - don't call createSession recursively
        setIsCreatingSession(false); // Reset flag before retry
        const retryResponse = await fetch(`${API_BASE_URL}/api/similarity/create-session`, {
          method: 'POST'
        });
        const retryData = await retryResponse.json();
        
        if (retryResponse.ok && retryData.success) {
          setSessionId(retryData.session_id);
          return retryData.session_id;
        } else {
          setError('Failed to create session after retry');
          return null;
        }
      }
      
      if (response.ok && data.success) {
        setSessionId(data.session_id);
        return data.session_id;
      } else {
        setError(data.message || 'Failed to create analysis session');
        return null;
      }
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to connect to server');
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const cleanupSession = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/similarity/cleanup/${id}`, {
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
      console.log('No session ID found, creating new session...');
      setError('No active session. Creating new session...');
      const newSessionId = await createSession();
      if (!newSessionId) {
        setError('Failed to create session. Please refresh the page.');
        setIsAnalyzing(false);
        return;
      }
      currentSessionId = newSessionId;
    }
    
    console.log('Using session ID for analysis:', currentSessionId);

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

      console.log('Uploading files to session:', currentSessionId);
      const uploadResponse = await fetch(`${API_BASE_URL}/api/similarity/upload/${currentSessionId}`, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', uploadResponse.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Upload failed');
        } catch {
          throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
      }
      
      console.log('Files uploaded successfully');

      // Step 2: Analyze
      setAnalysisStep('Extracting questions from documents...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // UI feedback delay

      setAnalysisStep('Running TF-IDF similarity analysis...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setAnalysisStep('Performing semantic analysis...');
      
      console.log('Starting analysis for session:', currentSessionId);
      const analyzeResponse = await fetch(`${API_BASE_URL}/api/similarity/analyze/${currentSessionId}`, {
        method: 'POST'
      });

      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        console.error('Analysis failed:', analyzeResponse.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Analysis failed');
        } catch {
          throw new Error(`Analysis failed: ${analyzeResponse.status} ${analyzeResponse.statusText}`);
        }
      }
      
      console.log('Analysis completed successfully');

      // Step 3: Get results
      setAnalysisStep('Generating similarity matrix...');
      
      const resultsResponse = await fetch(`${API_BASE_URL}/api/similarity/results/${currentSessionId}`);
      
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

  const resetAnalysis = async () => {
    setUploadedFiles([]);
    setAnalysisResults(null);
    setShowResults(false);
    setSelectedComparison(null);
    setError('');
    
    // Clear the current session ID - let it be created when analysis starts
    setSessionId('');
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
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
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
                          {(score * 100).toFixed(1)}%
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
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h3" sx={{ color: getSimilarityColor(comparison.similarity_score), fontWeight: 'bold' }}>
                  {(comparison.similarity_score * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#666' }}>Overall Similarity</Typography>
                <Typography variant="caption" sx={{ 
                  color: getSimilarityColor(comparison.similarity_score), 
                  fontWeight: 'bold', 
                  mt: 1, 
                  textTransform: 'uppercase' 
                }}>
                  {getSimilarityLabel(comparison.similarity_score)} Risk
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body1" sx={{ mb: 1 }}><strong>Analysis Method:</strong></Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>{comparison.method_used}</Typography>
                
                <Typography variant="body1" sx={{ mb: 1 }}><strong>TF-IDF Score:</strong></Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>{(comparison.tfidf_score * 100).toFixed(1)}%</Typography>
                
                {comparison.semantic_score && (
                  <>
                    <Typography variant="body1" sx={{ mb: 1 }}><strong>Semantic Score:</strong></Typography>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>{(comparison.semantic_score * 100).toFixed(1)}%</Typography>
                  </>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="body1" sx={{ mb: 1 }}><strong>Processing Time:</strong></Typography>
                <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {comparison.processing_time}s
                </Typography>
                
                <Typography variant="body1" sx={{ mb: 1, mt: 2 }}><strong>Questions Found:</strong></Typography>
                <Typography variant="h5" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                  {comparison.matching_questions.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  matching pairs detected
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Risk Level Context */}
          <Paper 
            sx={{ 
              p: 3, 
              mt: 3, 
              mb: 3, 
              backgroundColor: comparison.similarity_score >= 0.75 ? '#ffebee' : 
                              comparison.similarity_score >= 0.50 ? '#fff3e0' : '#e8f5e8',
              border: `2px solid ${comparison.similarity_score >= 0.75 ? '#ffcdd2' : 
                                  comparison.similarity_score >= 0.50 ? '#ffcc02' : '#c8e6c9'}`
            }}
          >
            <Typography variant="h6" sx={{ 
              fontWeight: 600, 
              mb: 2,
              color: comparison.similarity_score >= 0.75 ? '#d32f2f' : 
                     comparison.similarity_score >= 0.50 ? '#f57c00' : '#2e7d32'
            }}>
              📋 Analysis Context
            </Typography>
            <Typography variant="body1" sx={{ 
              color: comparison.similarity_score >= 0.75 ? '#d32f2f' : 
                     comparison.similarity_score >= 0.50 ? '#f57c00' : '#2e7d32',
              lineHeight: 1.6
            }}>
              {comparison.similarity_score >= 0.75 ? (
                <>
                  <strong>High Risk (≥75%):</strong> Documents contain <strong>mostly exact duplicates</strong> and/or multiple <strong>highly similar questions</strong>. 
                  Users should review carefully — likely content overlap.
                </>
              ) : comparison.similarity_score >= 0.50 ? (
                <>
                  <strong>Medium Risk (50–74%):</strong> Documents have <strong>some exact duplicates</strong> but also a significant portion of <strong>partial matches</strong>. 
                  Moderate similarity; some overlap, but portions may be acceptable.
                </>
              ) : (
                <>
                  <strong>Low Risk (&lt;50%):</strong> Few exact duplicates; most questions are <strong>unique</strong>. 
                  Low chance of problematic overlap; mostly original content.
                </>
              )}
            </Typography>
          </Paper>

          {comparison.matching_questions.length > 0 && (
            <>
              {/* Perfect Matches (100%) */}
              {(() => {
                const perfectMatches = comparison.matching_questions.filter(match => match.similarity >= 0.99);
                const similarMatches = comparison.matching_questions.filter(match => match.similarity < 0.99 && match.similarity >= 0.7);
                const otherMatches = comparison.matching_questions.filter(match => match.similarity < 0.7);

                return (
                  <>
                    {perfectMatches.length > 0 && (
                      <Accordion defaultExpanded>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ backgroundColor: '#ffebee' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                              🚨 Perfect Matches ({perfectMatches.length})
                            </Typography>
                            <Chip 
                              label="High Risk" 
                              size="small" 
                              sx={{ 
                                backgroundColor: '#f44336', 
                                color: 'white',
                                fontWeight: 'bold'
                              }} 
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ mb: 3, color: '#d32f2f', fontWeight: 500 }}>
                            These questions are identical or nearly identical between the two documents:
                          </Typography>
                          {perfectMatches.map((match, index) => (
                            <Paper key={index} sx={{ p: 3, mb: 3, border: '2px solid #ffcdd2' }}>
                              <Grid container spacing={3}>
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Chip 
                                      label={`${(match.similarity * 100).toFixed(1)}% match`} 
                                      size="medium" 
                                      sx={{ 
                                        backgroundColor: getSimilarityColor(match.similarity), 
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      {match.question1_index} ↔ {match.question2_index}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#495057' }}>
                                      📄 From {file1} ({match.question1_index}):
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                                      {match.question1}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#495057' }}>
                                      📄 From {file2} ({match.question2_index}):
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                                      {match.question2}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* High Similarity Matches (70-99%) */}
                    {similarMatches.length > 0 && (
                      <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ backgroundColor: '#fff3e0' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#f57c00' }}>
                              ⚠️ High Similarity Matches ({similarMatches.length})
                            </Typography>
                            <Chip 
                              label="Medium Risk" 
                              size="small" 
                              sx={{ 
                                backgroundColor: '#ff9800', 
                                color: 'white',
                                fontWeight: 'bold'
                              }} 
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ mb: 3, color: '#f57c00', fontWeight: 500 }}>
                            These questions have similar meaning or structure but are not identical:
                          </Typography>
                          {similarMatches.map((match, index) => (
                            <Paper key={index} sx={{ p: 3, mb: 3, border: '2px solid #ffcc02' }}>
                              <Grid container spacing={3}>
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Chip 
                                      label={`${(match.similarity * 100).toFixed(1)}% match`} 
                                      size="medium" 
                                      sx={{ 
                                        backgroundColor: getSimilarityColor(match.similarity), 
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      {match.question1_index} ↔ {match.question2_index}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#495057' }}>
                                      📄 From {file1} ({match.question1_index}):
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                                      {match.question1}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#495057' }}>
                                      📄 From {file2} ({match.question2_index}):
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                                      {match.question2}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )}

                    {/* Other Matches (Below 70%) */}
                    {otherMatches.length > 0 && (
                      <Accordion sx={{ mt: 2 }}>
                        <AccordionSummary 
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ backgroundColor: '#e8f5e8' }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                              ℹ️ Lower Similarity Matches ({otherMatches.length})
                            </Typography>
                            <Chip 
                              label="Low Risk" 
                              size="small" 
                              sx={{ 
                                backgroundColor: '#4caf50', 
                                color: 'white',
                                fontWeight: 'bold'
                              }} 
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ mb: 3, color: '#2e7d32', fontWeight: 500 }}>
                            These questions show some similarity but are likely acceptable:
                          </Typography>
                          {otherMatches.map((match, index) => (
                            <Paper key={index} sx={{ p: 3, mb: 3, border: '2px solid #c8e6c9' }}>
                              <Grid container spacing={3}>
                                <Grid item xs={12}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Chip 
                                      label={`${(match.similarity * 100).toFixed(1)}% match`} 
                                      size="medium" 
                                      sx={{ 
                                        backgroundColor: getSimilarityColor(match.similarity), 
                                        color: 'white',
                                        fontWeight: 'bold'
                                      }}
                                    />
                                    <Typography variant="body2" sx={{ color: '#666' }}>
                                      {match.question1_index} ↔ {match.question2_index}
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#495057' }}>
                                      📄 From {file1} ({match.question1_index}):
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                                      {match.question1}
                                    </Typography>
                                  </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Paper sx={{ p: 2, backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#495057' }}>
                                      📄 From {file2} ({match.question2_index}):
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                                      {match.question2}
                                    </Typography>
                                  </Paper>
                                </Grid>
                              </Grid>
                            </Paper>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </>
                );
              })()}
            </>
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
              size="large"
              onClick={resetAnalysis}
              sx={{
                  bgcolor: "#1e3a8a",
                  color: "#fff",
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  fontSize: "1.3rem",
                  borderRadius: 3,
                  textTransform: "none",
                  boxShadow: "0 6px 24px rgba(30,58,138,0.3)",
                  transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                  '&:hover': {
                    bgcolor: "#12264a",
                    transform: "translateY(-3px)",
                    boxShadow: "0 12px 40px rgba(18,38,74,0.4)",
                  },
                }}
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

            {/* Risk Level Interpretation Table */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                mb: 2, 
                color: '#1e3a8a',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                📊 Risk Level Guide
              </Typography>
              
              <TableContainer component={Paper} sx={{ 
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                borderRadius: 2,
                border: '1px solid #e0e7ff'
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>Risk Level</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }} align="center">Similarity Range</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>Interpretation</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow sx={{ borderLeft: '4px solid #f44336', '&:hover': { bgcolor: '#fef2f2' } }}>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f44336' }} />
                          <Typography sx={{ color: '#dc2626', fontWeight: 600 }}>High Risk</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Typography sx={{ fontWeight: 600, color: '#dc2626' }}>≥ 75%</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                         Documents contain mostly exact duplicates and/or multiple highly similar questions. Review carefully — likely content overlap. 
                        </Typography>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow sx={{ borderLeft: '4px solid #f59e0b', '&:hover': { bgcolor: '#fffbeb' } }}>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                          <Typography sx={{ color: '#d97706', fontWeight: 600 }}>Medium Risk</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Typography sx={{ fontWeight: 600, color: '#d97706' }}>50–74%</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                         Documents have some exact duplicates but also a significant portion of partial matches. Moderate similarity; some overlap, but most may be acceptable. 
                        </Typography>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow sx={{ borderLeft: '4px solid #10b981', '&:hover': { bgcolor: '#f0fdf4' } }}>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                          <Typography sx={{ color: '#059669', fontWeight: 600 }}>Low Risk</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2 }}>
                        <Typography sx={{ fontWeight: 600, color: '#059669' }}>&lt; 50%</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ color: '#374151' }}>
                          Few exact duplicates; most questions are unique. Low chance of problematic overlap; mostly original content.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

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
            sx={{
                  bgcolor: "#1e3a8a",
                  color: "#fff",
                  fontWeight: 700,
                  px: 4,
                  py: 1.5,
                  fontSize: "1.3rem",
                  borderRadius: 3,
                  textTransform: "none",
                  boxShadow: "0 6px 24px rgba(30,58,138,0.3)",
                  transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
                  '&:hover': {
                    bgcolor: "#12264a",
                    transform: "translateY(-3px)",
                    boxShadow: "0 12px 40px rgba(18,38,74,0.4)",
                  },
                }}
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
