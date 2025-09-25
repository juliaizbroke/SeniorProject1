import React, { useState, useEffect } from 'react';
import Image from 'next/image';
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
  Badge,
  Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PushPinIcon from '@mui/icons-material/PushPin';
import { secondaryButtonStyles } from '../../utils/buttonStyles';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningIcon from '@mui/icons-material/Warning';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
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
  allQuestions: Question[]; // Add this to check for actual duplicates
  onQuestionChange: (index: number, field: keyof Question, value: string | boolean) => void;
  onEdit: (questionId: string) => void;
  onSave: (questionId: string) => void;
  onCancel: (questionId: string) => void;
  onLockToggle: (questionId: string) => void;
  onShowDuplicates?: () => void;
  duplicateTooltipText?: string;
  hideSimilarityInfo?: boolean;
  hideDuplicateIcons?: boolean;
  hideDuplicateColors?: boolean;
}

export default function RegularQuestion({
  question,
  index,
  isEditing,
  isLocked,
  currentQuestion,
  questionId,
  allQuestions,
  onQuestionChange,
  onEdit,
  onSave,
  onCancel,
  onLockToggle,
  onShowDuplicates,
  duplicateTooltipText,
  hideSimilarityInfo = false,
  hideDuplicateIcons = false,
  hideDuplicateColors = false,
}: RegularQuestionProps) {
  // Local state for immediate image display
  const [localImageData, setLocalImageData] = useState<{
    has_uploaded_image: boolean;
    uploaded_image_url?: string;
    uploaded_image_filename?: string;
  }>({
    has_uploaded_image: Boolean(currentQuestion.has_uploaded_image || currentQuestion.uploaded_image_url),
    uploaded_image_url: currentQuestion.uploaded_image_url,
    uploaded_image_filename: currentQuestion.uploaded_image_filename,
  });

  // Update local state when currentQuestion changes
  useEffect(() => {
    setLocalImageData({
      has_uploaded_image: Boolean(currentQuestion.has_uploaded_image || currentQuestion.uploaded_image_url),
      uploaded_image_url: currentQuestion.uploaded_image_url,
      uploaded_image_filename: currentQuestion.uploaded_image_filename,
    });
  }, [currentQuestion.has_uploaded_image, currentQuestion.uploaded_image_url, currentQuestion.uploaded_image_filename]);

  const getQuestionChoices = (question: Question) => {
    if (question.type.toLowerCase() === 'multiple choice') {
      return ['a', 'b', 'c', 'd', 'e'].map(choice => ({
        key: choice,
        value: question[choice as keyof Question] || ''
      }));
    }
    return [];
  };

  // Check if this question is actually a duplicate in the current exam
  const isActualDuplicate = () => {
    if (!question.is_duplicate || !question.duplicate_group_id) return false;
    
    // Count how many questions in the current exam have the same duplicate_group_id
    const sameGroupQuestions = allQuestions.filter(q => 
      q.duplicate_group_id === question.duplicate_group_id
    );
    
    return sameGroupQuestions.length > 1;
  };

  const getDuplicateBackgroundColor = () => {
    if (!isActualDuplicate()) return 'rgba(255,255,255,0.12)';
    
    if (question.duplicate_representative) {
      return 'rgba(76, 175, 80, 0.08)'; // Light green for representative
    }
    
    const similarity = question.duplicate_similarity || 0;
    if (similarity >= 0.9) return 'rgba(244, 67, 54, 0.08)'; // Light red for high similarity
    if (similarity >= 0.8) return 'rgba(255, 152, 0, 0.08)'; // Light orange
    return 'rgba(255, 235, 59, 0.08)'; // Light yellow for medium similarity
  };

  const getDuplicateBorderColor = () => {
    if (!isActualDuplicate()) return isLocked ? '#4682b4' : 'rgba(255,255,255,0.18)';
    
    if (question.duplicate_representative) return '#4caf50';
    
    const similarity = question.duplicate_similarity || 0;
    if (similarity >= 0.9) return '#f44336';
    if (similarity >= 0.8) return '#ff9800';
    return '#ffeb3b';
  };

  // Handle image upload for this question
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Starting image upload for question:', index, file.name);

    // Check file type (PNG and JPEG only)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload PNG or JPEG images only');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('question_id', index.toString());
      formData.append('session_id', Date.now().toString()); // Simple session ID

      console.log('Sending request to upload endpoint...');

      const response = await fetch(`${API_BASE_URL}/upload-question-image`, {
        method: 'POST',
        body: formData,
      });

      console.log('Upload response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('Upload error:', error);
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      console.log('✅ Image upload successful:', result.filename);
      
      // Update local state immediately for instant display
      const imageUrl = `${API_BASE_URL}/images/${result.filename}`;
      setLocalImageData({
        has_uploaded_image: true,
        uploaded_image_filename: result.filename,
        uploaded_image_url: imageUrl,
      });
      
      // Update question data in parent component
      onQuestionChange(index, 'has_uploaded_image', true);
      onQuestionChange(index, 'uploaded_image_filename', result.filename);
      onQuestionChange(index, 'uploaded_image_url', imageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  return (
    <QuestionPaper 
      key={`question-${index}-${question.type}`} 
      elevation={0}
      sx={{
        opacity: isLocked ? 0.8 : 1,
        borderColor: hideDuplicateColors ? (isLocked ? '#4682b4' : '#e0e0e0') : getDuplicateBorderColor(),
        borderWidth: isActualDuplicate() && !hideDuplicateColors ? '2px' : (isLocked ? '2px' : '1px'),
        background: hideDuplicateColors ? 'rgba(255,255,255,0.12)' : getDuplicateBackgroundColor(),
        boxShadow: (isActualDuplicate() && !hideDuplicateColors) ? 
          `0 8px 32px 0 ${getDuplicateBorderColor()}20` : 
          '0 8px 32px 0 rgba(31,38,135,0.18)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 2,
        border: `${(isActualDuplicate() && !hideDuplicateColors) ? '2px' : (isLocked ? '2px' : '1px')} solid ${hideDuplicateColors ? (isLocked ? '#4682b4' : '#e0e0e0') : getDuplicateBorderColor()}`,
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (isActualDuplicate() && !hideDuplicateColors) ? 
            `0 12px 40px 0 ${getDuplicateBorderColor()}30` : 
            '0 12px 40px 0 rgba(31,38,135,0.25)',
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          {/* Duplicate warning icon */}
          {!hideDuplicateIcons && isActualDuplicate() && (
            <Tooltip 
              title={duplicateTooltipText || `This question is similar to other questions in Group ${question.duplicate_group_id}`}
              arrow
            >
              <IconButton
                size="small"
                onClick={() => onShowDuplicates?.()}
                sx={{
                  p: 0.5,
                  color: question.duplicate_representative ? '#4caf50' : '#ff5722',
                  '&:hover': {
                    backgroundColor: question.duplicate_representative ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 87, 34, 0.1)',
                  }
                }}
              >
                <Badge
                  badgeContent={question.duplicate_group_id}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.6rem',
                      minWidth: '16px',
                      height: '16px',
                    }
                  }}
                >
                  {question.duplicate_representative ? <ContentCopyIcon fontSize="small" /> : <WarningIcon fontSize="small" />}
                </Badge>
              </IconButton>
            </Tooltip>
          )}
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight="500" sx={{ mb: 1 }}>
              {currentQuestion.question || 'Untitled Question'}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                label={`Category: ${question.category}`}
                color="default"
                variant="outlined"
                size="small"
                sx={{ fontSize: '0.7rem', height: '20px' }}
              />
              {question.has_grammar_issues && (
                <Tooltip title={`Potential grammar issue${(question.grammar_issue_count || 0) > 1 ? 's' : ''} detected`}>
                  <Chip
                    icon={<SpellcheckIcon sx={{ fontSize: '0.9rem' }} />}
                    label={`Potential grammar error${(question.grammar_issue_count || 0) > 1 ? 's' : ''}`}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      height: '20px',
                      backgroundColor: '#fde68a',
                      color: '#7a5200',
                      fontWeight: 600,
                    }}
                  />
                </Tooltip>
              )}
              {!hideSimilarityInfo && isActualDuplicate() && (
                <Tooltip title={question.duplicate_representative ? 
                  'This is the representative question that will be kept by default' : 
                  `Similarity: ${Math.round((question.duplicate_similarity || 0) * 100)}%`}>
                  <Chip
                    label={question.duplicate_representative ? 'Representative' : `Group ${question.duplicate_group_id}`}
                    size="small"
                    sx={{
                      fontSize: '0.65rem',
                      height: '20px',
                      backgroundColor: question.duplicate_representative ? '#4caf50' : getDuplicateBorderColor(),
                      color: 'white',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => onShowDuplicates?.()}
                  />
                </Tooltip>
              )}
              {!hideSimilarityInfo && isActualDuplicate() && typeof question.duplicate_similarity === 'number' && !question.duplicate_representative && (
                <Chip
                  label={`${Math.round(question.duplicate_similarity * 100)}% similar`}
                  size="small"
                  sx={{
                    fontSize: '0.65rem',
                    height: '20px',
                    backgroundColor: '#f39c12',
                    color: '#222',
                    fontWeight: 600
                  }}
                />
              )}
              {isLocked && (
                <Chip
                  label="Pinned"
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
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Tooltip title={isLocked ? "Unpin question" : "Pin question"}>
            <IconButton 
              size="small" 
              onClick={() => onLockToggle(questionId)}
              sx={{ 
                p: 0.5,
                color: isLocked ? '#4682b4' : '#666',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              {isLocked ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          
          {!isEditing ? (
            <Tooltip title={isLocked ? "Question is pinned" : "Edit question"}>
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
            <Stack direction="row" spacing={0.5}>
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

        {/* Image Upload Button (only when editing) */}
        {isEditing && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.85rem' }}>
              Image {currentQuestion.image_description ? `(${currentQuestion.image_description})` : ''}
            </Typography>
            <Button
              variant="outlined"
              component="label"
              size="small"
              sx={{ ...secondaryButtonStyles, minWidth: '120px' }}
            >
              {(currentQuestion.uploaded_image_url || localImageData.uploaded_image_url) ? 'Change Image' : 'Upload Image'}
              <input
                hidden
                accept="image/png,image/jpeg,image/jpg"
                type="file"
                onChange={handleImageUpload}
              />
            </Button>
          </Box>
        )}

        {/* Image Display (shown always when image exists, between question and options) */}
        {(currentQuestion.uploaded_image_url || localImageData.uploaded_image_url) && (
          <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ 
              maxWidth: '600px', 
              textAlign: 'center',
              border: '2px solid #e0e0e0',
              borderRadius: 2,
              p: 2,
              bgcolor: '#fafafa'
            }}>
              <Image
                src={localImageData.uploaded_image_url || currentQuestion.uploaded_image_url || ''}
                alt="Question image"
                width={600}
                height={300}
                unoptimized
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '300px',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
                onLoad={() => console.log('✅ Image loaded successfully:', localImageData.uploaded_image_url || currentQuestion.uploaded_image_url)}
                onError={(e) => console.error('❌ Image failed to load:', localImageData.uploaded_image_url || currentQuestion.uploaded_image_url, e)}
              />
              {isEditing && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                  {localImageData.uploaded_image_filename || currentQuestion.uploaded_image_filename}
                </Typography>
              )}
            </Box>
          </Box>
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
                      {key.toUpperCase()}. {String(value)}
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
                            {key.toUpperCase()}. {String(value) || 'Empty option'}
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
