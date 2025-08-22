"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Tab,
  Tabs,
  Divider,
  Snackbar,
  Alert
} from "@mui/material";
import QuestionEditor from "../../components/QuestionEditor";
import Navbar from "../../components/Navbar";
import { Question, QuestionMetadata } from "../../types";
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
export default function EditPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]); // Store full pool for shuffling
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [metadata, setMetadata] = useState<QuestionMetadata | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionId, setSessionId] = useState<string>("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });  
  
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lockRefreshTrigger, setLockRefreshTrigger] = useState(0);

  // Function to get available question types based on current questions
  const getAvailableQuestionTypes = useCallback(() => {
    const types = [] as string[];
    const hasMultipleChoice = questions.some(q => q.type.toLowerCase() === "multiple choice");
    const hasTrueFalse = questions.some(q => q.type.toLowerCase() === "true/false");
    const hasMatching = questions.some(q => q.type.toLowerCase() === "matching" || q.type.toLowerCase() === "fake answer");
    const hasWritten = questions.some(q => q.type.toLowerCase() === "written question");
    
    if (hasMultipleChoice) types.push("Multiple Choice");
    if (hasTrueFalse) types.push("True/False");
    if (hasMatching) types.push("Matching");
    if (hasWritten) types.push("Written");
    
    return types;
  }, [questions]);

  useEffect(() => {
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
  }, [router]);
  
  // Reset tab index when questions change to ensure valid tab selection
  useEffect(() => {
    const availableTypes = getAvailableQuestionTypes();
    if (tabIndex >= availableTypes.length) {
      setTabIndex(0);
    }
  }, [questions, tabIndex, getAvailableQuestionTypes]);
  
  // Function to get tab label based on index
  const getTabLabel = (index: number) => {
    const availableTypes = getAvailableQuestionTypes();
    return availableTypes[index] || availableTypes[0] || "Multiple Choice";
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
    const newQuestions = [...otherQuestions, ...filteredQuestions];
    setQuestions(newQuestions);
    
    // Save updated questions to localStorage
    localStorage.setItem("questions", JSON.stringify(newQuestions));
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
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              },
            }}
            sx={{
              mb: 2,
              bgcolor: '#f1f5f9',
              borderRadius: 2,
              minHeight: '20px',
              '& .MuiTabs-flexContainer': {
                position: 'relative',
                zIndex: 1,
              },
              '& .MuiTab-root': {
                zIndex: 2,
                color: '#64748b',
                '&.Mui-selected': {
                  color: 'white',
                  fontWeight: 600,
                },
              },
            }}
          >
            {getAvailableQuestionTypes().map((label) => (
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
                  color: '#64748b',
                  '&.Mui-selected': {
                    color: 'white',
                    fontWeight: 600,
                  },
                }}
              />
            ))}
          </Tabs>
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
                Review your questions and proceed to preview the exam structure before generating the final documents.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  // Just navigate to preview page without generating files yet
                  router.push('/preview');
                }}
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
                Continue to Preview
                <TrendingFlatIcon sx={{ ml: 2 }} />
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
