import { Question } from '../types';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';
import { useState } from 'react';

interface QuestionEditorProps {
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
}

const QuestionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: '1px solid #e0e0e0',
  borderRadius: theme.spacing(1),
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}));

export default function QuestionEditor({ questions, onQuestionsChange }: QuestionEditorProps) {
  const [editingQuestions, setEditingQuestions] = useState<Set<number>>(new Set());
  const [tempQuestions, setTempQuestions] = useState<Question[]>([]);

  const handleQuestionChange = (index: number, field: keyof Question, value: string | boolean) => {
    const updatedQuestions = [...tempQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setTempQuestions(updatedQuestions);
  };

  const handleEdit = (index: number) => {
    setEditingQuestions(prev => new Set(prev).add(index));
    // Initialize temp questions with current data for this question
    const newTempQuestions = [...questions];
    setTempQuestions(newTempQuestions);
  };

  const handleSave = (index: number) => {
    // Update the main questions array with changes
    onQuestionsChange(tempQuestions);
    setEditingQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const handleCancel = (index: number) => {
    setEditingQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    // Reset temp questions to original state
    setTempQuestions([...questions]);
  };

  const getQuestionChoices = (question: Question) => {
    if (question.type.toLowerCase() === 'multiple choice') {
      return ['a', 'b', 'c', 'd', 'e'].map(choice => ({
        key: choice,
        value: question[choice as keyof Question] || ''
      }));
    }
    return [];
  };  return (
    <Stack spacing={2}>
      {questions.map((question, index) => {
        const isEditing = editingQuestions.has(index);
        const currentQuestion = isEditing ? tempQuestions[index] || question : question;
        
        return (          <QuestionPaper key={`question-${index}-${question.type}`} elevation={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="500" sx={{ mb: 1 }}>
                  {currentQuestion.question || 'Untitled Question'}
                </Typography>
                <Chip
                  label={`Category: ${question.category}`}
                  color="default"
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: '0.7rem', height: '20px' }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                {!isEditing ? (
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit(index)}
                    sx={{ 
                      p: 0.5,
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                ) : (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleSave(index)}
                      color="primary"
                      sx={{ p: 0.5 }}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCancel(index)}
                      color="error"
                      sx={{ p: 0.5 }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Box>
            </Box>            <Stack spacing={2}>
              {/* Question Text - Only show in edit mode since it's already shown in header */}
              {isEditing && (
                <TextField
                  label="Question Text"
                  value={currentQuestion.question || ''}
                  onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                  multiline
                  rows={2}
                  fullWidth
                  variant="outlined"
                  size="small"
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
                          onChange={(e) => handleQuestionChange(index, key as keyof Question, e.target.value)}
                          fullWidth
                          variant="outlined"
                          size="small"
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
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {value || `Option ${key.toUpperCase()}`}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}              {/* Answer Section - Only show for editing or non-multiple choice */}
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
                            <InputLabel>Answer</InputLabel>
                            <Select
                              value={(currentQuestion.answer || '').toUpperCase()}
                              onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                              label="Answer"
                            >
                              {['A', 'B', 'C', 'D', 'E'].map((choice) => (
                                <MenuItem key={`answer-${choice}`} value={choice}>
                                  {choice}
                                </MenuItem>
                              ))}
                            </Select>
                          </>
                        ) : currentQuestion.type.toLowerCase() === 'written question' ? (
                          <TextField
                            value={currentQuestion.answer || ''}
                            onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                            fullWidth
                            variant="outlined"
                            label="Answer"
                            multiline
                            rows={currentQuestion.q_type?.toLowerCase() === 'long' ? 3 : 2}
                            size="small"
                          />
                        ) : (
                          <TextField
                            value={currentQuestion.answer || ''}
                            onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                            fullWidth
                            variant="outlined"
                            label="Answer"
                            size="small"
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
              )}              {/* Image Path (only show when editing or when image exists) */}
              {isEditing && currentQuestion.image && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.85rem' }}>
                    Image Path
                  </Typography>
                  <TextField
                    label="Image Path"
                    value={currentQuestion.image}
                    onChange={(e) => handleQuestionChange(index, 'image', e.target.value)}
                    fullWidth
                    variant="outlined"
                    size="small"
                  />
                </Box>
              )}
            </Stack>
          </QuestionPaper>
        );
      })}
    </Stack>
  );
}
