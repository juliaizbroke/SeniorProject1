"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Divider,
  Snackbar,
  Alert
} from "@mui/material";
import QuestionEditor from "../../components/QuestionEditor";
import Navbar from "../../components/Navbar";
import { Question, QuestionMetadata, GenerateResponse} from "../../types";
import { generateExam} from "../../utils/api";
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
export default function EditPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // Store full pool for shuffling
  const [metadata, setMetadata] = useState<QuestionMetadata | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });  
  
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  const [lockRefreshTrigger, setLockRefreshTrigger] = useState(0);useEffect(() => {
    const q = localStorage.getItem("questions");
    const allQ = localStorage.getItem("allQuestions"); // Get full pool if available
    const m = localStorage.getItem("metadata");
    const s = localStorage.getItem("sessionId");

    if (q && m && s) {
      const parsedQuestions = JSON.parse(q);
      setQuestions(parsedQuestions);
      
      // Set full pool - use allQuestions if available, otherwise fall back to current questions
      if (allQ) {
        setAllQuestions(JSON.parse(allQ));
      } else {
        setAllQuestions(parsedQuestions); // Fallback to current questions
      }
      
      // Parse the metadata and ensure selection_settings exists
      const parsedMetadata = JSON.parse(m);
      if (!parsedMetadata.selection_settings) {
        parsedMetadata.selection_settings = {};
      }
      
      setMetadata(parsedMetadata);
      setSessionId(s);
    } else {
      router.replace("/");
    }
  }, [router]);  const handleGenerate = async () => {
    if (!metadata || !sessionId) return null;
    
    // Clear all question locks before generation to ensure all questions are included
    const lockedQuestions = localStorage.getItem('lockedQuestions');
    let hadLockedQuestions = false;
    
    if (lockedQuestions) {
      try {
        const lockedIds = JSON.parse(lockedQuestions);
        if (lockedIds && lockedIds.length > 0) {          hadLockedQuestions = true;
          localStorage.removeItem('lockedQuestions');
          
          // Force immediate UI update by triggering a re-render and refreshing QuestionEditor locks
          // This ensures locked questions are visually shown as unlocked
          setQuestions(prevQuestions => [...prevQuestions]);
          setLockRefreshTrigger(prev => prev + 1); // Trigger QuestionEditor to refresh its lock state
          
          // Show notification about clearing locks
          setSnackbar({
            open: true,
            message: `Cleared ${lockedIds.length} locked question(s) before generating exam documents.`,
            severity: 'info'
          });
          
          // Small delay to let user see the visual change
          await new Promise(resolve => setTimeout(resolve, 500));
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

      
      // Show success message with lock clearing info if applicable
      if (hadLockedQuestions) {
        setTimeout(() => {
          setSnackbar({
            open: true,
            message: 'Exam generated successfully! All questions were included (locks cleared).',
            severity: 'success'
          });
        }, 1000);
      }
      
      return response;
    } catch (err) {
      setError("Failed to generate exam documents.");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  // Function to get tab label based on index
  const getTabLabel = (index: number) => {
    const tabs = ["Multiple Choice", "True/False", "Matching", "Written"];
    return tabs[index] || "Multiple Choice";
  };
  // Function to filter questions based on selected tab
  const getFilteredQuestions = () => {
    const questionType = getTabLabel(tabIndex);
    
    switch (questionType) {
      case "Multiple Choice":
        return questions.filter(q => q.type.toLowerCase() === "multiple choice");
      case "True/False":
        return questions.filter(q => q.type.toLowerCase() === "true/false");
      case "Matching":
        return questions.filter(q => q.type.toLowerCase() === "matching" || q.type.toLowerCase() === "fake answer");
      case "Written":
        return questions.filter(q => q.type.toLowerCase() === "written question");
      default:
        return questions.filter(q => q.type.toLowerCase() === "multiple choice");
    }
  };
  // Function to get all questions of the current type (for shuffling pool)
  const getAllQuestionsOfCurrentType = () => {
    const questionType = getTabLabel(tabIndex);
    
    switch (questionType) {
      case "Multiple Choice":
        return allQuestions.filter(q => q.type.toLowerCase() === "multiple choice");
      case "True/False":
        return allQuestions.filter(q => q.type.toLowerCase() === "true/false");
      case "Matching":
        return allQuestions.filter(q => q.type.toLowerCase() === "matching" || q.type.toLowerCase() === "fake answer");
      case "Written":
        return allQuestions.filter(q => q.type.toLowerCase() === "written question");
      default:
        return allQuestions.filter(q => q.type.toLowerCase() === "multiple choice");
    }
  };

  // Function to update questions - need to merge back into the main array
  const handleFilteredQuestionsChange = (filteredQuestions: Question[]) => {
    const questionType = getTabLabel(tabIndex);
    
    // Create a new array with updated questions
    const updatedQuestions = [...questions];
    
    // Remove old questions of this type (including fake answers for matching type)
    const otherQuestions = updatedQuestions.filter(q => {
      switch (questionType) {
        case "Multiple Choice":
          return q.type.toLowerCase() !== "multiple choice";
        case "True/False":
          return q.type.toLowerCase() !== "true/false";
        case "Matching":
          return q.type.toLowerCase() !== "matching" && q.type.toLowerCase() !== "fake answer";
        case "Written":
          return q.type.toLowerCase() !== "written question";
        default:
          return true;
      }
    });
    
    // Combine other questions with updated filtered questions
    setQuestions([...otherQuestions, ...filteredQuestions]);
  };


  return (
    <Box sx={{ bgcolor: '#e3e9f7', minHeight: '100vh', color: '#222', position: 'relative', overflow: 'hidden' }}>
      <Navbar />
      <Box sx={{ px: 4, py: 6, position: 'relative', zIndex: 1 }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <Typography
            variant="h4"
            sx={{ color: "#1a1a1a", fontWeight: 700, mb: 2, fontFamily: 'var(--sds-typography-title-hero-font-family)' }}
          >
            Edit Questions
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "#333", fontWeight: 400, mb: 4, fontFamily: 'var(--sds-typography-title-hero-font-family)' }}
          >
            Review and edit your exam questions before generating the final documents.
          </Typography>
          <Box sx={{ mb: 4 }}>
            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.18)' }} />
          </Box>
          <Tabs
            value={tabIndex}
            onChange={(_, newValue) => setTabIndex(newValue)}
            variant="fullWidth"
            TabIndicatorProps={{
              style: {
                height: '35px',
                borderRadius: 8,
                margin: '5px 2px',
                backgroundColor: '#1e3a8a',
                transition: 'all 0.3s ease-in-out',
                boxShadow: '0 2px 4px rgba(30,58,138,0.18)',
              },
            }}
            sx={{
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.12)',
              borderRadius: 2,
              minHeight: '20px',
              '& .MuiTabs-flexContainer': {
                position: 'relative',
                zIndex: 1,
              },
              '& .MuiTab-root': {
                zIndex: 2,
                color: '#b0c4de',
                '&.Mui-selected': {
                  color: '#fff',
                  fontWeight: 600,
                },
              },
            }}
          >
            {['Multiple Choice', 'True/False', 'Matching', 'Written'].map((label) => (
              <Tab
                key={label}
                label={label}
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  minHeight: 'unset',
                  m: '2px 1px',
                  height: '40px',
                  borderRadius: 1,
                  transition: 'color 0.2s ease-in-out',
                }}
              />
            ))}
          </Tabs>
          {error && (
            <Box
              sx={{
                mb: 4,
                p: 2,
                background: 'rgba(255,255,255,0.12)',
                boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: 2,
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          <QuestionEditor
            questions={getFilteredQuestions()}
            allQuestionsPool={getAllQuestionsOfCurrentType()}
            onQuestionsChange={handleFilteredQuestionsChange}
            forceRefreshLocks={lockRefreshTrigger}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: '#333', fontStyle: 'italic', maxWidth: '300px', textAlign: 'right' }}
              >
                Note: All question locks will be cleared before generating the exam to ensure all questions are included.
              </Typography>
              <Button
                variant="contained"
                onClick={async () => {
                  const response = await handleGenerate();
                  if (response) {
                    const queryParams = new URLSearchParams({
                      examUrl: encodeURIComponent(response.exam_url),
                      keyUrl: encodeURIComponent(response.key_url)
                    });
                    if (response.exam_preview_url) {
                      queryParams.append('examPreviewUrl', encodeURIComponent(response.exam_preview_url));
                    }
                    if (response.key_preview_url) {
                      queryParams.append('keyPreviewUrl', encodeURIComponent(response.key_preview_url));
                    }
                    router.push(`/preview?${queryParams.toString()}`);
                  }
                }}
                disabled={loading}
                sx={{
                  height: '60px',
                  flexShrink: 0,
                  borderRadius: '10px',
                  border: '1px solid #1e3a8a',
                  backgroundColor: '#1e3a8a',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1e40af',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <>
                    Continue to Preview
                    <TrendingFlatIcon sx={{ ml: 2 }} />
                  </>
                )}
              </Button>
            </Box>
          </Box>
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
