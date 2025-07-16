import { useState, useEffect, useRef } from 'react';
import { Question } from '../../types';

export const useQuestionEditor = (
  questions: Question[],
  allQuestionsPool: Question[],
  onQuestionsChange: (questions: Question[]) => void,
  forceRefreshLocks?: number
) => {
  const [editingQuestions, setEditingQuestions] = useState<Set<string>>(new Set());
  const [tempQuestions, setTempQuestions] = useState<Question[]>([]);
  const [lockedQuestions, setLockedQuestions] = useState<Set<string>>(new Set());
  const [lockedCategories, setLockedCategories] = useState<Set<string>>(new Set());
  const [hasIdCollisions, setHasIdCollisions] = useState(false);
  const hasAutoShuffled = useRef(false);
  const prevQuestionSetId = useRef<string>('');

  // Utility function to generate content hash for questions
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

  // Generate unique ID for each question
  const getQuestionId = (question: Question, index: number) => {
    const contentParts = [
      `idx:${index}`,
      `type:${question.type || 'unknown'}`,
      `q:${question.question?.trim() || `empty_q_${index}`}`,
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
    
    const fullContent = contentParts.join('||');
    
    let hash = '';
    try {
      let hashValue = 0;
      for (let i = 0; i < fullContent.length; i++) {
        const char = fullContent.charCodeAt(i);
        hashValue = ((hashValue << 5) - hashValue) + char;
        hashValue = hashValue & hashValue;
      }
      hash = Math.abs(hashValue).toString(36);
    } catch (error) {
      hash = Math.random().toString(36).substr(2, 9);
    }
    
    const contentLength = fullContent.length.toString(36);
    const finalId = `q${index}_${hash.substring(0, 20)}_${contentLength}`;
    
    return finalId;
  };

  // Load locked questions from localStorage on component mount
  useEffect(() => {
    const storedLockedQuestions = localStorage.getItem('lockedQuestions');
    const storedLockedCategories = localStorage.getItem('lockedCategories');
    
    if (storedLockedQuestions) {
      try {
        const parsed = JSON.parse(storedLockedQuestions);
        if (Array.isArray(parsed)) {
          setLockedQuestions(new Set(parsed));
        }
      } catch (error) {
        console.error('Error parsing locked questions from localStorage:', error);
      }
    }
    
    if (storedLockedCategories) {
      try {
        const parsed = JSON.parse(storedLockedCategories);
        if (Array.isArray(parsed)) {
          setLockedCategories(new Set(parsed));
        }
      } catch (error) {
        console.error('Error parsing locked categories from localStorage:', error);
      }
    }
  }, []);

  // Force refresh lock state when parent triggers it
  useEffect(() => {
    if (forceRefreshLocks !== undefined) {
      const storedLockedQuestions = localStorage.getItem('lockedQuestions');
      const storedLockedCategories = localStorage.getItem('lockedCategories');
      
      if (storedLockedQuestions) {
        try {
          const parsed = JSON.parse(storedLockedQuestions);
          if (Array.isArray(parsed)) {
            setLockedQuestions(new Set(parsed));
          }
        } catch (error) {
          console.error('Error parsing locked questions from localStorage:', error);
        }
      }
      
      if (storedLockedCategories) {
        try {
          const parsed = JSON.parse(storedLockedCategories);
          if (Array.isArray(parsed)) {
            setLockedCategories(new Set(parsed));
          }
        } catch (error) {
          console.error('Error parsing locked categories from localStorage:', error);
        }
      }
    }
  }, [forceRefreshLocks]);

  // Save locked questions to localStorage
  useEffect(() => {
    localStorage.setItem('lockedQuestions', JSON.stringify(Array.from(lockedQuestions)));
  }, [lockedQuestions]);

  // Save locked categories to localStorage
  useEffect(() => {
    localStorage.setItem('lockedCategories', JSON.stringify(Array.from(lockedCategories)));
  }, [lockedCategories]);

  // Check for ID collisions
  useEffect(() => {
    const idMap = new Map<string, number>();
    const questionDetails = new Map<string, Question[]>();
    let collisionDetected = false;
    
    questions.forEach((question, index) => {
      const id = getQuestionId(question, index);
      const currentCount = idMap.get(id) || 0;
      idMap.set(id, currentCount + 1);
      
      if (!questionDetails.has(id)) {
        questionDetails.set(id, []);
      }
      questionDetails.get(id)!.push(question);
      
      if (currentCount > 0) {
        collisionDetected = true;
      }
    });
    
    setHasIdCollisions(collisionDetected);
    
    if (collisionDetected) {
      console.group('Question ID Collisions Detected');
      idMap.forEach((count, id) => {
        if (count > 1) {
          console.log(`ID "${id}" appears ${count} times:`);
          questionDetails.get(id)?.forEach((q, i) => {
            console.log(`  ${i + 1}. ${q.question?.substring(0, 50)}... (${q.category})`);
          });
        }
      });
      console.groupEnd();
    }
  }, [questions]);

  return {
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
  };
};
