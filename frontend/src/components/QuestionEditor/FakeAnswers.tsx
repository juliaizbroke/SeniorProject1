import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Chip,
  TextField,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Question } from '../../types';

const QuestionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: '1px solid #e2e8f0',
  borderRadius: theme.spacing(1),
  backgroundColor: '#f8fafc',
  boxShadow: 'none',
}));

interface FakeAnswersProps {
  questions: Question[];
  editingQuestions: Set<string>;
  tempQuestions: Question[];
  lockedQuestions: Set<string>;
  lockedCategories: Set<string>;
  getQuestionId: (question: Question, index: number) => string;
  onQuestionChange: (index: number, field: keyof Question, value: string | boolean) => void;
  onEdit: (questionId: string) => void;
  onSave: (questionId: string) => void;
  onCancel: (questionId: string) => void;
  onLockToggle: (questionId: string) => void;
  onCategoryLockToggle: (questionId: string) => void;
}

export default function FakeAnswers({
  questions,
  editingQuestions,
  tempQuestions,
  lockedQuestions,
  lockedCategories,
  getQuestionId,
  onQuestionChange,
  onEdit,
  onSave,
  onCancel,
  onLockToggle,
  onCategoryLockToggle,
}: FakeAnswersProps) {
  const fakeAnswerQuestions = questions.filter(q => q.type === 'fake answer');
  
  if (fakeAnswerQuestions.length === 0) {
    return null;
  }

  return (
    <QuestionPaper 
      elevation={0}
      sx={{
        borderColor: '#ff9800',
        borderWidth: '2px',
        backgroundColor: '#fff8e1',
        borderStyle: 'solid',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Chip
          label="FAKE ANSWERS"
          color="warning"
          variant="filled"
          size="medium"
          sx={{ 
            fontSize: '0.8rem', 
            height: '24px',
            fontWeight: 'bold',
            backgroundColor: '#ff9800',
            color: 'white'
          }}
        />
      </Box>

      {/* Column headers */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 120px',
        gap: 2, 
        mb: 2, 
        pb: 1, 
        borderBottom: '1px solid #ffcc80',
        fontWeight: 'bold'
      }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e65100', textAlign: 'center' }}>
          Category
        </Typography>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#e65100', textAlign: 'center' }}>
          Answer (Fake Option)
        </Typography>
      </Box>
      
      <Stack spacing={1.5}>
        {questions.map((question, index) => {
          if (question.type !== 'fake answer') return null;
          
          const questionId = getQuestionId(question, index);
          const isEditing = editingQuestions.has(questionId);
          const isLocked = lockedQuestions.has(questionId);
          const isCategoryLocked = lockedCategories.has(questionId);
          const currentQuestion = isEditing ? tempQuestions[index] || question : question;
          
          return (
            <Box 
              key={`fake-answer-${index}`}
              sx={{ 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 120px',
                gap: 2,
                alignItems: 'center'
              }}
            >
              {/* Category Box */}
              <Box sx={{ 
                p: 1.5, 
                border: '1px solid',
                borderRadius: 1,
                backgroundColor: isLocked ? '#e8f4fd' : (isCategoryLocked ? '#f3e5f5' : '#fff8e1'),
                borderColor: isLocked ? '#4682b4' : (isCategoryLocked ? '#9c27b0' : '#ffcc80'),
                opacity: isLocked ? 0.8 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1
              }}>
                {isEditing ? (
                  <TextField
                    value={currentQuestion.category?.replace('fake answers - ', '') || ''}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      // Don't force 'manual' during typing - let user edit freely
                      const formattedCategory = newCategory ? `fake answers - ${newCategory}` : 'fake answers - ';
                      onQuestionChange(index, 'category', formattedCategory);
                    }}
                    onBlur={(e) => {
                      // Only apply 'manual' fallback when user finishes editing (on blur)
                      const newCategory = e.target.value.trim();
                      if (!newCategory) {
                        const formattedCategory = 'fake answers - manual';
                        onQuestionChange(index, 'category', formattedCategory);
                      }
                    }}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter category (e.g., Math, Science)"
                    size="small"
                    sx={{ 
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        height: '32px',
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ 
                    fontWeight: 500, 
                    color: isLocked ? '#2c5282' : (isCategoryLocked ? '#6a1b9a' : '#bf360c'),
                    fontSize: '0.875rem',
                    flex: 1
                  }}>
                    {question.category?.replace('fake answers - ', '') || question.category}
                  </Typography>
                )}
                
                {isLocked && (
                  <LockIcon sx={{ color: '#4682b4', fontSize: '1rem' }} />
                )}
                
                {/* Category Lock Button */}
                <Tooltip title={isCategoryLocked ? "Unlock category (allows category shuffling)" : "Lock category (only answer will shuffle)"}>
                  <span>
                    <IconButton 
                      size="small" 
                      onClick={() => onCategoryLockToggle(questionId)}
                      disabled={isLocked} // Disable if the whole question is locked
                      sx={{ 
                        p: 0.3,
                        color: isCategoryLocked ? '#9c27b0' : '#999',
                        '&:hover': { bgcolor: 'action.hover' },
                        '&.Mui-disabled': { color: 'rgba(0, 0, 0, 0.26)' }
                      }}
                    >
                      {isCategoryLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {/* Answer Box */}
              <Box sx={{ 
                p: 1.5, 
                border: '1px solid',
                borderRadius: 1,
                backgroundColor: isLocked ? '#e8f4fd' : '#fff8e1',
                borderColor: isLocked ? '#4682b4' : '#ffcc80',
                opacity: isLocked ? 0.8 : 1,
              }}>
                {isEditing ? (
                  <TextField
                    value={currentQuestion.answer || ''}
                    onChange={(e) => onQuestionChange(index, 'answer', e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter the fake answer/distractor"
                    size="small"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                ) : (
                  <Typography variant="body2" sx={{ 
                    color: 'text.primary',
                    fontStyle: currentQuestion.answer ? 'normal' : 'italic',
                    opacity: currentQuestion.answer ? 1 : 0.7,
                    fontSize: '0.875rem',
                    p: 0.5,
                    bgcolor: currentQuestion.answer ? 'transparent' : 'rgba(0,0,0,0.03)',
                    borderRadius: 0.5,
                    border: currentQuestion.answer ? 'none' : '1px dashed #ccc'
                  }}>
                    {currentQuestion.answer || 'No answer provided - click edit to add'}
                  </Typography>
                )}
              </Box>
                
              {/* Actions Box */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                justifyContent: 'center',
                flexDirection: 'column'
              }}>
                {/* Lock status chips */}
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {isLocked && (
                    <Chip
                      label="Locked"
                      size="small"
                      sx={{ 
                        fontSize: '0.65rem', 
                        height: '16px',
                        backgroundColor: '#4682b4',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  )}
                </Box>
                  
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {/* Main Lock/Unlock Button (locks both category and answer) */}
                  <Tooltip title={isLocked ? "Unlock fake answer (unlocks both category and answer)" : "Lock fake answer (locks both category and answer)"}>
                    <IconButton 
                      size="small" 
                      onClick={() => onLockToggle(questionId)}
                      sx={{ 
                        p: 0.5,
                        color: isLocked ? '#4682b4' : '#666',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      {isLocked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  
                  {!isEditing ? (
                    <Tooltip title={isLocked ? "Answer is locked" : "Edit fake answer"}>
                      <span>
                        <IconButton 
                          size="small" 
                          onClick={() => onEdit(questionId)}
                          disabled={isLocked}
                          sx={{ 
                            p: 0.5,
                            '&:hover': { bgcolor: 'action.hover' },
                            '&.Mui-disabled': {
                              color: 'rgba(0, 0, 0, 0.26)'
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton 
                        size="small" 
                        onClick={() => onSave(questionId)}
                        color="primary"
                        sx={{ p: 0.5 }}
                      >
                        <SaveIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => onCancel(questionId)}
                        color="error"
                        sx={{ p: 0.5 }}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>
    </QuestionPaper>
  );
}
