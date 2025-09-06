import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Tooltip,
  Fab,
  Badge,
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockIcon from '@mui/icons-material/Lock';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { Question } from '../../types';
import { useQuestionEditor } from './hooks';
import { getShuffleInfo, getShuffleTooltip } from './shuffleUtils';
import { createShuffleHandler } from './shuffleLogic';
import FakeAnswers from './FakeAnswers';
import RegularQuestion from './RegularQuestion';
import DuplicatePanel from './DuplicatePanel';

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
  const [isDuplicatePanelOpen, setIsDuplicatePanelOpen] = useState(false);
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

  const duplicateCount = questions.filter(q => {
    if (!q.is_duplicate || !q.duplicate_group_id) return false;
    // Count how many questions in current exam have the same duplicate_group_id
    const sameGroupQuestions = questions.filter(other => 
      other.duplicate_group_id === q.duplicate_group_id
    );
    return sameGroupQuestions.length > 1;
  }).length;
  
  const duplicateGroups = new Set(
    questions
      .filter(q => {
        if (!q.is_duplicate || !q.duplicate_group_id) return false;
        const sameGroupQuestions = questions.filter(other => 
          other.duplicate_group_id === q.duplicate_group_id
        );
        return sameGroupQuestions.length > 1;
      })
      .map(q => q.duplicate_group_id)
  );

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
    setIsDuplicatePanelOpen(true);
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
          <LockIcon sx={{ color: '#4682b4' }} />
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
              startIcon={<LockOpenOutlinedIcon />}
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
      {questions.filter(q => q.type !== 'fake answer').map((question, originalIndex) => {
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

    {/* Floating Action Button for Duplicates */}
    {duplicateCount > 0 && (
      <Fab
        color="warning"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          backgroundColor: '#ff9800',
          '&:hover': {
            backgroundColor: '#f57c00',
          },
        }}
        onClick={() => setIsDuplicatePanelOpen(true)}
      >
        <Badge badgeContent={duplicateGroups.size} color="error">
          <ContentCopyIcon />
        </Badge>
      </Fab>
    )}

    {/* Duplicate Management Panel */}
    <DuplicatePanel
      open={isDuplicatePanelOpen}
      onClose={() => setIsDuplicatePanelOpen(false)}
      questions={questions}
      onQuestionsChange={onQuestionsChange}
      onScrollToQuestion={handleScrollToQuestion}
    />
  </Box>
  );
}
