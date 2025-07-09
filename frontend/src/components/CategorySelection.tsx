import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Accordion, 
  AccordionDetails, 
  AccordionSummary,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Paper,
  Button,
  Tooltip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Question, QuestionMetadata } from '../types';

interface CategorySelectionProps {
  questions: Question[];
  metadata: QuestionMetadata;
  onChange: (updatedMetadata: QuestionMetadata) => void;
  onFilterQuestions: (filteredQuestions: Question[]) => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({ questions, metadata, onChange, onFilterQuestions }) => {
  // Group questions by type and category
  const [questionGroups, setQuestionGroups] = useState<Record<string, Record<string, Question[]>>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  
  useEffect(() => {
    const groups: Record<string, Record<string, Question[]>> = {};
    
    // Group questions by type and category
    questions.forEach((question) => {
      const type = question.type;
      const category = question.category || 'uncategorized';
      
      if (!groups[type]) {
        groups[type] = {};
      }
      
      if (!groups[type][category]) {
        groups[type][category] = [];
      }
      
      groups[type][category].push(question);
    });
    
    setQuestionGroups(groups);
  }, [questions]);
    const handleCategoryCountChange = (type: string, category: string, count: number) => {
    // Create a deep copy of the current settings
    const newSettings = { ...metadata.selection_settings };
    
    // Initialize if needed
    if (!newSettings[type]) {
      newSettings[type] = {};
    }
    
    // Update the count
    newSettings[type][category] = Math.max(0, count);
    
    // Update metadata
    const newMetadata = {
      ...metadata,
      selection_settings: newSettings
    };
    
    onChange(newMetadata);
  };
    const calculateFilteredQuestions = () => {
    const filteredQuestions: Question[] = [];
    const settings = metadata.selection_settings;
    
    // Check if any selections were made
    let totalSelected = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(settings).forEach(([type, categories]) => {
      Object.values(categories).forEach(count => {
        totalSelected += count;
      });
    });
    
    if (totalSelected === 0) {
      setSnackbarMessage('Please select at least one question from a category before applying filters.');
      setSnackbarOpen(true);
      return null;
    }
    
    // For each question type and category
    Object.entries(questionGroups).forEach(([type, categories]) => {
      Object.entries(categories).forEach(([category, categoryQuestions]) => {
        // Check if we have a selection for this type and category
        const selectedCount = settings[type]?.[category] || 0;
        
        if (selectedCount > 0) {
          // Randomly select the specified number of questions
          const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, selectedCount);
          filteredQuestions.push(...selected);
        }
      });
      
      // Add fake answers for matching questions
      if (type.toLowerCase().includes('matching')) {
        const fakeAnswersCount = settings[type]?.['fake answers'] || 0;
        if (fakeAnswersCount > 0) {
          // Collect all unselected questions from all categories for this type
          const allUnselectedQuestions: Question[] = [];
          
          Object.entries(categories).forEach(([category, categoryQuestions]) => {
            const selectedFromCategory = settings[type]?.[category] || 0;
            
            // Get the questions that were NOT selected from this category
            const shuffledCategoryQuestions = [...categoryQuestions].sort(() => 0.5 - Math.random());
            const unselectedFromCategory = shuffledCategoryQuestions.slice(selectedFromCategory);
            
            // Add them to the pool of potential fake answers
            allUnselectedQuestions.push(...unselectedFromCategory);
          });
          
          // Randomly select fake answers from the unselected questions pool
          const shuffledUnselected = [...allUnselectedQuestions].sort(() => 0.5 - Math.random());
          const actualFakeAnswersCount = Math.min(fakeAnswersCount, shuffledUnselected.length);
          
          for (let i = 0; i < actualFakeAnswersCount; i++) {
            const fakeAnswerQuestion = { ...shuffledUnselected[i] };
            // Mark it as a fake answer while preserving original content
            fakeAnswerQuestion.type = 'fake answer';
            fakeAnswerQuestion.category = `fake answers - ${fakeAnswerQuestion.category}`;
            fakeAnswerQuestion.q_type = 'fake';
            
            filteredQuestions.push(fakeAnswerQuestion);
          }
          
          // If we need more fake answers than available unselected questions, create manual slots
          const remainingFakeAnswers = fakeAnswersCount - actualFakeAnswersCount;
          for (let i = 0; i < remainingFakeAnswers; i++) {
            filteredQuestions.push({
              type: 'fake answer',
              category: 'fake answers - manual',
              question: `[Fake Answer Slot ${actualFakeAnswersCount + i + 1}] - Create manually (no available pool)`,
              answer: '',
              q_type: 'fake',
              is_long: false,
              image: ''
            } as Question);
          }
        }
      }
    });
    
    return filteredQuestions;
  };
  
  const handleApplyFilters = () => {
    const filteredQuestions = calculateFilteredQuestions();
    
    if (!filteredQuestions) {
      return; // Error already shown in snackbar
    }
    
    // Store the calculated questions
    setSelectedQuestions(filteredQuestions);
    
    // Show confirmation dialog
    setConfirmDialogOpen(true);
  };

  // Generate detailed breakdown of selected questions
  const getSelectionBreakdown = () => {
    const settings = metadata.selection_settings;
    const breakdown: { [key: string]: { count: number; fakeAnswers: number } } = {};
    let totalCount = 0;

    Object.entries(settings).forEach(([type, categories]) => {
      let typeTotal = 0;
      let fakeAnswersCount = 0;

      Object.entries(categories).forEach(([category, count]) => {
        if (count > 0) {
          if (category === 'fake answers') {
            fakeAnswersCount = count;
          } else {
            typeTotal += count;
          }
        }
      });

      if (typeTotal > 0 || fakeAnswersCount > 0) {
        breakdown[type] = {
          count: typeTotal,
          fakeAnswers: fakeAnswersCount
        };
        totalCount += typeTotal; // Only count real questions, not fake answers
      }
    });

    return { breakdown, totalCount };
  };
  
  const handleConfirmFilter = () => {
    // Let the parent component know about our filtered questions
    onFilterQuestions(selectedQuestions);
    
    // Close dialog
    setConfirmDialogOpen(false);
    
    setSnackbarMessage(`Successfully filtered to ${selectedQuestions.length} questions based on your selections.`);
    setSnackbarOpen(true);
  };
    return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ 
            mb: 2, 
            color: "#000",
            fontFamily: "var(--sds-typography-title-hero-font-family)", 
            fontWeight: 600 }}>
          Question Selection by Category
        </Typography>
        
      </Box>
      
      {Object.entries(questionGroups).map(([type, categories]) => (
        <Accordion key={type} sx={{
          mb: 2,
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.03)', 
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' } 
            }}
          >
            <Typography sx={{ textTransform: 'capitalize', fontWeight: 600, color: '#1a1a1a' }}>
              {type === 'written question' ? 'Written Questions' : type}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} elevation={0} sx={{
              background: 'rgba(255,255,255,0.12)',
              boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.18)',
            }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Available</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1a1a1a' }}>Select</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(categories).map(([category, questions]) => (
                    <TableRow key={category}>
                      <TableCell sx={{ color: '#333' }}>{category}</TableCell>
                      <TableCell sx={{ color: '#333' }}>{questions.length}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, max: questions.length }}
                          value={
                            (metadata.selection_settings?.[type]?.[category] || 0)
                          }
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            handleCategoryCountChange(type, category, value);
                          }}
                          sx={{ width: '80px' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Add fake answers row for matching questions */}
                  {type.toLowerCase().includes('matching') && (() => {
                    // Calculate total available matching questions (all categories combined)
                    const totalAvailableMatching = Object.entries(categories).reduce((total, [, questions]) => {
                      return total + questions.length;
                    }, 0);
                    
                    // Calculate total selected matching questions
                    const totalSelectedMatching = Object.entries(categories).reduce((total, [category]) => {
                      return total + (metadata.selection_settings?.[type]?.[category] || 0);
                    }, 0);
                    
                    // Available fake answers = total available - total selected
                    const availableFakeAnswers = totalAvailableMatching - totalSelectedMatching;
                    const selectedFakeAnswers = metadata.selection_settings?.[type]?.['fake answers'] || 0;
                    const needsManualCreation = selectedFakeAnswers > availableFakeAnswers;
                    
                    return (
                      <>
                        <TableRow key="fake-answers" sx={{ bgcolor: 'rgba(255, 152, 0, 0.1)', borderTop: '1px solid #ff9800' }}>
                          <TableCell sx={{ fontStyle: 'italic', color: '#e65100', fontWeight: 500 }}>Fake Answers</TableCell>
                          <TableCell sx={{ color: '#e65100', fontWeight: 500 }}>{availableFakeAnswers}</TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              inputProps={{ min: 0 }}
                              value={selectedFakeAnswers}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 0;
                                handleCategoryCountChange(type, 'fake answers', value);
                              }}
                              sx={{ 
                                width: '80px',
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: 'rgba(255, 152, 0, 0.05)',
                                  borderColor: needsManualCreation ? '#ff5722' : '#ff9800',
                                  '&:hover': {
                                    borderColor: needsManualCreation ? '#ff5722' : '#f57c00',
                                  },
                                  '&.Mui-focused': {
                                    borderColor: needsManualCreation ? '#ff5722' : '#f57c00',
                                  }
                                }
                              }}
                            />
                          </TableCell>
                        </TableRow>
                        
                        {needsManualCreation && (
                          <TableRow key="fake-answers-warning">
                            <TableCell colSpan={3} sx={{ py: 1, px: 2, bgcolor: 'rgba(255, 152, 0, 0.05)' }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#ff9800', 
                                  fontStyle: 'italic',
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}
                              >
                                ⚠️ You may need to create {selectedFakeAnswers - availableFakeAnswers} fake answer(s) manually
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}
        <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarMessage.includes('Successfully') ? "success" : "warning"} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
        <Tooltip title="Apply your category selections and filter the question list">
          <Button 
            variant="contained" 
            onClick={handleApplyFilters}
            startIcon={<FilterAltIcon />}
            sx={{
              float: 'right',
              backgroundColor: '#1e3a8a',
              color: '#fff',
              '&:hover': {
                backgroundColor: '#3b5998',
              },
              borderRadius: '8px',
              px: 3
            }}
          >
            Apply Filters
          </Button>
        </Tooltip>
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Filtering Questions
        </DialogTitle>
        <DialogContent>
          <DialogContentText component="div" id="alert-dialog-description">
            {selectedQuestions.length > 0 ? (
              <>
                {(() => {
                  const { breakdown, totalCount } = getSelectionBreakdown();
                  
                  return (
                    <>
                      <Typography component="div" variant="body1" sx={{ mb: 2 }}>
                        This will filter your question list to include:
                      </Typography>
                      
                      {Object.entries(breakdown).map(([type, { count, fakeAnswers }]) => {
                        const displayType = type === 'written question' ? 'Written Questions' : 
                                          type === 'multiple choice' ? 'Multiple Choice' :
                                          type === 'true/false' ? 'True/False' :
                                          type.charAt(0).toUpperCase() + type.slice(1);
                        
                        return (
                          <div key={type}>
                            {count > 0 && (
                              <Typography component="div" variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                                • <strong>{count} {displayType}</strong>
                                {fakeAnswers > 0 && (
                                  <span style={{ color: '#ff9800', fontWeight: 600 }}>
                                    {' '}({fakeAnswers} fake answers)
                                  </span>
                                )}
                              </Typography>
                            )}
                            {fakeAnswers > 0 && count === 0 && (
                              <Typography component="div" variant="body2" sx={{ ml: 2, mb: 0.5, color: '#ff9800' }}>
                                • <strong>{fakeAnswers} Fake Answers</strong> (for {displayType})
                              </Typography>
                            )}
                          </div>
                        );
                      })}
                      
                      <Typography component="div" variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
                        Total: {totalCount} questions selected
                      </Typography>
                      
                      <Typography component="div" variant="body2" sx={{ mt: 2, color: '#666' }}>
                        This action will remove all questions that do not match your category selections. 
                        {Object.entries(breakdown).some(([, { fakeAnswers }]) => fakeAnswers > 0) && (
                          <span style={{ color: '#ff9800' }}>
                            {' '}Fake answers will be randomly selected from unselected questions in the same question type.
                          </span>
                        )}
                        {' '}Are you sure you want to continue?
                      </Typography>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                No questions match your current category selections. Please adjust your selections.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialogOpen(false)} 
            color="primary"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmFilter} 
            color="primary" 
            variant="contained"
            disabled={selectedQuestions.length === 0}
            sx={{
              backgroundColor: '#000',
              '&:hover': {
                backgroundColor: '#333',
              }
            }}
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategorySelection;
