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
        
        <Tooltip title="Apply your category selections and filter the question list">
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleApplyFilters}
            startIcon={<FilterAltIcon />}
            sx={{
              backgroundColor: '#000',
              '&:hover': {
                backgroundColor: '#333',
              },
              borderRadius: '8px',
              px: 3
            }}
          >
            Apply Filters
          </Button>
        </Tooltip>
      </Box>
      
      {Object.entries(questionGroups).map(([type, categories]) => (
        <Accordion key={type} sx={{ mb: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              bgcolor: 'rgba(0, 0, 0, 0.03)', 
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' } 
            }}
          >
            <Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
              {type === 'written question' ? 'Written Questions' : type}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Available</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Select</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(categories).map(([category, questions]) => (
                    <TableRow key={category}>
                      <TableCell>{category}</TableCell>
                      <TableCell>{questions.length}</TableCell>
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
          <DialogContentText id="alert-dialog-description">
            {selectedQuestions.length > 0 ? (
              <>
                This will filter your question list down to {selectedQuestions.length} questions based on your category selections.
                <br /><br />
                This action will remove all questions that don't match your category selections. Are you sure you want to continue?
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
