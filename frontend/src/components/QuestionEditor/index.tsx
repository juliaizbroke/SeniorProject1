import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Tooltip,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { Question } from '../../types';
import { useQuestionEditor } from './hooks';
import { getShuffleInfo, getShuffleTooltip } from './shuffleUtils';
import { createShuffleHandler } from './shuffleLogic';
import FakeAnswers from './FakeAnswers';
import RegularQuestion from './RegularQuestion';

interface QuestionEditorProps {
  questions: Question[];
  allQuestionsPool: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  forceRefreshLocks?: number;
}

export default function QuestionEditor({ 
  questions, 
  allQuestionsPool, 
  onQuestionsChange, 
  forceRefreshLocks 
}: QuestionEditorProps) {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showChooseDialog, setShowChooseDialog] = useState(false);
  const [chooseAction, setChooseAction] = useState<{
    groupId: number;
    keepIndex?: number;
  } | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const {
    editingQuestions,
    setEditingQuestions,
    tempQuestions,
    setTempQuestions,
    lockedQuestions,
    setLockedQuestions,
    lockedCategories,
    setLockedCategories,
    hasIdCollisions,
    hasAutoShuffled,
    prevQuestionSetId,
    getContentHash,
    getQuestionId
  } = useQuestionEditor(questions, allQuestionsPool, onQuestionsChange, forceRefreshLocks);

  const handleQuestionChange = (index: number, field: keyof Question, value: string | boolean) => {
    const updatedQuestions = [...tempQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setTempQuestions(updatedQuestions);
  };

  const handleEdit = (questionId: string) => {
    if (lockedQuestions.has(questionId)) {
      return;
    }
    setEditingQuestions(prev => new Set(prev).add(questionId));
    const newTempQuestions = [...questions];
    setTempQuestions(newTempQuestions);
  };

  const handleSave = (questionId: string) => {
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
    setTempQuestions([...questions]);
  };

  const handleLockToggle = (questionId: string) => {
    setLockedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleCategoryLockToggle = (questionId: string) => {
    setLockedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleClearAllLocks = () => {
    setLockedQuestions(new Set());
    setLockedCategories(new Set());
    setEditingQuestions(new Set());
    hasAutoShuffled.current = false;
  };

  const handleScrollToQuestion = (index: number) => {
    questionRefs.current[index]?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  };

  // Grammar issues summary
  const grammarIssueIndexes = questions
    .map((q, i) => (q.has_grammar_issues ? i : -1))
    .filter((i) => i >= 0);

  const handleShowDuplicates = () => {
    // This function is no longer needed but kept for compatibility
    // The duplicate groups are now shown inline at the top
  };

  // Handle choosing one question from a duplicate group
  const handleChooseOne = (groupId: number, keepIndex: number) => {
    const updatedQuestions = [...questions];
    
    // Find the kept question to determine category
    const keptQuestion = updatedQuestions[keepIndex];
    const targetCategory = keptQuestion.category;
    
    // Get all questions in this duplicate group (except the kept one)
    const duplicateIndexes = questions
      .map((q, index) => q.duplicate_group_id === groupId && index !== keepIndex ? index : -1)
      .filter(index => index >= 0);

    // Temporarily pin the kept question by adding it to locked questions
    const keptQuestionId = getQuestionId(keptQuestion, keepIndex);
    setLockedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(keptQuestionId);
      return newSet;
    });

    // Create content hashes to avoid duplication
    const currentQuestionHashes = new Set(
      updatedQuestions.map(q => getContentHash(q))
    );

    // Replace duplicate questions with random questions from the pool
    duplicateIndexes.forEach(index => {
      // Find available questions from the same category that aren't already in the exam
      const availableQuestions = allQuestionsPool.filter(q => {
        const contentHash = getContentHash(q);
        return q.category === targetCategory && 
               !currentQuestionHashes.has(contentHash) &&
               q.type !== 'fake answer'; // Exclude fake answers
      });
      
      if (availableQuestions.length > 0) {
        // Pick a random replacement
        const randomReplacement = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        updatedQuestions[index] = randomReplacement;
        
        // Add the new question's hash to prevent selecting it again
        currentQuestionHashes.add(getContentHash(randomReplacement));
      }
      // If no replacement available, keep the duplicate (shouldn't happen in normal cases)
    });

    // Clear duplicate flags from all questions in the group
    updatedQuestions.forEach(q => {
      if (q.duplicate_group_id === groupId) {
        q.is_duplicate = false;
        q.duplicate_group_id = undefined;
        q.duplicate_representative = false;
        q.duplicate_similarity = undefined;
      }
    });

    onQuestionsChange(updatedQuestions);
    
    // Unpin the kept question after replacement is done
    setLockedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(keptQuestionId);
      return newSet;
    });
    
    setShowChooseDialog(false);
    setChooseAction(null);
  };

  // Handle ignoring a duplicate group
  const handleIgnoreGroup = (groupId: number) => {
    const updatedQuestions = questions.map(q => 
      q.duplicate_group_id === groupId 
        ? {
            ...q,
            is_duplicate: false,
            duplicate_group_id: undefined,
            duplicate_representative: false,
            duplicate_similarity: undefined,
          }
        : q
    );
    
    onQuestionsChange(updatedQuestions);
  };

  // Get duplicate groups for display at the top
  const getDuplicateGroups = () => {
    const groups = new Map<number, {
      id: number;
      questions: {
        question: Question;
        index: number;
        isRepresentative: boolean;
      }[];
      similarity: number;
    }>();
    
    questions.forEach((question, index) => {
      if (question.is_duplicate && question.duplicate_group_id) {
        const groupId = question.duplicate_group_id;
        
        if (!groups.has(groupId)) {
          groups.set(groupId, {
            id: groupId,
            questions: [],
            similarity: question.duplicate_representative ? 0 : (question.duplicate_similarity || 0),
          });
        }
        
        const group = groups.get(groupId)!;
        group.questions.push({
          question,
          index,
          isRepresentative: question.duplicate_representative || false,
        });
        
        // Update similarity to highest non-representative similarity in group
        if (question.duplicate_similarity && !question.duplicate_representative && question.duplicate_similarity > group.similarity) {
          group.similarity = question.duplicate_similarity;
        }
      }
    });
    
    // Filter out groups that only have 1 question in the current exam
    const actualDuplicateGroups = new Map();
    groups.forEach((group, groupId) => {
      if (group.questions.length > 1) { 
        actualDuplicateGroups.set(groupId, group);
      }
    });
    
    return Array.from(actualDuplicateGroups.values()).sort((a, b) => b.similarity - a.similarity);
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return '#c62828';
    if (similarity >= 0.8) return '#ef6c00';
    if (similarity >= 0.7) return '#f57c00';
    return '#fbc02d';
  };

  const getSimilarityText = (similarity: number) => {
    if (similarity >= 0.9) return 'Very High';
    if (similarity >= 0.8) return 'High';
    if (similarity >= 0.7) return 'Medium';
    return 'Low';
  };

  const getDuplicateTooltipText = (question: Question) => {
    if (!question.is_duplicate || !question.duplicate_group_id) return '';
    
    const groupQuestions = questions.filter(q => 
      q.duplicate_group_id === question.duplicate_group_id && 
      q !== question
    );
    
    // Only show tooltip if there are actually other questions in the group in current exam
    if (groupQuestions.length === 0) return '';
    
    const questionNumbers = groupQuestions.map((q) => {
      const idx = questions.indexOf(q);
      return `Q${idx + 1}`;
    }).join(', ');
    
    return `Similar to: ${questionNumbers}`;
  };

  const shuffleInfo = getShuffleInfo(questions, allQuestionsPool, lockedQuestions, getQuestionId, getContentHash);
  const handleShuffleQuestions = createShuffleHandler(
    questions,
    allQuestionsPool,
    lockedQuestions,
    lockedCategories,
    editingQuestions,
    getQuestionId,
    onQuestionsChange,
    setLockedCategories
  );

  // Auto-shuffle matching questions on first load
  useEffect(() => {
    if (questions.length === 0 || hasAutoShuffled.current) return;
    
    const hasMatchingQuestions = questions.some(q => q.type.toLowerCase() === 'matching');
    
    if (hasMatchingQuestions) {
      const hasUnlockedMatchingQuestions = questions.some((question, index) => {
        const questionId = getQuestionId(question, index);
        return question.type.toLowerCase() === 'matching' && 
               !lockedQuestions.has(questionId);
      });
      
      if (hasUnlockedMatchingQuestions) {
        console.log('Auto-shuffling matching questions on first load');
        hasAutoShuffled.current = true;
        setTimeout(() => {
          handleShuffleQuestions(shuffleInfo);
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length, questions.map(q => q.type).join('|')]);

  // Reset auto-shuffle flag when questions array changes significantly
  useEffect(() => {
    const questionSetId = questions.length > 0 ? 
      questions.map(q => `${q.type}_${q.question?.substring(0, 20) || 'empty'}`).join('|') : 
      'empty';
    
    if (prevQuestionSetId.current !== '' && prevQuestionSetId.current !== questionSetId) {
      console.log('Resetting auto-shuffle flag - question set changed');
      hasAutoShuffled.current = false;
    }
    
    prevQuestionSetId.current = questionSetId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  useEffect(() => {
    return () => {
      hasAutoShuffled.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack spacing={2}>
        {/* Duplicate Groups Display - At the top */}
        {(() => {
          const duplicateGroups = getDuplicateGroups();
          if (duplicateGroups.length === 0) return null;
          
          return (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1a1a1a' }}>
                Duplicate Question Groups ({duplicateGroups.length} group{duplicateGroups.length !== 1 ? 's' : ''})
              </Typography>
              <Stack spacing={2}>
                {duplicateGroups.map((group) => (
                  <Card key={group.id} sx={{ 
                    border: '2px solid',
                    borderColor: getSimilarityColor(group.similarity),
                    borderRadius: 2,
                    backgroundColor: `${getSimilarityColor(group.similarity)}10`,
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Group {group.id} ({group.questions.length} questions)
                        </Typography>
                        <Chip
                          size="small"
                          label={`${getSimilarityText(group.similarity)} (${Math.round(group.similarity * 100)}%)`}
                          sx={{
                            backgroundColor: getSimilarityColor(group.similarity),
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>

                      <Stack spacing={0} sx={{ mb: 3 }}>
                        {group.questions.map((item: {
                          question: Question;
                          index: number;
                          isRepresentative: boolean;
                        }, idx: number) => {
                          const questionId = getQuestionId(item.question, item.index);
                          const isEditing = editingQuestions.has(questionId);
                          const isLocked = lockedQuestions.has(questionId);
                          const currentQuestion = isEditing ? tempQuestions[item.index] || item.question : item.question;

                          return (
                            <Box
                              key={idx}
                              ref={(el) => { questionRefs.current[item.index] = el as HTMLDivElement | null; }}
                              sx={{
                                border: '3px solid #e0e0e0',
                                borderRadius: 1,
                                backgroundColor: 'transparent',
                                overflow: 'hidden',
                                mb: 1,
                                '&:hover': {
                                  backgroundColor: 'transparent',
                                },
                                // Override question paper styling to remove individual question colors and hover effects
                                '& .MuiPaper-root': {
                                  backgroundColor: 'transparent !important',
                                  border: 'none !important',
                                  boxShadow: 'none !important',
                                  marginBottom: '0 !important',
                                  '&:hover': {
                                    transform: 'none !important',
                                    boxShadow: 'none !important',
                                  }
                                }
                              }}
                            >
                              <RegularQuestion
                                question={item.question}
                                index={item.index}
                                isEditing={isEditing}
                                isLocked={isLocked}
                                currentQuestion={currentQuestion}
                                questionId={questionId}
                                allQuestions={questions}
                                onQuestionChange={handleQuestionChange}
                                onEdit={handleEdit}
                                onSave={handleSave}
                                onCancel={handleCancel}
                                onLockToggle={handleLockToggle}
                                onShowDuplicates={handleShowDuplicates}
                                duplicateTooltipText={getDuplicateTooltipText(item.question)}
                                hideSimilarityInfo={true}
                                hideDuplicateIcons={true}
                                hideDuplicateColors={true}
                              />
                            </Box>
                          );
                        })}
                      </Stack>

                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => {
                            setChooseAction({ groupId: group.id });
                            setSelectedGroup(group.id);
                            setShowChooseDialog(true);
                          }}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Choose One
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<VisibilityOffIcon />}
                          onClick={() => handleIgnoreGroup(group.id)}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          Ignore
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          );
        })()}

        {/* Show warning only for significant ID collisions */}
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
            <Typography variant="body2" sx={{ color: '#1a1a1a', flex: 1 }}>
              ⚠️ Some questions have similar content and may share lock states. Check browser console for details.
            </Typography>
          </Box>
        )}

        {/* Grammar issues summary */}
        {grammarIssueIndexes.length > 0 && (
          <Box sx={{
            p: 2,
            background: '#fff7ed',
            borderRadius: 1,
            border: '1px solid #ffedd5',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <Typography variant="body2" sx={{ color: '#7a5200', flex: 1 }}>
              {grammarIssueIndexes.length} question{grammarIssueIndexes.length !== 1 ? 's' : ''} with potential grammar issue{grammarIssueIndexes.length !== 1 ? 's' : ''}.
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleScrollToQuestion(grammarIssueIndexes[0])}
              sx={{ borderColor: '#f59e0b', color: '#b45309' }}
            >
              Jump to first
            </Button>
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
          <PushPinIcon sx={{ color: '#4682b4' }} />
          <Typography variant="body2" sx={{ color: '#1a1a1a', flex: 1 }}>
            You have {lockedQuestions.size} locked question(s) in other tabs. They remain locked even when not visible.
          </Typography>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
        {(lockedQuestions.size > 0 || lockedCategories.size > 0) && (
          <Tooltip title="Clear all locked questions and categories">
            <Button
              variant="outlined"
              startIcon={<PushPinOutlinedIcon />}
              onClick={handleClearAllLocks}
              sx={{
                borderColor: '#4682b4',
                color: '#4682b4',
                '&:hover': {
                  borderColor: '#2c5282',
                  backgroundColor: 'rgba(70, 130, 180, 0.04)',
                },
              }}
            >
              Clear All Locks ({lockedQuestions.size + lockedCategories.size})
            </Button>
          </Tooltip>
        )}
        
        <Tooltip title={getShuffleTooltip(shuffleInfo)}>
          <span>
            <Button
              variant="outlined"
              startIcon={<ShuffleIcon />}
              onClick={() => handleShuffleQuestions(shuffleInfo)}
              disabled={!shuffleInfo.canShuffle}
              sx={{
                borderColor: shuffleInfo.canShuffle ? '#1e3a8a' : '#ccc',
                color: shuffleInfo.canShuffle ? '#1e3a8a' : '#999',
                '&:hover': {
                  borderColor: shuffleInfo.canShuffle ? '#1e40af' : '#ccc',
                  backgroundColor: shuffleInfo.canShuffle ? 'rgba(30, 58, 138, 0.04)' : 'transparent',
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
      </Box>

      {/* Fake Answers Component */}
      <FakeAnswers
        questions={questions}
        editingQuestions={editingQuestions}
        tempQuestions={tempQuestions}
        lockedQuestions={lockedQuestions}
        lockedCategories={lockedCategories}
        getQuestionId={getQuestionId}
        onQuestionChange={handleQuestionChange}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onLockToggle={handleLockToggle}
        onCategoryLockToggle={handleCategoryLockToggle}
      />

      {/* Regular Questions */}
      {questions.filter(q => {
        // Filter out fake answers
        if (q.type === 'fake answer') return false;
        
        // Filter out questions that are part of duplicate groups with multiple questions in current exam
        if (q.is_duplicate && q.duplicate_group_id) {
          const sameGroupQuestions = questions.filter(other => 
            other.duplicate_group_id === q.duplicate_group_id
          );
          // Only filter out if there are actually multiple questions in the group
          if (sameGroupQuestions.length > 1) return false;
        }
        
        return true;
      }).map((question, originalIndex) => {
        const index = questions.findIndex((q, i) => i >= originalIndex && q === question);
        const questionId = getQuestionId(question, index);
        const isEditing = editingQuestions.has(questionId);
        const isLocked = lockedQuestions.has(questionId);
        const currentQuestion = isEditing ? tempQuestions[index] || question : question;

        return (
          <div
            key={`question-${index}-${question.type}`}
            ref={(el) => { questionRefs.current[index] = el; }}
          >
            <RegularQuestion
              question={question}
              index={index}
              isEditing={isEditing}
              isLocked={isLocked}
              currentQuestion={currentQuestion}
              questionId={questionId}
              allQuestions={questions}
              onQuestionChange={handleQuestionChange}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancel}
              onLockToggle={handleLockToggle}
              onShowDuplicates={handleShowDuplicates}
              duplicateTooltipText={getDuplicateTooltipText(question)}
            />
          </div>
        );
      })}
    </Stack>

    {/* Choose One Dialog */}
    <Dialog
      open={showChooseDialog}
      onClose={() => setShowChooseDialog(false)}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle>
        Choose One Question to Keep
      </DialogTitle>
      <DialogContent>
        {chooseAction && selectedGroup !== null && (
          <>
            <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
              Select which question to keep. The others will be removed from the exam.
            </Typography>
            
            {getDuplicateGroups()
              .find(g => g.id === selectedGroup)
              ?.questions.map((item: {
                question: Question;
                index: number;
                isRepresentative: boolean;
              }, idx: number) => {
                const questionId = getQuestionId(item.question, item.index);
                const isEditing = editingQuestions.has(questionId);
                const isLocked = lockedQuestions.has(questionId);
                const currentQuestion = isEditing ? tempQuestions[item.index] || item.question : item.question;

                return (
                  <Card
                    key={idx}
                    sx={{
                      mb: 2,
                      border: '2px solid #e0e0e0',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#1976d2' },
                      backgroundColor: '#fff',
                    }}
                    onClick={() => {
                      handleChooseOne(selectedGroup, item.index);
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <RegularQuestion
                        question={item.question}
                        index={item.index}
                        isEditing={false} // Don't allow editing in dialog
                        isLocked={isLocked}
                        currentQuestion={currentQuestion}
                        questionId={questionId}
                        allQuestions={questions}
                        onQuestionChange={handleQuestionChange}
                        onEdit={() => {}} // Disable editing in dialog
                        onSave={() => {}} // Disable saving in dialog
                        onCancel={() => {}} // Disable cancel in dialog
                        onLockToggle={handleLockToggle}
                        onShowDuplicates={handleShowDuplicates}
                        duplicateTooltipText={getDuplicateTooltipText(item.question)}
                        hideSimilarityInfo={true}
                        hideDuplicateIcons={true}
                        hideDuplicateColors={true}
                      />
                    </CardContent>
                  </Card>
                );
              })
            }
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowChooseDialog(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
    </Box>
  );
}
