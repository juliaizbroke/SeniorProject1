import React, { useEffect } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Tooltip,
} from '@mui/material';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import LockIcon from '@mui/icons-material/Lock';

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

  const handleEdit = (questionId: string, index: number) => {
    if (lockedQuestions.has(questionId)) {
      return;
    }
    setEditingQuestions(prev => new Set(prev).add(questionId));
    const newTempQuestions = [...questions];
    setTempQuestions(newTempQuestions);
  };

  const handleSave = (questionId: string, index: number) => {
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
  }, [questions]);

  useEffect(() => {
    return () => {
      hasAutoShuffled.current = false;
    };
  }, []);

  return (
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
          <RegularQuestion
            key={`question-${index}-${question.type}`}
            question={question}
            index={index}
            isEditing={isEditing}
            isLocked={isLocked}
            currentQuestion={currentQuestion}
            questionId={questionId}
            onQuestionChange={handleQuestionChange}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
            onLockToggle={handleLockToggle}
          />
        );
      })}
    </Stack>
  );
}
