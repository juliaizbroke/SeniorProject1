"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Divider,
  Button,
  Tabs,
  Tab,
  Paper,
  Stack,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import Navbar from "../../components/Navbar";

import { getDownloadUrl, generateExam } from "../../utils/api";
import { QuestionMetadata, Question, GenerateResponse } from "../../types";
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

function PreviewPageLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '50vh',
        gap: 2
      }}
    >
      <CircularProgress />
      <Typography variant="body1">Loading preview...</Typography>
    </Box>
  );
}

function PreviewPageContent() {
  const [tabIndex, setTabIndex] = useState(0);
  const [downloadLinks, setDownloadLinks] = useState<{ 
    exam_url: string; 
    key_url: string; 
    exam_preview_url?: string; 
    key_preview_url?: string; 
  } | null>(null);
  const [metadata, setMetadata] = useState<QuestionMetadata | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    const examUrl = searchParams.get('examUrl');
    const keyUrl = searchParams.get('keyUrl');


    
    if (examUrl && keyUrl) {
      const links = {
        exam_url: decodeURIComponent(examUrl),
        key_url: decodeURIComponent(keyUrl),
      };

      setDownloadLinks(links);
    }

    // Get metadata, questions, and sessionId from localStorage
    const storedMetadata = localStorage.getItem("metadata");
    const storedQuestions = localStorage.getItem("questions");
    const storedSessionId = localStorage.getItem("sessionId");
    
    if (storedMetadata) {
      setMetadata(JSON.parse(storedMetadata));
    }
    
    if (storedQuestions) {
      setQuestions(JSON.parse(storedQuestions));
    }
    
    if (storedSessionId) {
      setSessionId(storedSessionId);
    }
  }, [searchParams]);

  const handleTabChange = (_: unknown, newValue: number) => {
    setTabIndex(newValue);
  };

  // Generate exam files function
  const handleGenerate = async () => {
    if (!metadata || !sessionId) {
      setError("Missing required data. Please try uploading your file again.");
      return null;
    }
    
    // Clear all question locks before generation to ensure all questions are included
    const lockedQuestions = localStorage.getItem('lockedQuestions');
    let hadLockedQuestions = false;
    
    if (lockedQuestions) {
      try {
        const lockedIds = JSON.parse(lockedQuestions);
        if (lockedIds && lockedIds.length > 0) {
          hadLockedQuestions = true;
          localStorage.removeItem('lockedQuestions');
          localStorage.removeItem('lockedCategories');
          
          // Show notification about clearing locks
          setSnackbar({
            open: true,
            message: `Cleared ${lockedIds.length} locked question(s) before generating exam documents.`,
            severity: 'info'
          });
        }
      } catch (error) {
        console.error('Error checking locked questions:', error);
      }
    }
    
    try {
      setLoading(true);
      setError("");
      const response: GenerateResponse = await generateExam({
        session_id: sessionId,
        questions,
        metadata,
      });

      // Set download links after successful generation
      const links = {
        exam_url: response.exam_url,
        key_url: response.key_url,
        exam_preview_url: response.exam_preview_url,
        key_preview_url: response.key_preview_url
      };
      setDownloadLinks(links);
      
      // Show success message
      setSnackbar({
        open: true,
        message: hadLockedQuestions 
          ? 'Exam generated successfully! All questions were included (locks cleared).'
          : 'Exam generated successfully!',
        severity: 'success'
      });
      
      return response;
    } catch (err) {
      setError("Failed to generate exam documents.");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to organize questions by type
  const organizeQuestions = () => {
    const organized = {
      multipleChoice: questions.filter(q => q.type.toLowerCase() === 'multiple choice' && q.type !== 'fake answer'),
      trueFalse: questions.filter(q => q.type.toLowerCase() === 'true/false' && q.type !== 'fake answer'),
      matching: questions.filter(q => q.type.toLowerCase() === 'matching' && q.type !== 'fake answer'),
      written: questions.filter(q => q.type.toLowerCase() === 'written question' && q.type !== 'fake answer'),
    };
    return organized;
  };

  // Helper function to render a multiple choice question
  const renderMultipleChoiceQuestion = (question: Question, index: number, showAnswers: boolean) => (
    <Paper key={index} elevation={1} sx={{ p: 3, mb: 2, border: '1px solid #e0e0e0' }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#1e3a8a' }}>
        {index + 1}. {question.question}
      </Typography>
      <Stack spacing={1} sx={{ ml: 2 }}>
        {['a', 'b', 'c', 'd', 'e'].map((option) => {
          const optionValue = question[option as keyof Question] as string;
          if (!optionValue) return null;
          
          const isCorrect = showAnswers && question.answer?.toLowerCase() === option;
          
          return (
            <Box key={option} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  border: '2px solid #ccc',
                  bgcolor: isCorrect ? '#4caf50' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isCorrect && (
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'white' }} />
                )}
              </Box>
              <Typography sx={{ fontWeight: isCorrect && showAnswers ? 600 : 400 }}>
                {option.toUpperCase()}. {optionValue}
              </Typography>
            </Box>
          );
        })}
      </Stack>
      {question.category && (
        <Chip 
          label={`Category: ${question.category}`} 
          size="small" 
          sx={{ mt: 2, fontSize: '0.75rem' }} 
        />
      )}
    </Paper>
  );

  // Helper function to render true/false question
  const renderTrueFalseQuestion = (question: Question, index: number, showAnswers: boolean) => (
    <Paper key={index} elevation={1} sx={{ p: 3, mb: 2, border: '1px solid #e0e0e0' }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#1e3a8a' }}>
        {index + 1}. {question.question}
      </Typography>
      {showAnswers && (
        <Typography sx={{ fontWeight: 600, color: '#4caf50', ml: 2 }}>
          Answer: {question.answer}
        </Typography>
      )}
      {question.category && (
        <Chip 
          label={`Category: ${question.category}`} 
          size="small" 
          sx={{ mt: 2, fontSize: '0.75rem' }} 
        />
      )}
    </Paper>
  );

  // Helper function to render matching questions
  const renderMatchingQuestions = (matchingQuestions: Question[], showAnswers: boolean) => {
    if (matchingQuestions.length === 0) return null;

    // Get the correct answers from matching questions
    const correctAnswers = matchingQuestions.map(q => q.answer);
    
    // Get all fake answer questions from the main questions array
    const allFakeAnswers = questions.filter(q => q.type === 'fake answer')
      .map(q => q.answer)
      .filter(answer => answer && answer.trim()); // Filter out empty answers
    
    // Use the fake answers from the main questions state
    const finalFakeAnswers = allFakeAnswers;
    
    // Combine correct answers with fake answers for Column B
    const allColumnBOptions = [...correctAnswers, ...finalFakeAnswers];
    const shuffledAnswers = [...allColumnBOptions].sort(() => Math.random() - 0.5); // Random shuffle

    return (
      <Paper elevation={1} sx={{ p: 3, mb: 2, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#1e3a8a' }}>
          Match the following:
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Column A
            </Typography>
            <Stack spacing={1}>
              {matchingQuestions.map((question, index) => (
                <Typography key={index}>
                  {index + 1}. {question.question}
                </Typography>
              ))}
            </Stack>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Column B
            </Typography>
            <Stack spacing={1}>
              {shuffledAnswers.map((answer, index) => (
                <Typography key={index}>
                  {String.fromCharCode(65 + index)}. {answer}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Box>
        {showAnswers && (
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Answers:
            </Typography>
            {matchingQuestions.map((question, index) => {
              const answerIndex = shuffledAnswers.indexOf(question.answer);
              const answerLetter = String.fromCharCode(65 + answerIndex);
              return (
                <Typography key={index} sx={{ fontSize: '0.9rem' }}>
                  {index + 1}. {answerLetter}
                </Typography>
              );
            })}
          </Box>
        )}
      </Paper>
    );
  };

  // Helper function to render written questions
  const renderWrittenQuestion = (question: Question, index: number, showAnswers: boolean) => (
    <Paper key={index} elevation={1} sx={{ p: 3, mb: 2, border: '1px solid #e0e0e0' }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#1e3a8a' }}>
        {index + 1}. {question.question}
      </Typography>
      {showAnswers && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Answer:
          </Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {question.answer}
          </Typography>
        </Box>
      )}
      {question.category && (
        <Chip 
          label={`Category: ${question.category}`} 
          size="small" 
          sx={{ mt: 2, fontSize: '0.75rem' }} 
        />
      )}
    </Paper>
  );

  return (
    <Box sx={{ bgcolor: "white", minHeight: "100vh" }}>
      <Navbar />
      <Box sx={{ px: 4, py: 6 }}>
        <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: "#1e3a8a",
              fontFamily: "var(--sds-typography-title-hero-font-family)",
            }}
          >
            Preview Exam
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 400,
              mb: 4,
              color: "#64748b",
              fontFamily: "var(--sds-typography-title-hero-font-family)",
            }}
          >
            Review your exam content and structure before downloading the final documents.
          </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 3,
            mb: 4,
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="#1e3a8a">
              Subject
            </Typography>
            <Typography color="#64748b">{metadata?.subject_name || "N/A"}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="#1e3a8a">
              Lecturer
            </Typography>
            <Typography color="#64748b">{metadata?.lecturer || "N/A"}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="#1e3a8a">
              Date
            </Typography>
            <Typography color="#64748b">{metadata?.date || "N/A"}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="#1e3a8a">
              Duration
            </Typography>
            <Typography color="#64748b">{metadata?.time || "N/A"}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: "#e2e8f0" }} />

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant="fullWidth"
          TabIndicatorProps={{
            style: {
              height: "35px",
              borderRadius: 8,
              margin: "5px 2px",
              backgroundColor: "#1e3a8a",
              transition: "all 0.3s ease-in-out",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            },
          }}
          sx={{
            mb: 2,
            bgcolor: "#f1f5f9",
            borderRadius: 2,
            minHeight: "20px",
            "& .MuiTabs-flexContainer": {
              position: "relative",
              zIndex: 1,
            },
            "& .MuiTab-root": {
              zIndex: 2,
            },
          }}
        >
          {["Exam Paper", "Answer Key"].map((label) => (
            <Tab
              key={label}
              label={label}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                minHeight: "unset",
                m: "2px 1px",
                height: "40px",
                borderRadius: 1,
                transition: "color 0.2s ease-in-out",
                color: "#64748b",
                "&.Mui-selected": {
                  color: "white",
                  fontWeight: 600,
                },
              }}
            />
          ))}
        </Tabs>

        <Box
          sx={{
            mt: 4,
            p: 4,
            bgcolor: "#f8fafc",
            borderRadius: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          {questions.length > 0 ? (
            <Box>

              {/* Exam Information Header */}
              <Paper elevation={2} sx={{ p: 4, mb: 4, bgcolor: 'white' }}>
                <Typography variant="h4" sx={{ textAlign: 'center', mb: 3, color: '#1e3a8a', fontWeight: 700 }}>
                  {metadata?.subject_name || "Examination"}
                </Typography>
                <Typography variant="h5" sx={{ textAlign: 'center', mb: 3, color: '#374151' }}>
                  {tabIndex === 0 ? 'Final Examination' : 'Answer Key'}
                </Typography>
                <Typography variant="body1" sx={{ textAlign: 'center', mb: 1 }}>
                  <strong>Date:</strong> {metadata?.date || "N/A"} &nbsp;&nbsp;&nbsp; <strong>Duration:</strong> {metadata?.time || "N/A"}
                </Typography>
                <Typography variant="body1" sx={{ textAlign: 'center', mb: 3 }}>
                  <strong>Lecturer:</strong> {metadata?.lecturer || "N/A"}
                </Typography>
              </Paper>

              {/* Question Selection Summary */}
              <Box sx={{ mb: 4, p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1e3a8a' }}>
                  Question Selection
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  {organizeQuestions().multipleChoice.length > 0 && (
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                      <Typography variant="h4" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                        {organizeQuestions().multipleChoice.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Multiple Choice
                      </Typography>
                    </Box>
                  )}
                  {organizeQuestions().trueFalse.length > 0 && (
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                      <Typography variant="h4" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                        {organizeQuestions().trueFalse.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        True/False
                      </Typography>
                    </Box>
                  )}
                  {organizeQuestions().matching.length > 0 && (
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                      <Typography variant="h4" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                        {organizeQuestions().matching.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Matching
                      </Typography>
                    </Box>
                  )}
                  {organizeQuestions().written.length > 0 && (
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f9ff', borderRadius: 1 }}>
                      <Typography variant="h4" sx={{ color: '#1e3a8a', fontWeight: 700 }}>
                        {organizeQuestions().written.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Written
                      </Typography>
                    </Box>
                  )}

                </Box>
              </Box>

              {/* Questions Content */}
              <Box>
                {/* Multiple Choice Questions */}
                {organizeQuestions().multipleChoice.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, color: '#1e3a8a', fontWeight: 600 }}>
                      Section A: Multiple Choice Questions ({organizeQuestions().multipleChoice.length} points)
                    </Typography>
                    {organizeQuestions().multipleChoice.map((question, index) => 
                      renderMultipleChoiceQuestion(question, index, tabIndex === 1)
                    )}
                  </Box>
                )}

                {/* True/False Questions */}
                {organizeQuestions().trueFalse.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, color: '#1e3a8a', fontWeight: 600 }}>
                      Section B: True/False Questions ({organizeQuestions().trueFalse.length} points)
                    </Typography>
                    {organizeQuestions().trueFalse.map((question, index) => 
                      renderTrueFalseQuestion(question, index, tabIndex === 1)
                    )}
                  </Box>
                )}

                {/* Matching Questions */}
                {organizeQuestions().matching.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, color: '#1e3a8a', fontWeight: 600 }}>
                      Section C: Matching Questions ({organizeQuestions().matching.length} points)
                    </Typography>
                    {renderMatchingQuestions(organizeQuestions().matching, tabIndex === 1)}
                  </Box>
                )}

                {/* Written Questions */}
                {organizeQuestions().written.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3, color: '#1e3a8a', fontWeight: 600 }}>
                      Section D: Written Questions ({organizeQuestions().written.length} points)
                    </Typography>
                    {organizeQuestions().written.map((question, index) => 
                      renderWrittenQuestion(question, index, tabIndex === 1)
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          ) : (
            <Typography color="error" sx={{ textAlign: "center" }}>
              No questions available for preview. Please ensure questions are loaded and try again.
            </Typography>
          )}
        </Box>

        {/* Generate and Download Section */}
        <Box sx={{ mt: 6 }}>
          {/* Show error if any */}
          {error && (
            <Box sx={{ mb: 3, p: 2, bgcolor: '#ffebee', borderRadius: 1, border: '1px solid #e57373' }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {/* Generate Paper Button - Show only if files haven't been generated yet */}
          {!downloadLinks && (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={loading || !sessionId || !metadata}
                sx={{
                  height: "60px",
                  px: 4,
                  borderRadius: "10px",
                  backgroundColor: "#1e3a8a",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "#1e40af",
                  },
                  "&:disabled": {
                    backgroundColor: "#9ca3af",
                  },
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} color="inherit" sx={{ mr: 2 }} />
                    Generating Paper...
                  </>
                ) : (
                  <>
                    Generate Paper
                    <TrendingFlatIcon sx={{ ml: 2 }} />
                  </>
                )}
              </Button>
            </Box>
          )}

          {/* Download Buttons - Show only after generation */}
          {downloadLinks && (
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button
                variant="contained"
                onClick={() => {
                  window.open(getDownloadUrl(downloadLinks.exam_url), '_blank');
                }}
                sx={{
                  height: "60px",
                  px: 4,
                  borderRadius: "10px",
                  backgroundColor: "#1e3a8a",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "#1e40af",
                  },
                }}
              >
                Download Exam Paper
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  window.open(getDownloadUrl(downloadLinks.key_url), '_blank');
                }}
                sx={{
                  height: "60px",
                  px: 4,
                  borderRadius: "10px",
                  backgroundColor: "#1e3a8a",
                  color: "white",
                  fontSize: "1rem",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "#1e40af",
                  },
                }}
              >
                Download Answer Key
              </Button>
            </Box>
          )}
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        </Box>
      </Box>
    </Box>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<PreviewPageLoading />}>
      <PreviewPageContent />
    </Suspense>
  );
}