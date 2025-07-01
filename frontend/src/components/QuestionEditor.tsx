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
  border: '1px solid #e0e0e0',
  borderRadius: theme.spacing(1),
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}));

export default function QuestionEditor({ questions, allQuestionsPool, onQuestionsChange, forceRefreshLocks }: QuestionEditorProps) {
  const [editingQuestions, setEditingQuestions] = useState<Set<string>>(new Set());
  const [tempQuestions, setTempQuestions] = useState<Question[]>([]);
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(new Set());
  const [lockedCategories, setLockedCategories] = useState<Set<string>>(new Set()); // New state for category locks
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

    // Load locked categories from localStorage
    const savedCategoryLocks = localStorage.getItem('lockedCategories');
    if (savedCategoryLocks) {
      try {
        const lockedCategoryIds = JSON.parse(savedCategoryLocks);
        setLockedCategories(new Set(lockedCategoryIds));
      } catch (error) {
        console.error('Error loading locked categories:', error);
      }
    } else {
      setLockedCategories(new Set());
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

      // Refresh category locks too
      const savedCategoryLocks = localStorage.getItem('lockedCategories');
      if (savedCategoryLocks) {
        try {
          const lockedCategoryIds = JSON.parse(savedCategoryLocks);
          setLockedCategories(new Set(lockedCategoryIds));
        } catch (error) {
          console.error('Error refreshing locked categories:', error);
        }
      } else {
        setLockedCategories(new Set());
      }
    }
  }, [forceRefreshLocks]);  // Save locked questions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lockedQuestions', JSON.stringify(Array.from(lockedQuestions)));
  }, [lockedQuestions]);

  // Save locked categories to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('lockedCategories', JSON.stringify(Array.from(lockedCategories)));
  }, [lockedCategories]);// Debug: Check for ID collisions
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
  };  // Check if shuffle is available and determine shuffle mode
  const getShuffleInfo = () => {
    const unlockedCount = questions.filter((q, i) => !lockedQuestions.has(getQuestionId(q, i)) && q.type !== 'fake answer').length;
    const fakeAnswerCount = questions.filter(q => q.type === 'fake answer').length;
    const lockedCount = questions.filter((q, i) => lockedQuestions.has(getQuestionId(q, i))).length;
    const totalShuffleableCount = unlockedCount + fakeAnswerCount; // Both unlocked and fake answers can be shuffled
    
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
      fakeAnswerCount,
      totalShuffleableCount,
      availableFromPool: totalAvailableFromCategories,
      questionsWithCategoryOptions,
      canShuffle: totalShuffleableCount > 0 && (totalShuffleableCount > 1 || totalAvailableFromCategories > 0),
      shuffleMode: 
        totalShuffleableCount === 1 && totalAvailableFromCategories === 0 ? 'disabled' :
        totalShuffleableCount === 1 && totalAvailableFromCategories > 0 ? 'replace' :
        totalAvailableFromCategories === 0 ? 'reorder' : 'fresh'
    };
  };

  const shuffleInfo = getShuffleInfo();  const getShuffleTooltip = () => {
    const fakeAnswerText = shuffleInfo.fakeAnswerCount > 0 ? ' (including fake answers)' : '';
    switch (shuffleInfo.shuffleMode) {
      case 'disabled':
        return 'Cannot shuffle: only 1 unlocked question with no alternatives available in the same category';
      case 'replace':
        return `Replace unlocked question with a different one from the same category${fakeAnswerText}`;
      case 'reorder':
        return `Reorder unlocked questions${fakeAnswerText} (no different questions available in their categories)`;
      case 'fresh':
        return `Replace unlocked questions with different ones from their respective categories${fakeAnswerText}`;
      default:
        return `Shuffle questions (category-aware)${fakeAnswerText}`;
    }
  };
  const handleShuffleQuestions = () => {
    const shuffleInfo = getShuffleInfo();
    
    const unlockedQuestionsWithIndex: { question: Question; index: number }[] = [];
    const lockedQuestionsWithIndex: { question: Question; index: number }[] = [];
    const lockedFakeAnswersWithIndex: { question: Question; index: number }[] = [];
    const unlockedFakeAnswersWithIndex: { question: Question; index: number }[] = [];
    
    // Separate questions by lock state and type, preserving category lock info
    questions.forEach((question, index) => {
      const questionId = getQuestionId(question, index);
      if (lockedQuestions.has(questionId)) {
        if (question.type === 'fake answer') {
          lockedFakeAnswersWithIndex.push({ question, index });
        } else {
          lockedQuestionsWithIndex.push({ question, index });
        }
      } else if (question.type === 'fake answer') {
        unlockedFakeAnswersWithIndex.push({ question, index });
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

      // Create sets to avoid duplication
      const lockedRealQuestionHashes = new Set(lockedQuestionsWithIndex.filter(item => item.question.type !== 'fake answer').map(item => getContentHash(item.question)));
      const currentUnlockedHashes = new Set([getContentHash(unlockedItem.question)]);
      const lockedFakeAnswerHashes = new Set(lockedFakeAnswersWithIndex.map(item => getContentHash(item.question)));
      
      // Collect all current answers to avoid duplication
      const allCurrentAnswers = new Set<string>();
      
      // Add locked real question answers
      lockedQuestionsWithIndex.forEach(item => {
        if (item.question.type !== 'fake answer' && item.question.answer?.trim()) {
          allCurrentAnswers.add(item.question.answer.trim().toLowerCase());
        }
      });
      
      // Add locked fake answer answers
      lockedFakeAnswersWithIndex.forEach(item => {
        if (item.question.answer?.trim()) {
          allCurrentAnswers.add(item.question.answer.trim().toLowerCase());
        }
      });
      
      // Add unlocked fake answer answers
      unlockedFakeAnswersWithIndex.forEach(item => {
        if (item.question.answer?.trim()) {
          allCurrentAnswers.add(item.question.answer.trim().toLowerCase());
        }
      });
      
      // Find available questions from the same category
      const availableFromSameCategory = allQuestionsPool.filter(q => {
        const contentHash = getContentHash(q);
        return q.category === targetCategory && 
               !lockedRealQuestionHashes.has(contentHash) && 
               !currentUnlockedHashes.has(contentHash) &&
               !lockedFakeAnswerHashes.has(contentHash) && // Don't duplicate locked fake answers
               !allCurrentAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate any current answer
               q.type !== 'fake answer'; // Exclude fake answers from real question pool
      });
      
      if (availableFromSameCategory.length > 0) {
        const randomReplacement = availableFromSameCategory[Math.floor(Math.random() * availableFromSameCategory.length)];
        const shuffledQuestions = [...questions];
        shuffledQuestions[unlockedItem.index] = randomReplacement;
        
        // Now handle fake answer shuffling for replace mode
        // Collect all real question answers (locked + newly selected) to avoid duplication
        const allRealAnswers = new Set<string>();
        
        // Add locked real question answers
        lockedQuestionsWithIndex.forEach(item => {
          if (item.question.type !== 'fake answer' && item.question.answer?.trim()) {
            allRealAnswers.add(item.question.answer.trim().toLowerCase());
          }
        });
        
        // Add the newly selected question answer
        if (randomReplacement.answer?.trim()) {
          allRealAnswers.add(randomReplacement.answer.trim().toLowerCase());
        }
        
        // Keep track of fake answers selected to avoid duplicates among fake answers
        const selectedFakeAnswers = new Set<string>();
        
        // PRIORITY 1: Locked fake answers are never changed - add their answers to prevent duplication
        lockedFakeAnswersWithIndex.forEach(lockedFakeItem => {
          if (lockedFakeItem.question.answer?.trim()) {
            selectedFakeAnswers.add(lockedFakeItem.question.answer.trim().toLowerCase());
          }
        });
        
        // PRIORITY 2: Process unlocked fake answers (includes category-locked ones)
        unlockedFakeAnswersWithIndex.forEach(fakeAnswerItem => {
          const fakeQuestionId = getQuestionId(fakeAnswerItem.question, fakeAnswerItem.index);
          const isCategoryLocked = lockedCategories.has(fakeQuestionId);
          
          if (isCategoryLocked) {
            // If category is locked, only shuffle the answer within the same category
            const lockedCategory = fakeAnswerItem.question.category?.replace('fake answers - ', '') || '';
            const availableForFakeAnswer = allQuestionsPool.filter(q => {
              return q.category === lockedCategory &&
                     !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                     !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                     q.type !== 'fake answer'; // Don't use existing fake answers
            });
            
            if (availableForFakeAnswer.length > 0) {
              const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
              const newFakeAnswer = { ...randomFakeReplacement };
              
              newFakeAnswer.type = 'fake answer';
              newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
              newFakeAnswer.q_type = 'fake';
              
              shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
              if (randomFakeReplacement.answer?.trim()) {
                selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
              }
            }
          } else {
            // Category not locked, can change both category and answer
            const availableForFakeAnswer = allQuestionsPool.filter(q => {
              return !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                     !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                     q.type !== 'fake answer'; // Don't use existing fake answers
            });
            
            if (availableForFakeAnswer.length > 0) {
              const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
              const newFakeAnswer = { ...randomFakeReplacement };
              
              newFakeAnswer.type = 'fake answer';
              newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
              newFakeAnswer.q_type = 'fake';
              
              shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
              if (randomFakeReplacement.answer?.trim()) {
                selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
              }
            }
          }
        });
        
        onQuestionsChange(shuffledQuestions);
        
        // Persist category locks for fake answers after shuffle
        const updatedCategoryLocks = new Set<string>();
        shuffledQuestions.forEach((question, index) => {
          if (question.type === 'fake answer') {
            const questionId = getQuestionId(question, index);
            // Check if this fake answer was category locked before shuffle
            const originalFakeAnswer = unlockedFakeAnswersWithIndex.find(item => item.index === index);
            if (originalFakeAnswer) {
              const originalQuestionId = getQuestionId(originalFakeAnswer.question, originalFakeAnswer.index);
              if (lockedCategories.has(originalQuestionId)) {
                updatedCategoryLocks.add(questionId);
              }
            }
          }
        });
        
        // Update category locks state and localStorage
        setLockedCategories(updatedCategoryLocks);
        localStorage.setItem('lockedCategories', JSON.stringify([...updatedCategoryLocks]));
      }
      // If no questions available from same category, do nothing (skip)
      return;
    }

    if (shuffleInfo.shuffleMode === 'reorder') {
      // Just shuffle positions of unlocked questions (category doesn't matter for reordering)
      const shuffledUnlocked = [...unlockedQuestionsWithIndex].sort(() => Math.random() - 0.5);
      const shuffledQuestions = [...questions];
      
      // Correctly map shuffled questions to original positions
      unlockedQuestionsWithIndex.forEach((originalItem, idx) => {
        shuffledQuestions[originalItem.index] = shuffledUnlocked[idx].question;
      });
      
      // Handle fake answer shuffling for reorder mode
      // Collect all real question answers (locked + reordered) to avoid duplication
      const allRealAnswers = new Set<string>();
      
      // Add locked real question answers
      lockedQuestionsWithIndex.forEach(item => {
        if (item.question.type !== 'fake answer' && item.question.answer?.trim()) {
          allRealAnswers.add(item.question.answer.trim().toLowerCase());
        }
      });
      
      // Add all current unlocked question answers (positions may have changed but questions are the same)
      unlockedQuestionsWithIndex.forEach(item => {
        if (item.question.answer?.trim()) {
          allRealAnswers.add(item.question.answer.trim().toLowerCase());
        }
      });
      
      // Keep track of fake answers selected to avoid duplicates among fake answers
      const selectedFakeAnswers = new Set<string>();
      
      // PRIORITY 1: Locked fake answers are never changed - add their answers to prevent duplication
      lockedFakeAnswersWithIndex.forEach(lockedFakeItem => {
        if (lockedFakeItem.question.answer?.trim()) {
          selectedFakeAnswers.add(lockedFakeItem.question.answer.trim().toLowerCase());
        }
      });
      
      // PRIORITY 2: Process unlocked fake answers (includes category-locked ones)
      unlockedFakeAnswersWithIndex.forEach(fakeAnswerItem => {
        const fakeQuestionId = getQuestionId(fakeAnswerItem.question, fakeAnswerItem.index);
        const isCategoryLocked = lockedCategories.has(fakeQuestionId);
        
        if (isCategoryLocked) {
          // If category is locked, only shuffle the answer within the same category
          const lockedCategory = fakeAnswerItem.question.category?.replace('fake answers - ', '') || '';
          const availableForFakeAnswer = allQuestionsPool.filter(q => {
            return q.category === lockedCategory &&
                   !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                   !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                   q.type !== 'fake answer'; // Don't use existing fake answers
          });
          
          if (availableForFakeAnswer.length > 0) {
            const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
            const newFakeAnswer = { ...randomFakeReplacement };
            
            newFakeAnswer.type = 'fake answer';
            newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
            newFakeAnswer.q_type = 'fake';
            
            shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
            if (randomFakeReplacement.answer?.trim()) {
              selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
            }
          }
        } else {
          // Category not locked, can change both category and answer
          const availableForFakeAnswer = allQuestionsPool.filter(q => {
            return !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                   !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                   q.type !== 'fake answer'; // Don't use existing fake answers
          });
          
          if (availableForFakeAnswer.length > 0) {
            const randomFakeReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
            const newFakeAnswer = { ...randomFakeReplacement };
            
            newFakeAnswer.type = 'fake answer';
            newFakeAnswer.category = `fake answers - ${randomFakeReplacement.category}`;
            newFakeAnswer.q_type = 'fake';
            
            shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
            if (randomFakeReplacement.answer?.trim()) {
              selectedFakeAnswers.add(randomFakeReplacement.answer.trim().toLowerCase());
            }
          }
        }
      });
      
      onQuestionsChange(shuffledQuestions);
      
      // Persist category locks for fake answers after shuffle
      const updatedCategoryLocks = new Set<string>();
      shuffledQuestions.forEach((question, index) => {
        if (question.type === 'fake answer') {
          const questionId = getQuestionId(question, index);
          // Check if this fake answer was category locked before shuffle
          const originalFakeAnswer = unlockedFakeAnswersWithIndex.find(item => item.index === index);
          if (originalFakeAnswer) {
            const originalQuestionId = getQuestionId(originalFakeAnswer.question, originalFakeAnswer.index);
            if (lockedCategories.has(originalQuestionId)) {
              updatedCategoryLocks.add(questionId);
            }
          }
        }
      });
      
      // Update category locks state and localStorage
      setLockedCategories(updatedCategoryLocks);
      localStorage.setItem('lockedCategories', JSON.stringify([...updatedCategoryLocks]));
      return;
    }    // Default 'fresh' mode - category-aware replacement
    const lockedRealQuestionHashes = new Set(lockedQuestionsWithIndex.filter(item => item.question.type !== 'fake answer').map(item => getContentHash(item.question)));
    const currentUnlockedHashes = new Set(unlockedQuestionsWithIndex.map(item => getContentHash(item.question)));
    
    // Collect all current answers to avoid duplication
    const allCurrentAnswers = new Set<string>();
    
    // Add locked real question answers
    lockedQuestionsWithIndex.forEach(item => {
      if (item.question.type !== 'fake answer' && item.question.answer?.trim()) {
        allCurrentAnswers.add(item.question.answer.trim().toLowerCase());
      }
    });
    
    // Add locked fake answer answers
    lockedFakeAnswersWithIndex.forEach(item => {
      if (item.question.answer?.trim()) {
        allCurrentAnswers.add(item.question.answer.trim().toLowerCase());
      }
    });
    
    // Add unlocked real question answers
    unlockedQuestionsWithIndex.forEach(item => {
      if (item.question.answer?.trim()) {
        allCurrentAnswers.add(item.question.answer.trim().toLowerCase());
      }
    });
    
    // Add unlocked fake answer answers
    unlockedFakeAnswersWithIndex.forEach(item => {
      if (item.question.answer?.trim()) {
        allCurrentAnswers.add(item.question.answer.trim().toLowerCase());
      }
    });
    
    const shuffledQuestions = [...questions];
    
    // STEP 1: Process each unlocked REAL question individually for category-aware replacement
    unlockedQuestionsWithIndex.forEach(unlockedItem => {
      const targetCategory = unlockedItem.question.category;
      
      // Remove the old answer from our tracking set
      if (unlockedItem.question.answer?.trim()) {
        allCurrentAnswers.delete(unlockedItem.question.answer.trim().toLowerCase());
      }
      
      // Find available questions from the same category (excluding locked, current unlocked, fake answers, and answer duplicates)
      const availableFromSameCategory = allQuestionsPool.filter(q => {
        const contentHash = getContentHash(q);
        return q.category === targetCategory && 
               !lockedRealQuestionHashes.has(contentHash) && 
               !currentUnlockedHashes.has(contentHash) &&
               !allCurrentAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate any current answer
               q.type !== 'fake answer'; // Exclude fake answers from real question pool
      });
      
      // Only replace if there are different questions available in the same category
      if (availableFromSameCategory.length > 0) {
        const randomQuestion = availableFromSameCategory[Math.floor(Math.random() * availableFromSameCategory.length)];
        shuffledQuestions[unlockedItem.index] = randomQuestion;
        
        // Update current unlocked hashes to avoid duplicates in subsequent iterations
        currentUnlockedHashes.delete(getContentHash(unlockedItem.question));
        currentUnlockedHashes.add(getContentHash(randomQuestion));
        
        // Add the new answer to our tracking set
        if (randomQuestion.answer?.trim()) {
          allCurrentAnswers.add(randomQuestion.answer.trim().toLowerCase());
        }
      } else {
        // If no replacement found, add the original answer back
        if (unlockedItem.question.answer?.trim()) {
          allCurrentAnswers.add(unlockedItem.question.answer.trim().toLowerCase());
        }
      }
      // If no different questions available from same category, keep the original question
      // (This maintains the constraint that questions should only be replaced within their category)
    });
    
    // STEP 2: Handle fake answer shuffling separately - AFTER real questions have been shuffled
    // Collect all current real answers to avoid duplication
    const allRealAnswers = new Set<string>();
    
    // Add locked real question answers
    lockedQuestionsWithIndex.forEach(item => {
      if (item.question.type !== 'fake answer' && item.question.answer?.trim()) {
        allRealAnswers.add(item.question.answer.trim().toLowerCase());
      }
    });
    
    // Add the NEW shuffled real question answers
    unlockedQuestionsWithIndex.forEach(item => {
      const newQuestion = shuffledQuestions[item.index];
      if (newQuestion.answer?.trim()) {
        allRealAnswers.add(newQuestion.answer.trim().toLowerCase());
      }
    });
    
    // Keep track of fake answers selected in this shuffle to avoid duplicates among fake answers
    const selectedFakeAnswers = new Set<string>();
    
    // PRIORITY 1: Locked fake answers are never changed - add their answers to prevent duplication
    lockedFakeAnswersWithIndex.forEach(lockedFakeItem => {
      if (lockedFakeItem.question.answer?.trim()) {
        selectedFakeAnswers.add(lockedFakeItem.question.answer.trim().toLowerCase());
      }
    });
    
    // PRIORITY 2: Process unlocked fake answers (includes category-locked ones)
    unlockedFakeAnswersWithIndex.forEach(fakeAnswerItem => {
      const fakeQuestionId = getQuestionId(fakeAnswerItem.question, fakeAnswerItem.index);
      const isCategoryLocked = lockedCategories.has(fakeQuestionId);
      
      if (isCategoryLocked) {
        // If category is locked, only shuffle the answer within the same category
        const lockedCategory = fakeAnswerItem.question.category?.replace('fake answers - ', '') || '';
        const availableForFakeAnswer = allQuestionsPool.filter(q => {
          return q.category === lockedCategory &&
                 !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                 !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                 q.type !== 'fake answer'; // Don't use existing fake answers
        });
        
        if (availableForFakeAnswer.length > 0) {
          const randomReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
          const newFakeAnswer = { ...randomReplacement };
          
          newFakeAnswer.type = 'fake answer';
          newFakeAnswer.category = `fake answers - ${randomReplacement.category}`;
          newFakeAnswer.q_type = 'fake';
          
          shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
          if (randomReplacement.answer?.trim()) {
            selectedFakeAnswers.add(randomReplacement.answer.trim().toLowerCase());
          }
        }
      } else {
        // Category not locked, can change both category and answer
        const availableForFakeAnswer = allQuestionsPool.filter(q => {
          return !allRealAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate real answers
                 !selectedFakeAnswers.has(q.answer?.trim().toLowerCase() || '') && // Don't duplicate fake answers
                 q.type !== 'fake answer'; // Don't use existing fake answers
        });
        
        if (availableForFakeAnswer.length > 0) {
          const randomReplacement = availableForFakeAnswer[Math.floor(Math.random() * availableForFakeAnswer.length)];
          const newFakeAnswer = { ...randomReplacement };
          
          newFakeAnswer.type = 'fake answer';
          newFakeAnswer.category = `fake answers - ${randomReplacement.category}`;
          newFakeAnswer.q_type = 'fake';
          
          shuffledQuestions[fakeAnswerItem.index] = newFakeAnswer;
          if (randomReplacement.answer?.trim()) {
            selectedFakeAnswers.add(randomReplacement.answer.trim().toLowerCase());
          }
        }
      }
      // If no alternatives available, keep the current fake answer
    });
    
    onQuestionsChange(shuffledQuestions);
    
    // Persist category locks for fake answers after shuffle  
    const updatedCategoryLocks = new Set<string>();
    shuffledQuestions.forEach((question, index) => {
      if (question.type === 'fake answer') {
        const questionId = getQuestionId(question, index);
        // Check if this fake answer was category locked before shuffle
        const originalFakeAnswer = unlockedFakeAnswersWithIndex.find(item => item.index === index);
        if (originalFakeAnswer) {
          const originalQuestionId = getQuestionId(originalFakeAnswer.question, originalFakeAnswer.index);
          if (lockedCategories.has(originalQuestionId)) {
            updatedCategoryLocks.add(questionId);
          }
        }
      }
    });
    
    // Also preserve locked fake answers in category locks (they keep their locks)
    lockedFakeAnswersWithIndex.forEach(({ question, index }) => {
      const questionId = getQuestionId(question, index);
      if (lockedCategories.has(questionId)) {
        updatedCategoryLocks.add(questionId);
      }
    });
    
    // Update category locks state and localStorage
    setLockedCategories(updatedCategoryLocks);
    localStorage.setItem('lockedCategories', JSON.stringify([...updatedCategoryLocks]));
  };  const handleClearAllLocks = () => {
    setLockedQuestions(new Set());
    setLockedCategories(new Set());
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
          bgcolor: '#e8f4fd', 
          borderRadius: 1, 
          border: '1px solid #4682b4',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <Typography variant="body2" sx={{ color: '#2c5282', flex: 1 }}>
            ⚠️ Some questions have similar content and may share lock states. Check browser console for details.
          </Typography>
        </Box>
      )}

      {/* Show info about locks in other tabs */}
      {lockedQuestions.size > 0 && !questions.some((q, i) => lockedQuestions.has(getQuestionId(q, i))) && (
        <Box sx={{ 
          p: 2, 
          bgcolor: '#e8f4fd', 
          borderRadius: 1, 
          border: '1px solid #4682b4',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <LockIcon sx={{ color: '#4682b4' }} />
          <Typography variant="body2" sx={{ color: '#2c5282', flex: 1 }}>
            You have {lockedQuestions.size} locked question(s) in other tabs. They remain locked even when not visible.
          </Typography>
        </Box>
      )}      {/* Action Buttons */}
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
        )}        <Tooltip title={getShuffleTooltip()}>
          <span>
            <Button
              variant="outlined"
              startIcon={<ShuffleIcon />}
              onClick={handleShuffleQuestions}
              disabled={!getShuffleInfo().canShuffle}
              sx={{
                borderColor: getShuffleInfo().canShuffle ? '#000' : '#ccc',
                color: getShuffleInfo().canShuffle ? '#000' : '#999',
                '&:hover': {
                  borderColor: getShuffleInfo().canShuffle ? '#333' : '#ccc',
                  backgroundColor: getShuffleInfo().canShuffle ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
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
      </Box>      {/* Group fake answers together */}
      {questions.some(q => q.type === 'fake answer') && (
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
                          const newCategory = e.target.value.trim();
                          const formattedCategory = newCategory ? `fake answers - ${newCategory}` : 'fake answers - manual';
                          handleQuestionChange(index, 'category', formattedCategory);
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
                    
                    {/* Category Lock Button */}
                    <Tooltip title={isCategoryLocked ? "Unlock category (allows category shuffling)" : "Lock category (only answer will shuffle)"}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleCategoryLockToggle(questionId)}
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
                        onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
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
                      
                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {/* Main Lock/Unlock Button (locks both category and answer) */}
                      <Tooltip title={isLocked ? "Unlock fake answer (unlocks both category and answer)" : "Lock fake answer (locks both category and answer)"}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleLockToggle(questionId)}
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
                              onClick={() => handleEdit(questionId, index)}
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
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </QuestionPaper>
      )}

      {/* Regular questions (non-fake answers) */}
      {questions.filter(q => q.type !== 'fake answer').map((question, originalIndex) => {
        // Find the original index in the full questions array
        const index = questions.findIndex((q, i) => i >= originalIndex && q === question);
        const questionId = getQuestionId(question, index);
        const isEditing = editingQuestions.has(questionId);
        const isLocked = lockedQuestions.has(questionId);
        const currentQuestion = isEditing ? tempQuestions[index] || question : question;
          return (          <QuestionPaper 
            key={`question-${index}-${question.type}`} 
            elevation={0}
            sx={{
              opacity: isLocked ? 0.8 : 1,
              borderColor: isLocked ? '#4682b4' : '#e0e0e0',
              borderWidth: isLocked ? '2px' : '1px',
              backgroundColor: isLocked ? '#e8f4fd' : '#ffffff',
              borderStyle: 'solid',
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
                  {lockedQuestions.has(questionId) && (
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
              </Box>              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                {/* Lock/Unlock Button */}
                <Tooltip title={lockedQuestions.has(questionId) ? "Unlock question" : "Lock question"}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleLockToggle(questionId)}
                    sx={{ 
                      p: 0.5,
                      color: lockedQuestions.has(questionId) ? '#4682b4' : '#666',
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
