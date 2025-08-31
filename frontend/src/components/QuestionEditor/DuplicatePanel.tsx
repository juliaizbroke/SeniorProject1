import React, { useState, useMemo } from 'react';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MergeIcon from '@mui/icons-material/Merge';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Question } from '../../types';

interface DuplicateGroup {
  id: number;
  questions: {
    question: Question;
    index: number;
    isRepresentative: boolean;
  }[];
  similarity: number;
}

interface DuplicatePanelProps {
  open: boolean;
  onClose: () => void;
  questions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  onScrollToQuestion: (index: number) => void;
}

export default function DuplicatePanel({
  open,
  onClose,
  questions,
  onQuestionsChange,
  onScrollToQuestion,
}: DuplicatePanelProps) {
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [mergeAction, setMergeAction] = useState<{
    type: 'merge' | 'replace' | 'ignore';
    groupId: number;
    keepIndex?: number;
  } | null>(null);

  const duplicateGroups = useMemo(() => {
    const groups = new Map<number, DuplicateGroup>();
    
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
        // (Representative always has similarity 1.0, which is artificial)
        if (question.duplicate_similarity && !question.duplicate_representative && question.duplicate_similarity > group.similarity) {
          group.similarity = question.duplicate_similarity;
        }
      }
    });
    
    // Filter out groups that only have 1 question in the current exam
    const actualDuplicateGroups = new Map<number, DuplicateGroup>();
    groups.forEach((group, groupId) => {
      if (group.questions.length > 1) { // Only keep groups with multiple questions in current exam
        actualDuplicateGroups.set(groupId, group);
      }
    });
    
    return Array.from(actualDuplicateGroups.values()).sort((a, b) => b.similarity - a.similarity);
  }, [questions]);

  const handleMergeQuestions = (groupId: number, keepIndex: number) => {
    const group = duplicateGroups.find(g => g.id === groupId);
    if (!group) return;

    const updatedQuestions = [...questions];
    const questionsToRemove = group.questions
      .filter(q => q.index !== keepIndex)
      .map(q => q.index)
      .sort((a, b) => b - a); // Remove from highest index first

    // Remove duplicate questions
    questionsToRemove.forEach(index => {
      updatedQuestions.splice(index, 1);
    });

    // Clear duplicate flags from remaining question
    const remainingQuestion = updatedQuestions.find(q => 
      q.duplicate_group_id === groupId && 
      (q.duplicate_representative || group.questions.some(gq => gq.index <= questions.indexOf(q) && gq.question === q))
    );
    
    if (remainingQuestion) {
      remainingQuestion.is_duplicate = false;
      remainingQuestion.duplicate_group_id = undefined;
      remainingQuestion.duplicate_representative = false;
      remainingQuestion.duplicate_similarity = undefined;
    }

    onQuestionsChange(updatedQuestions);
    setShowMergeDialog(false);
    setMergeAction(null);
  };

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
    setShowMergeDialog(false);
    setMergeAction(null);
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

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: '100vw',
            backgroundColor: '#f8fafc',
            borderLeft: '1px solid #e2e8f0',
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
              Duplicate Questions
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
            {duplicateGroups.length} group{duplicateGroups.length !== 1 ? 's' : ''} detected
          </Typography>
        </Box>

        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {duplicateGroups.length === 0 ? (
            <Alert severity="success" icon={<CheckCircleIcon />}>
              No duplicate questions found! Your question set looks good.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {duplicateGroups.map((group) => (
                <Card key={group.id} sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Group {group.id}
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

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      {group.questions.map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.5,
                            border: '1px solid',
                            borderColor: item.isRepresentative ? '#1d8348' : '#e2e8f0',
                            borderRadius: 1,
                            backgroundColor: item.isRepresentative ? '#f1f8e9' : '#fff',
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: item.isRepresentative ? '#e8f5e8' : '#f8fafc' },
                          }}
                          onClick={() => onScrollToQuestion(item.index)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              Q{item.index + 1}
                            </Typography>
                            {item.isRepresentative && (
                              <Chip
                                size="small"
                                label="Representative"
                                sx={{
                                  fontSize: '0.6rem',
                                  height: '16px',
                                  backgroundColor: '#1d8348',
                                  color: 'white',
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" sx={{ 
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}>
                            {item.question.question}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<MergeIcon />}
                        onClick={() => {
                          setMergeAction({ type: 'merge', groupId: group.id });
                          setSelectedGroup(group.id);
                          setShowMergeDialog(true);
                        }}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Merge
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<SwapHorizIcon />}
                        onClick={() => {
                          setMergeAction({ type: 'replace', groupId: group.id });
                          setSelectedGroup(group.id);
                          setShowMergeDialog(true);
                        }}
                        sx={{ fontSize: '0.75rem' }}
                      >
                        Replace
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
          )}
        </Box>
      </Drawer>

      {/* Merge/Replace Dialog */}
      <Dialog
        open={showMergeDialog}
        onClose={() => setShowMergeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {mergeAction?.type === 'merge' ? 'Merge Questions' : 'Replace Question'}
        </DialogTitle>
        <DialogContent>
          {mergeAction && selectedGroup !== null && (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                {mergeAction.type === 'merge' 
                  ? 'Select which question to keep. The others will be removed.'
                  : 'Select which question to use as the source, and which to replace.'
                }
              </Typography>
              
              {duplicateGroups
                .find(g => g.id === selectedGroup)
                ?.questions.map((item, idx) => (
                  <Card
                    key={idx}
                    sx={{
                      mb: 1,
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      '&:hover': { borderColor: '#1976d2' },
                    }}
                    onClick={() => {
                      if (mergeAction.type === 'merge') {
                        handleMergeQuestions(selectedGroup, item.index);
                      } else {
                        setMergeAction({ ...mergeAction, keepIndex: item.index });
                      }
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="subtitle2">Q{item.index + 1}</Typography>
                        {item.isRepresentative && (
                          <Chip size="small" label="Representative" color="success" />
                        )}
                      </Box>
                      <Typography variant="body2">
                        {item.question.question}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              }
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowMergeDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
