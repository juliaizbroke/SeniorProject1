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
  Button,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import { styled } from '@mui/material/styles';
import { useState, useEffect } from 'react';

interface QuestionEditorProps {
  questions: Question[];
  allQuestionsPool: Question[]; // Full pool of all available questions for shuffling
  onQuestionsChange: (questions: Question[]) => void;
  forceRefreshLocks?: number; // Trigger to force refresh of lock state
}

const QuestionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  border: '1px solid #e2e8f0',
  borderRadius: theme.spacing(1),
  backgroundColor: '#f8fafc',
  boxShadow: 'none',
}));

export default function QuestionEditor({ questions, allQuestionsPool, onQuestionsChange, forceRefreshLocks }: QuestionEditorProps) {
  const [editingQuestions, setEditingQuestions] = useState<Set<string>>(new Set());
  const [tempQuestions, setTempQuestions] = useState<Question[]>([]);
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(new Set());
  const [hasIdCollisions, setHasIdCollisions] = useState(false);
  // Load locked questions from localStorage on component mount
  useEffect(() => {
    const savedLocks = localStorage.getItem('lockedQuestions');
    if (savedLocks) {
      try {
        const lockedIds = JSON.parse(savedLocks);
        setLockedQuestions(new Set(lockedIds));
      } catch (error) {
        console.error('Error loading locked questions:', error);
      }
    } else {
      // No locks in localStorage, clear the state
      setLockedQuestions(new Set());
    }
  }, []);

  // Force refresh lock state when parent triggers it
  useEffect(() => {
    if (forceRefreshLocks !== undefined) {
      const savedLocks = localStorage.getItem('lockedQuestions');
      if (savedLocks) {
        try {
          const lockedIds = JSON.parse(savedLocks);
          setLockedQuestions(new Set(lockedIds));
        } catch (error) {
          console.error('Error refreshing locked questions:', error);
        }
      } else {
        // No locks in localStorage, clear the state
        setLockedQuestions(new Set());
      }
    }
  }, [forceRefreshLocks]);// Save locked questions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lockedQuestions', JSON.stringify(Array.from(lockedQuestions)));
  }, [lockedQuestions]);  // Debug: Check for ID collisions
  useEffect(() => {
    const idMap = new Map<string, number>();
    const questionDetails = new Map<string, Question[]>();
    let collisionDetected = false;
    
    questions.forEach((question, index) => {
      const id = getQuestionId(question, index);
      const count = idMap.get(id) || 0;
      idMap.set(id, count + 1);
      
      // Store question details for debugging
      if (!questionDetails.has(id)) {
        questionDetails.set(id, []);
      }
      questionDetails.get(id)?.push(question);
      
      if (count > 0) {
        collisionDetected = true;
        const conflictingQuestions = questionDetails.get(id) || [];
        console.warn(`ID Collision detected! ID: ${id}`, {
          conflictingQuestions: conflictingQuestions.map((q, i) => ({
            index: i,
            question: q.question?.substring(0, 100),
            type: q.type,
            category: q.category,
            answer: q.answer?.substring(0, 50)
          }))
        });
      }
    });
    
    setHasIdCollisions(collisionDetected);
    
    // Only show warning if there are genuine collisions (not just similar questions)
    if (collisionDetected) {
      console.log('Total questions:', questions.length);
      console.log('Unique IDs:', idMap.size);
      console.log('ID collision rate:', ((questions.length - idMap.size) / questions.length * 100).toFixed(1) + '%');
    }
  }, [questions]);// Generate unique ID for each question - robust approach to prevent collisions
  const getQuestionId = (question: Question, index: number) => {
    // Create a comprehensive content string including ALL unique aspects
    const contentParts = [
      `idx:${index}`, // Always include index as primary uniqueness factor
      `type:${question.type || 'unknown'}`,
      `q:${question.question?.trim() || `empty_q_${index}`}`,
      `cat:${question.category?.trim() || 'no_category'}`,
      `ans:${question.answer?.trim() || 'no_answer'}`,
      `qtype:${question.q_type?.trim() || 'none'}`,
      `img:${question.image?.trim() || 'none'}`,
      `long:${question.is_long?.toString() || 'false'}`
    ];
    
    // Add multiple choice options with explicit labeling
    if (question.type.toLowerCase() === 'multiple choice') {
      contentParts.push(
        `a:${question.a?.trim() || 'empty_a'}`,
        `b:${question.b?.trim() || 'empty_b'}`,
        `c:${question.c?.trim() || 'empty_c'}`,
        `d:${question.d?.trim() || 'empty_d'}`,
        `e:${question.e?.trim() || 'empty_e'}`
      );
    }
    
    // Join all parts and create a unique signature
    const fullContent = contentParts.join('||');
    
    // Create hash from content
    let hash = '';
    try {
      hash = btoa(fullContent).replace(/[^a-zA-Z0-9]/g, '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Fallback for special characters
      hash = btoa(encodeURIComponent(fullContent)).replace(/[^a-zA-Z0-9]/g, '');
    }
      // Ensure minimum length and add content length as additional uniqueness
    const contentLength = fullContent.length.toString(36); // base36 for compactness
    const finalId = `q${index}_${hash.substring(0, 20)}_${contentLength}`;
    
    return finalId;
  };

  const handleQuestionChange = (index: number, field: keyof Question, value: string | boolean) => {
    const updatedQuestions = [...tempQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setTempQuestions(updatedQuestions);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  };  const handleEdit = (questionId: string, index: number) => {
    if (lockedQuestions.has(questionId)) {
      return; // Don't allow editing locked questions
    }
    setEditingQuestions(prev => new Set(prev).add(questionId));
    // Initialize temp questions with current data for this question
    const newTempQuestions = [...questions];
    setTempQuestions(newTempQuestions);
  };

  const handleLockToggle = (questionId: string) => {
    setLockedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
        // If the question is being edited, cancel the edit
        if (editingQuestions.has(questionId)) {
          handleCancel(questionId);
        }
      }
      return newSet;
    });
  };  // Check if shuffle is available and determine shuffle mode
  const getShuffleInfo = () => {
    const unlockedCount = questions.filter((q, i) => !lockedQuestions.has(getQuestionId(q, i))).length;
    const lockedCount = questions.length - unlockedCount;
    
    // Get available pool excluding locked and current unlocked questions
    const getContentHash = (question: Question) => {
      const contentParts = [
        `type:${question.type || 'unknown'}`,
        `q:${question.question?.trim() || 'empty'}`,
        `cat:${question.category?.trim() || 'no_category'}`,
        `ans:${question.answer?.trim() || 'no_answer'}`,
        `qtype:${question.q_type?.trim() || 'none'}`,
        `img:${question.image?.trim() || 'none'}`,
        `long:${question.is_long?.toString() || 'false'}`
      ];
      
      if (question.type.toLowerCase() === 'multiple choice') {
        contentParts.push(
          `a:${question.a?.trim() || 'empty_a'}`,
          `b:${question.b?.trim() || 'empty_b'}`,
          `c:${question.c?.trim() || 'empty_c'}`,
          `d:${question.d?.trim() || 'empty_d'}`,
          `e:${question.e?.trim() || 'empty_e'}`
        );
      }
      
      return contentParts.join('||');
    };
    
    const lockedQuestionHashes = questions
      .filter((q, i) => lockedQuestions.has(getQuestionId(q, i)))
      .map(q => getContentHash(q));
    
    const unlockedQuestions = questions.filter((q, i) => !lockedQuestions.has(getQuestionId(q, i)));
    const unlockedQuestionHashes = unlockedQuestions.map(q => getContentHash(q));
      // Check category-aware availability
    let totalAvailableFromCategories = 0;
    let questionsWithCategoryOptions = 0;
    
    unlockedQuestions.forEach(unlockedQuestion => {
      const availableFromSameCategory = allQuestionsPool.filter(q => {
        const hash = getContentHash(q);
        return q.category === unlockedQuestion.category && 
               !lockedQuestionHashes.includes(hash) && 
               !unlockedQuestionHashes.includes(hash);
      });
      
      if (availableFromSameCategory.length > 0) {
        totalAvailableFromCategories += availableFromSameCategory.length;
        questionsWithCategoryOptions++;
      }
    });
    
    return {
      unlockedCount,
      lockedCount,
      availableFromPool: totalAvailableFromCategories,
      questionsWithCategoryOptions,
      canShuffle: unlockedCount > 0 && (unlockedCount > 1 || totalAvailableFromCategories > 0),
      shuffleMode: 
        unlockedCount === 1 && totalAvailableFromCategories === 0 ? 'disabled' :
        unlockedCount === 1 && totalAvailableFromCategories > 0 ? 'replace' :
        totalAvailableFromCategories === 0 ? 'reorder' : 'fresh'
    };
  };

  const shuffleInfo = getShuffleInfo();  const getShuffleTooltip = () => {
    switch (shuffleInfo.shuffleMode) {
      case 'disabled':
        return 'Cannot shuffle: only 1 unlocked question with no alternatives available in the same category';
      case 'replace':
        return 'Replace unlocked question with a different one from the same category';
      case 'reorder':
        return 'Reorder unlocked questions (no different questions available in their categories)';
      case 'fresh':
        return 'Replace unlocked questions with different ones from their respective categories';
      default:
        return 'Shuffle questions (category-aware)';
    }
  };
  const handleShuffleQuestions = () => {
    const shuffleInfo = getShuffleInfo();
    
    const unlockedQuestionsWithIndex: { question: Question; index: number }[] = [];
    const lockedQuestionsWithIndex: { question: Question; index: number }[] = [];
    
    // Separate locked and unlocked questions with their original indices
    questions.forEach((question, index) => {
      const questionId = getQuestionId(question, index);
      if (lockedQuestions.has(questionId)) {
        lockedQuestionsWithIndex.push({ question, index });
      } else {
        unlockedQuestionsWithIndex.push({ question, index });
      }
    });

    // Handle different shuffle modes
    if (shuffleInfo.shuffleMode === 'disabled') {
      return; // Do nothing if shuffle is disabled
    }

    const getContentHash = (question: Question) => {
      const contentParts = [
        `type:${question.type || 'unknown'}`,
        `q:${question.question?.trim() || 'empty'}`,
        `cat:${question.category?.trim() || 'no_category'}`,
        `ans:${question.answer?.trim() || 'no_answer'}`,
        `qtype:${question.q_type?.trim() || 'none'}`,
        `img:${question.image?.trim() || 'none'}`,
        `long:${question.is_long?.toString() || 'false'}`
      ];
      
      if (question.type.toLowerCase() === 'multiple choice') {
        contentParts.push(
          `a:${question.a?.trim() || 'empty_a'}`,
          `b:${question.b?.trim() || 'empty_b'}`,
          `c:${question.c?.trim() || 'empty_c'}`,
          `d:${question.d?.trim() || 'empty_d'}`,
          `e:${question.e?.trim() || 'empty_e'}`
        );
      }
      
      return contentParts.join('||');
    };

    if (shuffleInfo.shuffleMode === 'replace' && unlockedQuestionsWithIndex.length === 1) {
      // Replace single unlocked question with random question from same category
      const unlockedItem = unlockedQuestionsWithIndex[0];
      const targetCategory = unlockedItem.question.category;

      const lockedContentHashes = new Set(lockedQuestionsWithIndex.map(item => getContentHash(item.question)));
      const currentUnlockedHashes = new Set([getContentHash(unlockedItem.question)]);
      
      // Find available questions from the same category
      const availableFromSameCategory = allQuestionsPool.filter(q => {
        const contentHash = getContentHash(q);
        return q.category === targetCategory && 
               !lockedContentHashes.has(contentHash) && 
               !currentUnlockedHashes.has(contentHash);
      });
      
      if (availableFromSameCategory.length > 0) {
        const randomReplacement = availableFromSameCategory[Math.floor(Math.random() * availableFromSameCategory.length)];
        const shuffledQuestions = [...questions];
        shuffledQuestions[unlockedItem.index] = randomReplacement;
        onQuestionsChange(shuffledQuestions);
      }
      // If no questions available from same category, do nothing (skip)
      return;
    }

    if (shuffleInfo.shuffleMode === 'reorder') {
      // Just shuffle positions of unlocked questions (category doesn't matter for reordering)
      const shuffledUnlocked = [...unlockedQuestionsWithIndex].sort(() => Math.random() - 0.5);
      const shuffledQuestions = [...questions];
      
      shuffledUnlocked.forEach((shuffledItem, idx) => {
        const originalIndex = unlockedQuestionsWithIndex[idx].index;
        shuffledQuestions[originalIndex] = shuffledItem.question;
      });
      
      onQuestionsChange(shuffledQuestions);
      return;
    }    // Default 'fresh' mode - category-aware replacement
    const lockedContentHashes = new Set(lockedQuestionsWithIndex.map(item => getContentHash(item.question)));
    const currentUnlockedHashes = new Set(unlockedQuestionsWithIndex.map(item => getContentHash(item.question)));
    
    const shuffledQuestions = [...questions];
    
    // Process each unlocked question individually for category-aware replacement
    unlockedQuestionsWithIndex.forEach(unlockedItem => {
      const targetCategory = unlockedItem.question.category;
      
      // Find available questions from the same category (excluding locked and ALL current unlocked)
      const availableFromSameCategory = allQuestionsPool.filter(q => {
        const contentHash = getContentHash(q);
        return q.category === targetCategory && 
               !lockedContentHashes.has(contentHash) && 
               !currentUnlockedHashes.has(contentHash);
      });
      
      // Only replace if there are different questions available in the same category
      if (availableFromSameCategory.length > 0) {
        const randomQuestion = availableFromSameCategory[Math.floor(Math.random() * availableFromSameCategory.length)];
        shuffledQuestions[unlockedItem.index] = randomQuestion;
        
        // Update current unlocked hashes to avoid duplicates in subsequent iterations
        currentUnlockedHashes.delete(getContentHash(unlockedItem.question));
        currentUnlockedHashes.add(getContentHash(randomQuestion));
      }
      // If no different questions available from same category, keep the original question
      // (This maintains the constraint that questions should only be replaced within their category)
    });
    
    onQuestionsChange(shuffledQuestions);
  };const handleClearAllLocks = () => {
    setLockedQuestions(new Set());
    // Also clear any current editing states for consistency
    setEditingQuestions(new Set());
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = (questionId: string, index: number) => {
    // Update the main questions array with changes
    onQuestionsChange(tempQuestions);
    setEditingQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  };

  const handleCancel = (questionId: string) => {
    setEditingQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
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
    <Stack spacing={2}>      {/* Show warning only for significant ID collisions */}
      {hasIdCollisions && questions.length > 1 && (
        <Box sx={{
          p: 2,
          background: 'rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="body2" sx={{ color: '#92400e', flex: 1 }}>
            ⚠️ Some questions have similar content and may share lock states. Check browser console for details.
          </Typography>
        </Box>
      )}

      {/* Show info about locks in other tabs */}
      {lockedQuestions.size > 0 && !questions.some((q, i) => lockedQuestions.has(getQuestionId(q, i))) && (
        <Box sx={{
          p: 2,
          background: 'rgba(255,255,255,0.12)',
          boxShadow: '0 8px 32px 0 rgba(31,38,135,0.18)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 1,
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <LockIcon sx={{ color: '#1e40af' }} />
          <Typography variant="body2" sx={{ color: '#1e40af', flex: 1 }}>
            You have {lockedQuestions.size} locked question(s) in other tabs. They remain locked even when not visible.
          </Typography>
        </Box>
      )}      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
        {lockedQuestions.size > 0 && (
          <Tooltip title="Clear all locked questions">
            <Button
              variant="outlined"
              startIcon={<LockOpenOutlinedIcon />}
              onClick={handleClearAllLocks}
              sx={{
                borderColor: '#dc2626',
                color: '#dc2626',
                '&:hover': {
                  borderColor: '#b91c1c',
                  backgroundColor: 'rgba(220, 38, 38, 0.04)',
                },
              }}
            >
              Clear All Locks ({lockedQuestions.size})
            </Button>
          </Tooltip>
        )}        <Tooltip title={getShuffleTooltip()}>
          <span>
            <Button
              variant="outlined"
              startIcon={<ShuffleIcon />}
              onClick={handleShuffleQuestions}
              disabled={!getShuffleInfo().canShuffle}
              sx={{
                borderColor: getShuffleInfo().canShuffle ? '#1e3a8a' : '#ccc',
                color: getShuffleInfo().canShuffle ? '#1e3a8a' : '#999',
                '&:hover': {
                  borderColor: getShuffleInfo().canShuffle ? '#1e40af' : '#ccc',
                  backgroundColor: getShuffleInfo().canShuffle ? 'rgba(30, 58, 138, 0.04)' : 'transparent',
                },
                '&.Mui-disabled': {
                  borderColor: '#ccc',
                  color: '#999',
                },
              }}
            >
              Shuffle Questions
            </Button>
          </span>
        </Tooltip>
      </Box>{questions.map((question, index) => {
        const questionId = getQuestionId(question, index);
        const isEditing = editingQuestions.has(questionId);
        const isLocked = lockedQuestions.has(questionId);
        const currentQuestion = isEditing ? tempQuestions[index] || question : question;
          return (          <QuestionPaper 
            key={`question-${index}-${question.type}`} 
            elevation={0}
            sx={{
              opacity: isLocked ? 0.8 : 1,
              borderColor: isLocked ? '#1e40af' : '#e2e8f0',
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
                  />                  {lockedQuestions.has(questionId) && (
                    <Chip
                      label="Locked"
                      color="warning"
                      variant="filled"
                      size="small"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  )}
                </Stack>
              </Box>              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                {/* Lock/Unlock Button */}
                <Tooltip title={lockedQuestions.has(questionId) ? "Unlock question" : "Lock question"}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleLockToggle(questionId)}
                    sx={{ 
                      p: 0.5,
                      color: lockedQuestions.has(questionId) ? '#1e40af' : '#666',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    {lockedQuestions.has(questionId) ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                
                {!isEditing ? (
                  <Tooltip title={lockedQuestions.has(questionId) ? "Question is locked" : "Edit question"}>
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(questionId, index)}
                        disabled={lockedQuestions.has(questionId)}
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
                      onClick={() => handleSave(questionId, index)}
                      color="primary"
                      sx={{ p: 0.5 }}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleCancel(questionId)}
                      color="error"
                      sx={{ p: 0.5 }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
              </Box>
            </Box><Stack spacing={2}>
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
