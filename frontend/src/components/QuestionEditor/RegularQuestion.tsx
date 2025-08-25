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
  FormControl,
  Select,
  MenuItem,
  InputLabel,
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

interface RegularQuestionProps {
  question: Question;
  index: number;
  isEditing: boolean;
  isLocked: boolean;
  currentQuestion: Question;
  questionId: string;
  onQuestionChange: (index: number, field: keyof Question, value: string | boolean) => void;
  onEdit: (questionId: string, index: number) => void;
  onSave: (questionId: string, index: number) => void;
  onCancel: (questionId: string) => void;
  onLockToggle: (questionId: string) => void;
}

export default function RegularQuestion({
  question,
  index,
  isEditing,
  isLocked,
  currentQuestion,
  questionId,
  onQuestionChange,
  onEdit,
  onSave,
  onCancel,
  onLockToggle,
}: RegularQuestionProps) {
  const getQuestionChoices = (question: Question) => {
    if (question.type.toLowerCase() === 'multiple choice') {
      return ['a', 'b', 'c', 'd', 'e'].map(choice => ({
        key: choice,
        value: question[choice as keyof Question] || ''
      }));
    }
    return [];
  };

  return (
    <QuestionPaper 
      key={`question-${index}-${question.type}`} 
      elevation={0}
      sx={{
        opacity: isLocked ? 0.8 : 1,
        borderColor: isLocked ? '#4682b4' : '#e0e0e0',
        borderWidth: isLocked ? '2px' : '1px',
        background: 'rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.18)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" fontWeight="500" sx={{ mb: 1 }}>
            {currentQuestion.question || 'Untitled Question'}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Chip
              label={`Category: ${question.category}`}
              color="default"
              variant="outlined"
              size="small"
              sx={{ fontSize: '0.7rem', height: '20px' }}
            />
            {isLocked && (
              <Chip
                label="Locked"
                size="small"
                sx={{ 
                  fontSize: '0.7rem', 
                  height: '20px',
                  backgroundColor: '#4682b4',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
            )}
          </Stack>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Tooltip title={isLocked ? "Unlock question" : "Lock question"}>
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
            <Tooltip title={isLocked ? "Question is locked" : "Edit question"}>
              <span>
                <IconButton 
                  size="small" 
                  onClick={() => onEdit(questionId, index)}
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
            <Stack direction="row" spacing={0.5}>
              <IconButton 
                size="small" 
                onClick={() => onSave(questionId, index)}
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
            </Stack>
          )}
        </Box>
      </Box>

      <Stack spacing={2}>
        {/* Question Text - Only show in edit mode since it's already shown in header */}
        {isEditing && (
          <TextField
            label="Question Text"
            value={currentQuestion.question || ''}
            onChange={(e) => onQuestionChange(index, 'question', e.target.value)}
            multiline
            rows={2}
            fullWidth
            variant="outlined"
            size="small"
            spellCheck={true}
          />
        )}

        {/* Multiple Choice Options */}
        {currentQuestion.type.toLowerCase() === 'multiple choice' && (
          <Box>
            {isEditing ? (
              <Stack spacing={1}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                  Options
                </Typography>
                {getQuestionChoices(currentQuestion).map(({ key, value }) => (
                  <TextField
                    key={`choice-${key}`}
                    label={`Option ${key.toUpperCase()}`}
                    value={value}
                    onChange={(e) => onQuestionChange(index, key as keyof Question, e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                    spellCheck={true}
                  />
                ))}
              </Stack>
            ) : (
              <Stack spacing={1}>
                {getQuestionChoices(currentQuestion).map(({ key, value }) => (
                  <Box key={`choice-${key}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width: 20, 
                        height: 20, 
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: currentQuestion.answer?.toLowerCase() === key ? '#000' : '#ccc',
                        bgcolor: currentQuestion.answer?.toLowerCase() === key ? '#000' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {currentQuestion.answer?.toLowerCase() === key && (
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'white' }} />
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                      {key.toUpperCase()}. {value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        )}
        
        {/* Answer Section - Only show for editing or non-multiple choice */}
        {(isEditing || currentQuestion.type.toLowerCase() !== 'multiple choice') && (
          <Box>
            {isEditing && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.85rem' }}>
                  Answer
                </Typography>
                <FormControl fullWidth size="small">
                  {currentQuestion.type.toLowerCase() === 'multiple choice' ? (
                    <>
                      <InputLabel>Correct Answer</InputLabel>
                      <Select
                        value={currentQuestion.answer || ''}
                        onChange={(e) => onQuestionChange(index, 'answer', e.target.value)}
                        label="Correct Answer"
                      >
                        {getQuestionChoices(currentQuestion).map(({ key, value }) => (
                          <MenuItem key={key} value={key} disabled={!value}>
                            {key.toUpperCase()}. {value || 'Empty option'}
                          </MenuItem>
                        ))}
                      </Select>
                    </>
                  ) : currentQuestion.type.toLowerCase() === 'written question' ? (
                    <TextField
                      value={currentQuestion.answer || ''}
                      onChange={(e) => onQuestionChange(index, 'answer', e.target.value)}
                      fullWidth
                      variant="outlined"
                      label="Answer"
                      multiline
                      rows={currentQuestion.q_type?.toLowerCase() === 'long' ? 3 : 2}
                      size="small"
                      spellCheck={true}
                    />
                  ) : (
                    <TextField
                      value={currentQuestion.answer || ''}
                      onChange={(e) => onQuestionChange(index, 'answer', e.target.value)}
                      fullWidth
                      variant="outlined"
                      label="Answer"
                      size="small"
                      spellCheck={true}
                    />
                  )}
                </FormControl>
              </>
            )}
            
            {!isEditing && currentQuestion.type.toLowerCase() !== 'multiple choice' && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.85rem' }}>
                  Answer
                </Typography>
                <Typography variant="body2" sx={{ 
                  p: 1.5, 
                  bgcolor: '#f0f8f0', 
                  borderRadius: 1,
                  color: 'text.primary',
                  border: '1px solid #e0e0e0'
                }}>
                  {currentQuestion.answer || 'No answer provided'}
                </Typography>
              </>
            )}
          </Box>
        )}
        
        {/* Image Path (only show when editing and image exists) */}
        {isEditing && currentQuestion.image && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.85rem' }}>
              Image Path
            </Typography>
            <TextField
              label="Image Path"
              value={currentQuestion.image}
              onChange={(e) => onQuestionChange(index, 'image', e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              spellCheck={true}
            />
          </Box>
        )}
      </Stack>
    </QuestionPaper>
  );
}
